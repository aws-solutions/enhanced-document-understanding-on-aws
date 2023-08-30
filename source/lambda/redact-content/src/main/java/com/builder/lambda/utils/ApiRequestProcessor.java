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

import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.Tag;
import software.amazon.lambda.powertools.logging.Logging;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.amazonaws.util.IOUtils;
import com.builder.lambda.model.ApiRequestBody;
import com.builder.lambda.model.BoundingBox;
import com.builder.lambda.model.Document;
import com.builder.lambda.model.EntityDetails;
import com.builder.lambda.model.FileType;
import com.builder.lambda.model.PhraseRedaction;
import com.builder.lambda.model.TextractDetectText;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;

public class ApiRequestProcessor extends RequestProcessor<APIGatewayV2HTTPEvent> {

    public ApiRequestProcessor(S3Storage s3Storage) {
        super(s3Storage);
    }

    /**
     * Lambda handler calls this method and passes in the API gateway Event which
     * triggered it.
     * This method parses the request and performs redaction as specified.
     *
     * @param apiGatewayEvent
     * @throws IllegalArgumentException if we fail to handle the request due to
     *                                  parsing errors or it being malformed
     * @throws FileNotFoundException
     */
    @Logging
    @Override
    public void process(APIGatewayV2HTTPEvent apiGatewayEvent)
            throws IllegalArgumentException, IOException {

        // parsing the inputted json body which defines which entities to redact
        ApiRequestBody parsedBody = ingestProcessingInput(apiGatewayEvent);
        String caseId = apiGatewayEvent.getPathParameters().get("caseId");
        String documentId = apiGatewayEvent.getPathParameters().get("documentId");

        // the original file should be the only one listed by this prefix, as the
        // filename is replaced with a UUID on upload.
        String s3Key = getInputDocumentKey(caseId, documentId);
        String extension = FileUtils.getFileExtension(s3Key);

        // Load the document from S3
        FileType fileType = FileUtils.getFileType(s3Key); // will throw for unsupported file type
        InputStream inputFile = s3.getFile(s3InputBucketName, s3Key);
        // get object tags for the object
        List<Tag> tags = s3.getObjectTags(s3InputBucketName, s3Key);
        Document document = new Document(inputFile, fileType, caseId, documentId);

        // redact the file as requested
        Map<String, List<BoundingBox>> bboxesToRedact = getBoundingBoxesByPage(parsedBody, caseId,
                documentId);
        Redactor redactor = this.getRedactor(fileType);
        ByteArrayOutputStream redactedDoc = redactor.processDocument(document, bboxesToRedact);

        // upload the redacted file to s3
        String outputKey = String.format("%s/%s/%s-redacted.%s", s3OutputPrefix, caseId, documentId, extension);

        s3.putFile(s3InputBucketName, outputKey, redactedDoc);
        s3.setObjectTags(s3InputBucketName, outputKey, tags);
    }

    /**
     * Parses the JSON body of the incoming API Gateway event, performing validation
     * on the params.
     * 
     * @param event
     * @return Java object as created from the input event body JSON
     * @throws IllegalArgumentException If either the path params are invalid, or if
     *                                  there is a failure parsing the body into our
     *                                  expected format
     */
    @Logging
    private ApiRequestBody ingestProcessingInput(APIGatewayV2HTTPEvent event) throws IllegalArgumentException {
        try {
            // getting info from event and environment
            final Map<String, String> pathParams = event.getPathParameters();
            if (pathParams == null || !pathParams.containsKey("caseId") || !pathParams.containsKey("documentId")) {
                log.error("Failed to parse required parameters from API path. Got: {}", pathParams);
                throw new IllegalArgumentException("Invalid path parameters");
            }

            // parsing the inputted json body which defines which entities to redact
            return new Gson()
                    .fromJson(event.getBody(), ApiRequestBody.class);
        } catch (JsonSyntaxException e) {
            log.error("Failed to parse body of request with error: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid JSON");
        }
    }

    /**
     * Utility function to get the key of the input document to download
     * 
     * @param caseId
     * @param documentId
     * @return
     */
    @Logging
    private String getInputDocumentKey(String caseId, String documentId) throws IllegalArgumentException {
        String inputDocPrefix = String.format("%s/%s/%s", s3InputPrefix, caseId, documentId);
        String s3Key;
        try {
            s3Key = s3.listObjects(s3InputBucketName, inputDocPrefix)
                    .get(0)
                    .key();
        } catch (IndexOutOfBoundsException e) {
            String errMsg = String.format("No objects were found for prefix %s", inputDocPrefix);
            log.error(errMsg);
            throw new IllegalArgumentException(errMsg);
        }
        return s3Key;
    }

