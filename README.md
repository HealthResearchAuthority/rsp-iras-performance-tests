# Introduction 
This is the repository that will contain the Automated Performance Tests for the HRA IRAS project

The Tests are written in JavaScript using the k6 API

The Tests can be run locally on the Dev Box via CLI, using our own Azure DevOps cloud resources, or k6’s Grafana Cloud service.  
&nbsp;  

# Pre-requisites
Follow the setup guide [here](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/QA%20Setup%20Docs/k6%20Setup%20Guide.docx?d=w5a279156829441af94af27126dd33bc1&csf=1&web=1&e=jjdeRK) to set up k6 on your Dev Box and connect with k6 Cloud

Also review the document along with the [Tooling Standards Document](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/RSP%20Test%20Approach/Draft/Automation%20Test%20Tool%20Standards%20Draft%20Content.docx?d=wc9b5951cd936470984f391877ed0bd20&csf=1&web=1&e=PRwea3) (UPDATE THIS)  
to understand the best practices for using k6 and running k6  
&nbsp;  

# Run locally (k6 Open Source)
This method is open source and can be run as many times as you like without using up k6 resources or incurring extra costs.

In VS Code: 
- Open a Terminal
- Navigate to the root folder of the project
- Execute the command `k6 run <relative path of test script>`

For example, if the test script `pocApiScript.js` is stored in the `src/scripts folder`

Then the command will be `k6 run src/scripts/pocApiScript.js`

If successful the relevant test script will run, as per its configuration, and begin logging results to the console. As shown below

![CLI Command](src/resources/cliCommand.png =800x250)

Once the test has finished it will print a summary of the results to the console.

![CLI Results](src/resources/cliResults.png =750x550)  
&nbsp;  

# Run in Azure DevOps
This method is open source and can be run as many times as you like without using up k6 resources or incurring extra costs.

However, running via this method will use up our own Azure DevOps resources and will incur additional billable run-time, so please use sparingly.

We will primarily use this method of running the tests, in scenarios where we have used up our k6 Cloud resources for the month.

See Standards document for further details

To run k6 performance test scripts in the Azure pipeline:
- Go to the repo’s pipeline job [here](https://dev.azure.com/FutureIRAS/Research%20Systems%20Programme/_build?definitionId=10)
- Click the Run pipeline button

INSERT SCREENSHOT

- Select the desired test script from the radio list
- Click the Run button

You can view the results on the console in the pipeline step which runs the tests

INSERT SCREENSHOT

The pipeline will also produce a test report in a JSON file and publish it as an artifact.
