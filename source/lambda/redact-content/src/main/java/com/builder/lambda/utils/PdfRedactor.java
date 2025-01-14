// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package com.builder.lambda.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;

import software.amazon.lambda.powertools.logging.Logging;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * This class processes {@link InputStream} based pdf file to apply redaction
 * using a list of {@link PDRectangle} information.
 */
public class PdfRedactor implements Redactor {

    Logger log = LogManager.getLogger(PdfRedactor.class);

    private int pdfQuality = Constants.DEFAULT_PDF_QUALITY;
    private ImageType imageType = Constants.DEFAULT_IMAGE_TYPE;

    public PdfRedactor() {
        checkEnvSetup();
    }

    /**
     * Checks the Lambda environment variables for Pdf-Quality. If found,
     * then it replaces the default value
     */
    private void checkEnvSetup() {
        if (System.getenv("PDF_QUALITY") != null) {
            pdfQuality = Integer.parseInt(System.getenv("PDF_QUALITY"));
            log.info("PDF_QUALITY is: {}-dpi", pdfQuality);
        }
        if (System.getenv("IMAGE_TYPE") != null) {
            imageType = ImageType.valueOf(System.getenv("IMAGE_TYPE"));
            log.info("IMAGE_TYPE is: {}", imageType);
        }
    }

    /**
     * This method applies redaction on a pdf file using bounding-box information
     *
     * @param document   - contains input pdf file and bounding-box info
     * @param redactData - the bounding boxes to be redacted
     * @return - redacted pdf file
     * @throws IOException if it is unable to process the document to redact
     */
    @Override
    @Logging
    public ByteArrayOutputStream processDocument(
            Document document, Map<String, List<BoundingBox>> boundingBoxesByPage) throws IOException {
        PDDocument pdfDoc = drawRectangles(document.fileInputStream, boundingBoxesByPage);
        return applyPermanentRedaction(pdfDoc);
    }

    /**
     * This method uses bounding-box to draw black-boxes on the pdf file
     *
     * @param pdfInputStream      input pdf file
     * @param boundingBoxesByPage bounding-box information mapped with page number
     * @return - a pdf file with black boxes on top
     * @throws IOException if it is unable to opens the pdf file or issues with
     *                     drawing rectangles
     */
    @Logging
    private PDDocument drawRectangles(InputStream pdfInputStream,
            Map<String, List<BoundingBox>> boundingBoxesByPage) throws IOException {

        PDDocument pddDoc;
        try {
            pddDoc = PDDocument.load(pdfInputStream);
        } catch (IOException ioException) {
            log.error("Unable to load pdf file");
            throw ioException;
        }

        for (int pageIndex = 0; pageIndex < pddDoc.getNumberOfPages(); pageIndex++) {
            PDPage page = pddDoc.getPage(pageIndex);
            String pageKey = String.valueOf(pageIndex + 1);
            PDRectangle pageDims = page.getMediaBox();
            try (PDPageContentStream contentStream = new PDPageContentStream(
                    pddDoc,
                    page,
                    PDPageContentStream.AppendMode.APPEND,
                    true,
                    true)) {
                contentStream.setNonStrokingColor(Color.BLACK);

                List<BoundingBox> currentPageBboxes = boundingBoxesByPage.get(pageKey);
                log.info("Drawing rectangles for {} entities on page {}", currentPageBboxes.size(), pageKey);

                for (BoundingBox boundingBox : currentPageBboxes) {
                    // Since bbox is normalized on [0,1] for textract output, we need to multiple by
                    // the dimensions of the page in order to get coordinates in pdf space.
                    // Further, coordinates in textract are relative to the top left, while pdfbox
                    // is bottom left. Hence the transformation below of boundingBox.top to the 'y'
                    // argument of addRect
                    if (boundingBox != null) {
                        contentStream.addRect(
                                (float) boundingBox.getLeft() * pageDims.getWidth(),
                                (float) (pageDims.getHeight() * (1 - (boundingBox.getTop() + boundingBox.getHeight()))),
                                (float) boundingBox.getWidth() * pageDims.getWidth(),
                                (float) boundingBox.getHeight() * pageDims.getHeight());
                    }
                }
                contentStream.fill();
            } catch (NullPointerException e) {
                log.info("No bounding boxes provided for page {}. Skipping.", pageKey);
            } catch (IOException ioException) {
                log.error("Unable to draw rectangles on pdf file");
                pddDoc.close();
                throw ioException;
            }

        }
        return pddDoc;
    }

    /**
     * This method applies black boxes permanently on the pdf file by converting
     * them into images.
     * And finally convert the images back into a pdf file.
     *
     * @param doc - input pdf file with black-boxes on top
     * @return - an image based pdf file where the black boxes are permanent
     * @throws IOException if three's any error rendering the image or opening the
     *                     image as a pdf page
     */
    private ByteArrayOutputStream applyPermanentRedaction(PDDocument doc) throws IOException {
        PDPageContentStream contentStream = null;
        try (PDDocument redactedDoc = new PDDocument()) {
            PDFRenderer renderer = new PDFRenderer(doc);
            for (int index = 0; index < doc.getNumberOfPages(); index++) {
                // Render the page to an image
                BufferedImage image = renderer.renderImageWithDPI(index, pdfQuality, imageType);

                // image to pdf
                PDPage newPage = new PDPage(new PDRectangle(image.getWidth(), image.getHeight()));
                redactedDoc.addPage(newPage);
                PDImageXObject pdImage = LosslessFactory.createFromImage(redactedDoc, image);
                contentStream = new PDPageContentStream(
                        redactedDoc,
                        newPage,
                        PDPageContentStream.AppendMode.OVERWRITE,
                        true);
                contentStream.drawImage(pdImage, 0, 0);
                contentStream.close();
            }
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            redactedDoc.save(byteArrayOutputStream);
            return byteArrayOutputStream;
        } catch (IOException ioException) {
            log.error("Unable to apply redaction permanently on pdf file");
            throw ioException;
        } finally {
            if (contentStream != null) {
                contentStream.close();
            }
            doc.close();
        }
    }
}