    /**
     * This method extracts bounding box information for each page from the
     * necessary inference locations and combines them all together in a map where
     * the key is the page number.
     *
     * @param requestBody api-gateway event body
     * @param caseId
     * @param docId
     * @return a map of bounding boxes paired with the page number
     */
    @Logging
    @SuppressWarnings("java:S1602") // rule forces removal of curly braces, which makes code less readable
    private Map<String, List<BoundingBox>> getBoundingBoxesByPage(
            ApiRequestBody requestBody, String caseId, String docId) {

        Map<String, List<BoundingBox>> boundingBoxesByPage = new HashMap<>();

        // collect bounding boxes for phrases
        if (!requestBody.getPhrases().isEmpty()) {
            try {
                PhraseFinder phraseFinder = new PhraseFinder(getTextractDetectTexts(caseId, docId));

                for (PhraseRedaction phraseRedaction : requestBody.getPhrases()) {
                    Map<String, List<BoundingBox>> phraseBoundingBoxes = phraseFinder
                            .findPhraseBoundingBoxes(phraseRedaction.getText(), phraseRedaction.getPages());
                    phraseBoundingBoxes.forEach((pageNumber,
                            boundingBoxes) -> addBoundingBoxesToMap(boundingBoxesByPage, pageNumber, boundingBoxes));
                }

                // CHECKSTYLE:OFF
            } catch (Exception e) {
                // CHECKSTYLE:ON
                log.warn(
                        String.format(
                                "Failed to retrieve the textract inference for case %s, doc %s. "
                                        + "Skipping phrase redaction.",
                                caseId,
                                docId));
            }

        }

        // collect bounding boxes for the specified entities
        requestBody.getEntities().forEach((inferenceType, entityTypes) -> { // (eg. entityType="entity-standard" and
            // redactData={})

            // Attempt to get the specified inference
            Map<String, Map<String, Map<String, List<EntityDetails>>>> currentInference;
            try {
                currentInference = getEntityLocationsInferenceByName(
                        inferenceType, caseId, docId);
                // CHECKSTYLE:OFF
            } catch (Exception e) {
                // CHECKSTYLE:ON

                // failure to retrieve an entity locations result => continue to the next one
                log.warn(
                        String.format("Failed to retrieve the inference %s, case %s, doc %s. Skipping.", inferenceType,
                                caseId,
                                docId));
                return;
            }
            // @formatter:off
            entityTypes.forEach((entityType, entities) -> { // e.g. entityType="DATE" and entities={} //NOSONAR - commented-out lines of code
                entities.forEach((entity, pages) -> { // e.g. entity="10/23/20, 3:28 PM" and pages={} //NOSONAR - commented-out lines of code
                    pages.forEach(pageNumber -> { // a list of pages where we want to redact the entity
                        addInferenceBoundingBoxesToMap(boundingBoxesByPage, currentInference, entityType, entity,
                                pageNumber);
                    });
                });
            });
            // @formatter:off
        });
        return boundingBoxesByPage;
    }

    /**
     * Handles internal logic for appending BoundingBoxes to our map containing all
     * the bounding boxes which will be redacted. Adds a new key to the map if a key
     * does not yet exist for the given page number, otherwise appends new entries
     * to the list of BoundingBoxes
     * 
     * @param boundingBoxesByPage Maps page number to an array of BoundingBox
     *                            which we want to redact. This method adds new
     *                            items to this map as needed.
     * @param currentInference    The inference (i.e. as parsed from
     *                            entity-standard-locations.json) which we are
     *                            extracting EntityDetails from
     * @param entityType          E.g. DATE, NAME, etc..
     * @param entity              The actual text of the entity, e.g. 'John Doe'
     * @param pageNumber          Page number being processed
     */
    @Logging
    private void addInferenceBoundingBoxesToMap(Map<String, List<BoundingBox>> boundingBoxesByPage,
            Map<String, Map<String, Map<String, List<EntityDetails>>>> currentInference, String entityType,
            String entity, Integer pageNumber) {
        String pageNumberString = String.valueOf(pageNumber);
        if (currentInference.containsKey(entityType) && currentInference.get(entityType).containsKey(entity)
                && currentInference.get(entityType).get(entity).containsKey(pageNumberString)) {

            // collect the bounding boxes for the entities specified
            List<BoundingBox> currentBoundingBoxs = new ArrayList<>();
            for (EntityDetails entityDetails : currentInference.get(entityType)
                    .get(entity).get(pageNumberString)) {
                currentBoundingBoxs.addAll(entityDetails.getBoundingBoxes());
            }

            // insert or append
            addBoundingBoxesToMap(boundingBoxesByPage, pageNumberString, currentBoundingBoxs);
        }
    }

