/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

package com.builder.lambda.utils;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifDirectoryBase;
import com.drew.metadata.exif.ExifIFD0Directory;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import software.amazon.lambda.powertools.logging.Logging;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Color;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * This class processes {@link InputStream} based image file to apply redaction
 * using a list of {@link PDRectangle} information.
 */
public class ImageRedactor implements Redactor {

    Logger log = LogManager.getLogger(ImageRedactor.class);

    /**
     * This method applies redaction on an image file using bounding-box
     * information.
     *
     * @param document   - contains input image file
     * @param redactData - the bounding boxes to be redacted
     * @return - redacted image file
     * @throws IOException if it is unable to process the document to redact
     */
    @Override
    @Logging
    public ByteArrayOutputStream processDocument(
            Document document, Map<String, List<BoundingBox>> boundingBoxesByPage) throws IOException {
        Graphics2D graphics = null;
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // attempting to rotate image based on metadata
            BufferedImage image = loadImageWithCorrection(document);

            graphics = image.createGraphics();
            graphics.setColor(Color.BLACK);

            List<BoundingBox> currentPageBoxes = boundingBoxesByPage.get("1"); // Image can only be a single page

            log.info("Redacting image with {} bounding boxes", currentPageBoxes.size());

            for (BoundingBox boundingBox : currentPageBoxes) {
                if (boundingBox != null) {
                    graphics.fill(new Rectangle2D.Double(
                            boundingBox.getLeft() * image.getWidth(),
                            boundingBox.getTop() * image.getHeight(),
                            boundingBox.getWidth() * image.getWidth(),
                            boundingBox.getHeight() * image.getHeight()));
                }
            }

            ImageIO.write(image, document.fileType.name(), outputStream);
            return outputStream;
        } catch (IOException ioException) {
            log.error("Unable to load image file");
            throw ioException;
        } catch (NullPointerException e) {
            String errMsg = "No bounding boxes eligible for image redaction found based on request";
            log.error(errMsg);
            throw new IllegalArgumentException(errMsg);
        } finally {
            if (graphics != null) {
                graphics.dispose();
            }
        }
    }

    /**
     * Loads the image document and applies transformations in order to ensure our
     * output is correctly oriented.
     * Images from many sources may be oriented the direction of the camera sensor,
     * but be intended to be viewed rotated.
     * When this is the case, EXIF metadata packed in the image file will indicate
     * how the image should be rotated.
     * This function serves to perform these rotations/flips as needed when loading
     * the image, since the built-in
     * ImageIO library does not handle this automatically.
     * 
     * @param document
     * @return the loaded image, with orientation corrected if necessary and
     *         possible.
     * @throws IOException if loading the image fails
     */
    public BufferedImage loadImageWithCorrection(Document document) throws IOException {
        // duplicate the input stream to allow for the image and metadata to be read
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.fileInputStream.transferTo(baos);
        InputStream imageStream = new ByteArrayInputStream(baos.toByteArray());

        BufferedImage image = ImageIO.read(imageStream);
        int width = image.getWidth();
        int height = image.getHeight();

        try {
            InputStream metadataStream = new ByteArrayInputStream(baos.toByteArray());
            Metadata metadata = ImageMetadataReader.readMetadata(metadataStream);

            int orientation = 1;
            ExifIFD0Directory exifIFD0Directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);

            orientation = exifIFD0Directory.getInt(ExifDirectoryBase.TAG_ORIENTATION);

            // Defining the suitable image transformation
            AffineTransform affineTransform = new AffineTransform();
            switch (orientation) {
                case 1: // Do nothing
                    break;
                case 2: // Flip horizontally
                    affineTransform.scale(-1.0, 1.0);
                    affineTransform.translate(-width, 0);
                    break;
                case 3: // 180 degree rotation
                    affineTransform.translate(width, height);
                    affineTransform.rotate(Math.PI);
                    break;
                case 4: // Flip vertically
                    affineTransform.scale(1.0, -1.0);
                    affineTransform.translate(0, -height);
                    break;
                case 5: // 90 degree clockwise rotation, and flip horizontally
                    affineTransform.rotate(-Math.PI / 2);
                    affineTransform.scale(-1.0, 1.0);
                    break;
                case 6: // 90 degree clockwise rotation
                    affineTransform.translate(height, 0);
                    affineTransform.rotate(Math.PI / 2);
                    break;
                case 7: // 90 degree clockwise rotation, and flip vertically
                    affineTransform.scale(-1.0, 1.0);
                    affineTransform.translate(-height, 0);
                    affineTransform.translate(0, width);
                    affineTransform.rotate(3 * Math.PI / 2);
                    break;
                case 8: // 90 degree counter-clockwise rotation
                    affineTransform.translate(0, width);
                    affineTransform.rotate(3 * Math.PI / 2);
                    break;
                default:
                    break;
            }

            // output dimensions will be flipped in cases where we rotated by 90 degrees
            if (orientation >= 5 && orientation <= 8) {
                int tmp = width;
                width = height;
                height = tmp;
            }

            AffineTransformOp affineTransformOp = new AffineTransformOp(affineTransform,
                    AffineTransformOp.TYPE_BILINEAR);
            BufferedImage destinationImage = new BufferedImage(width, height,
                    image.getType());

            image = affineTransformOp.filter(image, destinationImage);
            // CHECKSTYLE:OFF
        } catch (Exception e) {
            log.warn(String
                    .format("Failed to perform image orientation correction with error: %s. Continuing with no orientation changes.",
                            e));
        }
        // CHECKSTYLE:ON

        // if changing orientation failed, we will simply be returning the original
        return image;
    }
}
