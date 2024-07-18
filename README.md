# Introduction 
This is the repository that will contain the Automated Performance Tests for the HRA IRAS project

The Tests are written in JavaScript using the k6 API

The Tests can be run locally on the Dev Box via CLI, using our own Azure DevOps cloud resources, or k6’s Grafana Cloud service.  
&nbsp;  

# Pre-requisites
Follow the setup guide [here](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/QA%20Setup%20Docs/k6%20Setup%20Guide.docx?d=w773a69b410a8481b840b04b7f3bdc3a0&csf=1&web=1&e=VYFrQZ) to set up k6 on your Dev Box and connect with k6 Cloud

Also review the document along with the [Tooling Standards Document](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/RSP%20Test%20Approach/Draft/Automation%20Test%20Tool%20Standards%20Draft%20Content.docx?d=wc9b5951cd936470984f391877ed0bd20&csf=1&web=1&e=PRwea3) (UPDATE THIS)  
to understand the best practices for using k6 and running tests  
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

![Set Baseline](src/resources/images/setBaseLine.png =900x300)  

Setting a test run as a baseline will also ensure that the result from that test run will persist  
beyond the standard data retention policy (14 days for the free version).  
&nbsp;  

# Guide to Writing Test Scripts
This section provides a high level overview on writing k6 test scripts to assist you in creating your own.  
For more in depth guidance and further details please consult the official k6 documentation.

## Using Test Builder
The k6 cloud service provides a graphical interface to generate a k6 test script.  
Using the test builder you can record a user journey/scenario, through a website or application  
and it will convert your interactions into http requests and structure them within a k6 test script file.

You can then edit the test configuration (load, duration, name etc) by entering properties into appropriately labelled fields.  
The test builder converts this configuration into an `options`object within the k6 script,  
which provides the configuration to the scripts functions at runtime.

![Test Builder](src/resources/images/testBuilder.png =750x450)  

If you are new to writing k6 test scripts, it is recommended that you use the k6 test builder.  
It can also be useful for experienced k6 users to quickly spin up a test script, which they can then modify in code to suit their needs.  
See [here]( https://grafana.com/docs/grafana-cloud/testing/k6/author-run/test-builder/) for a guide on how to use the test builder.



## Structure of a Test Script
 A k6 test script typically follows a standard structure that includes: 
 - importing necessary modules
 - delaring test properties such as data, custom metrics and functions
 - defining options for the test 
 - a setup function for any necessary initialization code
 - a main test function that will be executed by virtual users (VUs)
 - teardown functions which execute after the main test function has completed

Here’s an overview of the structure of a standard k6 test script:

### Importing Modules
At the top of the script, you usually import the k6 modules you'll need,  
such as http for making HTTP requests and sleep for pausing execution.

![Imports](src/resources/images/imports.png =350x100)  

### Declaring Custom Metrics
Custom Metrics, along with test data and any other test properties,  
must be declared Within the init context of the script. I.e. near the top before any other functions execute.
To use custom metrics you must import them from the `k6/metrics` module (see above).

The following example creates a custom Trend. The object in the script is called `TrendSpecificRequestDuration`,  
and its metric appears in the results output as `specific_response_time`.

![Custom Metric](src/resources/images/customMetric.png =800x200)  

### Defining Options
Next, you define the options for your test, such as the number of virtual users (VUs),  
the duration of the test, stages for ramping up and down, thresholds for performance metrics, scenarios etc.

![Options](src/resources/images/options.png =850x350)  

### Setup Code (Optional)
If you need to set up any data or state before the test runs, you can use the setup function.  
This code runs once before any virtual users start executing the main test function.

![Setup](src/resources/images/setup.png =800x150)  

### Main Test Function
The core of the script is the default function, which contains the code that each virtual user will execute.  
This function typically makes HTTP requests, performs checks, and includes sleeps to simulate real user behavior.

![Main Default](src/resources/images/mainDefault.png =1000x400)  

### Teardown Code (Optional)
Finally, you can include a teardown function that runs after all virtual users have finished executing the main test function.  
This can be used to clean up any state or perform post-test analysis.

![Teardown](src/resources/images/teardown.png =600x150)  

### Complete Example
Putting it all together, here’s a simple complete k6 test script:

![Full Simple](src/resources/images/fullSimple.png =1100x800)  

## Additional Test Script Features

### Scenarios
You can add scenarios to your test configuration, within the `options` portion of the test script.  
Scenarios allow you to configure your VUs and test iterations in more granular detail,  
as they provide various additional options which dictate how your main test function runs.

The options provided are shown below.  
For more details, including the type of test executors available, see [here](https://grafana.com/docs/k6/latest/using-k6/scenarios/)  

![Scenario Options](src/resources/images/scenarioOptions.png =600x400)  

### Example with Multiple Scenarios
You can use multiple scenarios in one script, and these scenarios can be run in sequence or in parallel.

The script shown below has two scenarios, contacts and news, which run in sequence:
1. At the beginning of the test, k6 starts the contacts scenario. 50 VUs try to run as many iterations as possible for 30 seconds.
2. After 30 seconds, k6 starts the news scenario. 50 VUs each try to run 100 iterations in one minute.

Each scenario has its own `options` configuration and different test logic,  
as each scenario calls a unique test function to execute.

Note that the value of the `exec` property of each scenario matches the name of a test function,  
as the purpose of this property to tell the scenario which function to execute.

![Multiple Scenarios](src/resources/images/scenarioMulti.png =700x700)  

For further details on Multiple Scenario configurations, see [here](https://grafana.com/docs/k6/latest/using-k6/scenarios/advanced-examples/)

### Groups
For extra organization of your main test scripts you can utilise k6's groups feature.   
Groups can be used to separate your main test functions into smaller functions which have logical grouping.   
It is similar the concept of `steps` in Playwright and can allow for BDD-style testing.

All metrics emitted within a group will be tagged with the group name.  
For each group function k6 emits a `group_duration` metric, which contains the total time to execute the group function.

The group tags and the `group_duration` metric can add another element to your analysis of test results.
For further information on Groups and Tagging, see [here](https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/) 

![Groups](src/resources/images/groups.png =500x500)  

### Cloud Configuration
To configure your test script to run in k6 cloud you need to add the `cloud` property within your scripts `options` object.
The cloud property simply states the location of the Amazon cloud server you wish to use,  
and the amount of load that will be distributed onto server as a percentage share.

If you are unsure how to do this, it can be added simply by setting configuring the load zone settings  
within the k6 test builder.

![Cloud Builder](src/resources/images/cloudConfigBuilder.png =500x500)  

The configuration shown above will be added into the `options` object wiithin the test script as shown below

![Cloud Script](src/resources/images/cloudConfigScript.png =500x500)  

# Supporting Documentation
1. [Test Tooling Standards Document](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/RSP%20Test%20Approach/Draft/Automation%20Test%20Tool%20Standards%20Draft%20Content.docx?d=wc9b5951cd936470984f391877ed0bd20&csf=1&web=1&e=PRwea3) (UPDATE THIS)
2. [k6 Setup Guide](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/QA%20Setup%20Docs/k6%20Setup%20Guide.docx?d=w773a69b410a8481b840b04b7f3bdc3a0&csf=1&web=1&e=VYFrQZ)
3. [k6 Documentation](https://grafana.com/docs/k6/latest/)