    /**
     * utility function to add some bounding boxes to our map containing all
     * bounding boxes for each page. If a list does not exist for a given page,
     * creates it. Otherwise appends bounding boxes to the existing list.
     * 
     * @param boundingBoxesByPage map which is modified by this function
     * @param pageNumberString
     * @param boundingBoxesToAdd
     */
    private void addBoundingBoxesToMap(Map<String, List<BoundingBox>> boundingBoxesByPage, String pageNumberString,
            List<BoundingBox> boundingBoxesToAdd) {
        if (!boundingBoxesByPage.containsKey(pageNumberString)) {
            boundingBoxesByPage.put(pageNumberString, boundingBoxesToAdd);
        } else {
            List<BoundingBox> updatedEntryDetails = boundingBoxesByPage
                    .get(pageNumberString);
            updatedEntryDetails.addAll(boundingBoxesToAdd);
            boundingBoxesByPage.put(pageNumberString, updatedEntryDetails);
        }
    }

    /**
     * Retrieves a given inference from the inferences bucket and parses it into a
     * useable native java structure
     *
     * @param inferenceName name of the inference we will try to retrieve locations
     *                      of. E.g. "entity-standard"
     * @param caseId        the caseId of the document
     * @param docId         the ID of the document
     * @return redact data to be used to determine the entity location
     * @throws S3Exception         if getting object from s3 fails
     * @throws IOException         if reading data from s3 object as an input stream
     *                             fails
     * @throws JsonSyntaxException if parsing s3 data as json into native structure
     *                             fails
     */
    @Logging
    private Map<String, Map<String, Map<String, List<EntityDetails>>>> getEntityLocationsInferenceByName(
            String inferenceName, String caseId, String docId)
            throws IOException, JsonSyntaxException {
        String s3Key = String.format("%s/%s/%s-locations.json", caseId, docId, inferenceName);
        try (InputStream s3ResponseIS = s3.getFile(s3InferenceBucketName, s3Key)) {
            String redactedDataString = IOUtils.toString(s3ResponseIS);
            return new Gson().fromJson(redactedDataString,
                    new TypeToken<Map<String, Map<String, Map<String, List<EntityDetails>>>>>() {
                    }.getType());
        } catch (IOException ioException) {
            log.error("Failed to read the data for the key {}", s3Key);
            throw ioException;
        } catch (JsonSyntaxException jsonException) {
            log.error("Failed to parse the JSON as read from {}", s3Key);
            throw jsonException;
        }
    }

    /**
     * retrieves the textract-detectText inference from the inference bucket
     * 
     * @param caseId the caseId of the document
     * @param docId  the ID of the document
     * @return redact data to be used to determine the entity location
     * @throws S3Exception         if getting object from s3 fails
     * @throws IOException         if reading data from s3 object as an input stream
     *                             fails
     * @throws JsonSyntaxException if parsing s3 data as json into native structure
     *                             fails
     */
    @Logging
    private List<TextractDetectText> getTextractDetectTexts(String caseId, String docId)
            throws IOException, JsonSyntaxException {
        String s3Key = String.format("%s/%s/%s", caseId, docId, Constants.TEXTRACT_DETECT_TEXT_INFERENCE_NAME);
        try (InputStream s3ResponseIS = s3.getFile(s3InferenceBucketName, s3Key)) {
            String textractInferenceString = IOUtils.toString(s3ResponseIS);
            return new Gson().fromJson(textractInferenceString,
                    new TypeToken<List<TextractDetectText>>() {
                    }.getType());
        } catch (IOException ioException) {
            log.error("Failed to read the textract-detectText inference from s3");
            throw ioException;
        } catch (JsonSyntaxException jsonException) {
            log.error("Failed to parse the JSON as read from textract-detectText inference");
            throw jsonException;
        }
    }
}
