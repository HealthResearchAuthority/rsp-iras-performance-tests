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

![CLI Command](src/resources/images/cliCommand.png =800x250)

Once the test has finished it will print a summary of the results to the console.

![CLI Results](src/resources/images/cliResults.png =750x550)  
&nbsp;  

# Run in Azure DevOps
This method is open source and can be run as many times as you like without using up k6 resources or incurring extra costs.

However, running via this method will use up our own Azure DevOps resources and will incur additional billable run-time, so please use sparingly.

We will primarily use this method of running the tests, in scenarios where we have used up our k6 Cloud resources for the month.

See Standards document for further details

To run k6 performance test scripts in the Azure pipeline:
- Go to the repo’s pipeline job [here](https://dev.azure.com/FutureIRAS/Research%20Systems%20Programme/_build?definitionId=10)
- Click the Run pipeline button

![CLI Results](src/resources/images/runPipeline.png =300x100)  
&nbsp;  
- Select the desired test script from the radio list
- Click the Run button

You can view the results on the console in the pipeline step which runs the tests

![CLI Results](src/resources/images/selectScript.png =300x700)  

The pipeline will also produce a test report in a JSON file and publish it as an artifact  
&nbsp;  

# Run in K6 Cloud 
Our k6 Cloud account is limited to 500 Virtual User hours per month, so please use sparingly

See Standards document for further details

## Running k6 Cloud via VS Code CLI
See the setup guide to learn how to connect your VS Code terminal to the teams k6 account.

Once you are connected:
- Open a Terminal in VS code
- Navigate to the root folder of the project
- Execute the command `k6 cloud <relative path of test script>`

For example, if the test script `pocUiScript.js` is stored in the `src/scripts folder`

Then the command will be `k6 cloud src/scripts/pocUiScript.js`

Similarly to the local run, the test will kick off and begin printing results to the console. 

![Cloud CLI Command](src/resources/images/cloudCliCommand.png =800x250)  

However, if you return to the Project Page of k6 Cloud, and click into the Future IRAS Project

You will see all the tests scripts that have been previously run within the project

And you will see that the test you just have just triggered (pocUiScript.js in this example), is currently in progress.

![Cloud In Progress](src/resources/images/cloudInProgress.png =750x500)  

Back in VS Code,

Once the test has finished, unlike before the results will not be printed to the local console. 

Simply a statement that the run has finished.

![Cloud CLI Finish](src/resources/images/cloudCliFinish.png =800x200)  

To view the test results you will need to open the relevant test run on k6 cloud  
&nbsp;  

## Running via k6 Cloud Console 
We can re-run test scripts directly through the k6 Cloud UI. 

If you want to initiate a test from a brand-new test script.  
Or re-run the existing script with changes.  
Then you will need to make the changes locally and run in k6 Cloud via the local CLI, as demonstrated in the previous section.

To run an existing test on the k6 Cloud UI:
- Login to the teams k6 Cloud account
- Navigate to the Future IRAS Project
- Select a script from project page
- On the Script Overview page Click the Run button on the top right of the screen

![Cloud Run](src/resources/images/cloudRun.png =750x400)  

This will trigger a new test run using the most recent version that has been previously executed in k6 Cloud. 

You will now see an Initialization animation, which will display while k6 gets everything setup.

![Cloud Test Loading](src/resources/images/testLoading.png =500x400)  

Once initialization is complete, then the k6 Cloud Results console will display showing real time data, as the test is in progress  
&nbsp;  

# Analysing reports
The CLI report that is printed to the console when running k6 OSS on your local machine will output a basic table of results. 

The results will include built in k6 metrics, as well as any custom metrics you have configured.

![CLI Results](src/resources/images/cliResults.png =750x550)  
&nbsp;  

The k6 Cloud UI provides a report with far greater visualisation of test results,  
as well as more in depth information about the performance of each request during the test run.

At a high level the k6 cloud results will show a chart outlining: 
- Number of Virtual Users 
- Request Rate 
- Response Time 
- Failure Rate

![Cloud Result Chart](src/resources/images/cloudResultChart.png =900x500)  

Above the chart will be a results summary showing: 
- List bullet  
- Number of requests made 
- Number of request failures 
- Peak rates per second 
- 95 percentile response time
 
Beneath the chart is a Performance Insights panel. 

This shows more low-level detail about the test run and can be used to do a more deep dive analysis into the performance using: 
- Thresholds  
- Checks 
- Individual Request Logs 
- Console Logs 
- Metrics (Analysis tab)

![Cloud Insights](src/resources/images/cloudInsights.png =900x350)  

For more information of Thresholds, Checks Metrics etc, see the documentation [here](https://grafana.com/docs/k6/latest/using-k6/) 
&nbsp;  

## Set report as baseline
A baseline test run is useful when doing continuous testing of your application performance.

We will want to set a baseline test run when our system reaches performance expectations,  
to compare it against later test runs to find how the performance of the system changes.

In k6 Cloud we can set a previous test run as a baseline by: 
- Entering the results page of a particular test run
- Clicking the ellipsis in the top right of the screen
- Selecting the **Set as baseline** option

INSERT SCREEN SHOT

Setting a test run as a baseline will also ensure that the result from that test run will persist  
beyond the standard data retention policy (14 days for the free version).
