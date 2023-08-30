ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

run:
	docker run -d -p 8083:8083 \
  	--mount type=bind,readonly,source=$(ROOT_DIR)/textract-workflow.integ.mockconfig.json,destination=/home/StepFunctionsLocal/textract-workflow.integ.mockconfig.json \
  	-e SFN_MOCK_CONFIG="/home/StepFunctionsLocal/textract-workflow.integ.mockconfig.json" \
  	amazon/aws-stepfunctions-local


create:
	export SFN_MOCK_CONFIG="$(ROOT_DIR)/textract-workflow.integ.mockconfig.json"
	aws stepfunctions create-state-machine \
		--endpoint-url http://localhost:8083 \
		--definition file://./extractedAsl.json \
		--name "TextractSyncProcessingTests" \
		--role-arn "arn:aws:iam::123456789012:role/DummyRole" \
		--no-cli-pager


happy:
	aws stepfunctions start-execution \
		--endpoint http://localhost:8083 \
		--name TextractSyncProcessingTests \
		--state-machine arn:aws:states:us-east-1:123456789012:stateMachine:TextractSyncProcessingTests#AnalyzeDocTestSuccess \
		--input file://./single-input-data.json \
		--no-cli-pager

happy-h:
	aws stepfunctions get-execution-history \
		--endpoint http://localhost:8083 \
		--execution-arn arn:aws:states:us-east-1:123456789012:execution:TextractSyncProcessingTests:TextractSyncProcessingTests \
		--no-cli-pager

retryOnFail:
	aws stepfunctions start-execution \
		--endpoint http://localhost:8083 \
		--name TextractSyncProcessingTests2 \
		--state-machine arn:aws:states:us-east-1:123456789012:stateMachine:TextractSyncProcessingTests#AnalyzeDocTestRetryWithSuccess \
		--input file://./single-input-data-with-retry.json \
		--no-cli-pager

retryOnFail-h:
	aws stepfunctions get-execution-history \
			--endpoint http://localhost:8083 \
			--execution-arn arn:aws:states:us-east-1:123456789012:execution:TextractSyncProcessingTests:TextractSyncProcessingTests2 \
			--no-cli-pager