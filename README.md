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

## Without Encrypted Data

Use when running test scripts that do not require values to be encrypted

In VS Code:

- Open a Terminal
- Navigate to the root folder of the project
- Execute the command `k6 run <relative path of test script>`

For example, if the test script `pocApiScript.js` is stored in the `src/scripts folder`

Then the command will be `k6 run src/scripts/pocApiScript.js`

If successful the relevant test script will run, as per its configuration, and begin logging results to the console. As shown below

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cliCommand.png" alt="CLI Command" width="800" height="250">

Once the test has finished it will print a summary of the results to the console.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cliResults.png" alt="CLI Results" width="750" height="550">

## With Encrypted Data (Passwords etc)

Use when running test scripts that require values to be encrypted

In VS Code:

- Open the `encryptData.js` file located in the `src/utils` folder
- Add the value you want to encrypt to the `textToEncrypt` variable 

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/encryptUtil.png" alt="Encrypt Util" width="600" height="400">

- Open a Terminal
- Navigate to the root folder of the project
- Execute the command `k6 run src/utils/encryptData.js`
- The encrypted value and an array of 32 integers will be logged to the console

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/encryptedValue.png" alt="Encrypt Value" width="800" height="400">

- Revert the `textToEncrypt` variable back to the placeholder value
- Copy and paste the array from the console into the `keyArray.json` file  
which is located in the `src/resources/data` folder

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/keyArray.png" alt="Key Array" width="700" height="200">

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/keyArrayExample.png" alt="Key Array Example" width="800" height="250">

- Copy the encrypted value from the console
- Execute the command `k6 run -e ENCRYPTED_DATA=<encrypted value from console> <relative path of test script>`

For example, if the test script `pocAuthSetupScript.js` is stored in the `src/scripts folder`  
and the encrypted value logged to the console was: `T+fQW10T7HleFQLtN9RcJKxUWYus34Vuyn2itPVbnA==`

Then the command will be `k6 run -e ENCRYPTED_DATA=T+fQW10T7HleFQLtN9RcJKxUWYus34Vuyn2itPVbnA== src/scripts/pocAuthSetupScript.js`

If successful the relevant test script will run, as per its configuration, and begin logging results to the console. As shown below

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/encryptedSuccessRunLocal.png" alt="Encrypted Success Run Local" width="800" height="400">

Once the test has finished it will print a summary of the results to the console.

# Run in Azure DevOps

This method is open source and can be run as many times as you like without using up k6 resources or incurring extra costs.

However, running via this method will use up our own Azure DevOps resources and will incur additional billable run-time, so please use sparingly.

We will primarily use this method of running the tests, in scenarios where we have used up our k6 Cloud resources for the month.

See Standards document for further details

To run k6 performance test scripts in the Azure pipeline:

- Go to the repo’s pipeline job [here](https://dev.azure.com/FutureIRAS/Research%20Systems%20Programme/_build?definitionId=10)
- Click the Run pipeline button

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/runPipeline.png" alt="Run Pipeline" width="300" height="100">  
&nbsp;

- Select the desired test script from the radio list
- Click the Run button
- Note that any secret/encrypted values generated for local runs, will be stored and accessed as a secret pipeline variable, ensure any such values are configured appropriately.

You can view the results on the console in the pipeline step which runs the tests

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/selectScript.png" alt="Select Script" width="300" height="700">  

The pipeline will also produce a test report in a JSON file and publish it as an artifact  
&nbsp;

# Run in K6 Cloud

Our k6 Cloud account is limited to 500 Virtual User hours per month, so please use sparingly

See Standards document for further details

## Running k6 Cloud via VS Code CLI Without Encrypted Data

Use when running test scripts that do not require values to be encrypted

See the setup guide to learn how to connect your VS Code terminal to the teams k6 account.

Once you are connected:

- Open a Terminal in VS code
- Navigate to the root folder of the project
- Execute the command `k6 cloud <relative path of test script>`

For example, if the test script `pocUiScript.js` is stored in the `src/scripts folder`

Then the command will be `k6 cloud src/scripts/pocUiScript.js`

Similarly to the local run, the test will kick off and begin printing results to the console.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudCliCommand.png" alt="Cloud CLI Command" width="800" height="250">  

However, if you return to the Project Page of k6 Cloud, and click into the Future IRAS Project

You will see all the tests scripts that have been previously run within the project

And you will see that the test you just have just triggered (pocUiScript.js in this example), is currently in progress.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudInProgress.png" alt="Cloud In Progress" width="750" height="500">

Back in VS Code,

Once the test has finished, unlike before the results will not be printed to the local console.

Simply a statement that the run has finished.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudCliFinish.png" alt="Cloud CLI Finish" width="800" height="200">

To view the test results you will need to open the relevant test run on k6 cloud  
&nbsp;

## Running k6 Cloud via VS Code CLI With Encrypted Data (Passwords etc)

Use when running test scripts that require values to be encrypted

See the setup guide to learn how to connect your VS Code terminal to the teams k6 account.

Once you are connected:

- Open the `encryptData.js` file located in the `src/utils` folder
- Add the value you want to encrypt to the `textToEncrypt` variable 

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/encryptUtil.png" alt="Encrypt Util" width="600" height="400">

- Open a Terminal
- Navigate to the root folder of the project
- Execute the command `k6 run src/utils/encryptData.js`
- The encrypted value and an array of 32 integers will be logged to the console

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/encryptedValue.png" alt="Encrypt Value" width="800" height="400">

- Revert the `textToEncrypt` variable back to the placeholder value
- Copy and paste the array from the console into the `keyArray.json` file  
which is located in the `src/resources/data` folder

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/keyArray.png" alt="Key Array" width="700" height="200">

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/keyArrayExample.png" alt="Key Array Example" width="800" height="250">

- Copy the encrypted value from the console
- Execute the command `k6 cloud -e ENCRYPTED_DATA=<encrypted value from console> <relative path of test script>`

For example, if the test script `pocAuthSetupScript.js` is stored in the `src/scripts folder`  
and the encrypted value logged to the console was: `T+fQW10T7HleFQLtN9RcJKxUWYus34Vuyn2itPVbnA==`

Then the command will be `k6 cloud -e ENCRYPTED_DATA=T+fQW10T7HleFQLtN9RcJKxUWYus34Vuyn2itPVbnA== src/scripts/pocAuthSetupScript.js`

Similarly to the local run, the test will kick off and begin printing results to the console.

However, if you return to the Project Page of k6 Cloud, and click into the Future IRAS Project

You will see all the tests scripts that have been previously run within the project

And you will see that the test you just have just triggered is currently in progress.

Back in VS Code,

Once the test has finished, unlike before the results will not be printed to the local console.

Simply a statement that the run has finished.

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

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudRun.png" alt="Cloud Run" width="750" height="400">

This will trigger a new test run using the most recent version that has been previously executed in k6 Cloud.

You will now see an Initialization animation, which will display while k6 gets everything setup.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/testLoading.png" alt="Cloud Test Loading" width="500" height="400">

Once initialization is complete, then the k6 Cloud Results console will display showing real time data, as the test is in progress  
&nbsp;

# Analysing reports

The CLI report that is printed to the console when running k6 OSS on your local machine will output a basic table of results.

The results will include built in k6 metrics, as well as any custom metrics you have configured.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cliResults.png" alt="CLI Results" width="750" height="550">  
&nbsp;

The k6 Cloud UI provides a report with far greater visualisation of test results,  
as well as more in depth information about the performance of each request during the test run.

At a high level the k6 cloud results will show a chart outlining:

- Number of Virtual Users
- Request Rate
- Response Time
- Failure Rate

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudResultChart.png" alt="Cloud Result Chart" width="900" height="500"> 

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

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudInsights.png" alt="Cloud Insights" width="900" height="350"> 

For more information of Thresholds, Checks, Metrics etc, see the documentation [here](https://grafana.com/docs/k6/latest/using-k6/)
&nbsp;

## Set report as baseline

A baseline test run is useful when doing continuous testing of your application performance.

We will want to set a baseline test run when our system reaches performance expectations,  
to compare it against later test runs to find how the performance of the system changes.

In k6 Cloud we can set a previous test run as a baseline by:

- Entering the results page of a particular test run
- Clicking the ellipsis in the top right of the screen
- Selecting the **Set as baseline** option

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/setBaseLine.png" alt="Set Baseline" width="900" height="300"> 

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

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/testBuilder.png" alt="Test Builder" width="750" height="450"> 

If you are new to using the k6 tool, it is recommended that you use the k6 test builder.  
It can also be useful for experienced k6 users to quickly spin up a test script, which they can then modify in code to suit their needs.  
See [here](https://grafana.com/docs/grafana-cloud/testing/k6/author-run/test-builder/) for a guide on how to use the test builder.

## Script Editor

The k6 cloud service also provides a Script Editor (see screenshot above), that provides a the skeleton of a standard script,  
which you can then edit in the UI similar to an IDE.  
A key feature of the Script Editor is that it provides code snippets for a variety of typical k6 test functionality,  
ranging from basic to advanced.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/scriptExamples.png" alt="Script Examples" width="750" height="450"> 

Once again if you are new to writing k6 test scripts, it may be a useful to use the script editor  
to generate a starting point for your test script which you can then adjust.  
And make use of the code snippets to help you learn the features and capabilities of k6.

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

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/imports.png" alt="Imports" width="350" height="100"> 

### Declaring Custom Metrics

Custom Metrics, along with test data and any other test properties,  
must be declared Within the init context of the script. I.e. near the top before any other functions execute.
To use custom metrics you must import them from the `k6/metrics` module (see above).

The following example creates a custom Trend. The object in the script is called `TrendSpecificRequestDuration`,  
and its metric appears in the results output as `specific_response_time`.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/customMetric.png" alt="Custom Metric" width="800" height="200"> 

### Defining Options

Next, you define the options for your test, such as the number of virtual users (VUs),  
the duration of the test, stages for ramping up and down, thresholds for performance metrics, scenarios etc.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/options.png" alt="Options" width="850" height="350"> 

### Setup Code (Optional)

If you need to set up any data or state before the test runs, you can use the setup function.  
This code runs once before any virtual users start executing the main test function.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/setup.png" alt="Setup" width="800" height="150"> 

### Main Test Function

The core of the script is the default function, which contains the code that each virtual user will execute.  
This function typically makes HTTP requests, performs checks, and includes sleeps to simulate real user behavior.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/mainDefault.png" alt="Main Default" width="1000" height="400"> 

### Teardown Code (Optional)

Finally, you can include a teardown function that runs after all virtual users have finished executing the main test function.  
This can be used to clean up any state data or perform post-test analysis.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/teardown.png" alt="Teardown" width="600" height="150"> 

### Complete Example

Putting it all together, here’s a simple complete k6 test script:

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/fullSimple.png" alt="Full Simple" width="1100" height="800"> 

## Additional Test Script Features

### Thresholds

Thresholds are the pass/fail criteria that you define for your test metrics.  
If the performance of the system under test does not meet the conditions of your threshold,  
the test finishes with a failed status.

The thresholds are defined within the `options` object of the test script.  
You can define a threshold using k6's built-in metrics, for example `http_req_duration`,  
without any additional configuration outside of the thresholds definition

For further information on Thresholds, see [here](https://grafana.com/docs/k6/latest/using-k6/thresholds/)

### Defining Thresholds using Custom Metrics

You can also define a threshold using a Custom Metric.  
However it will require some additional configuration, namely:

1. Declaring the Custom Metric within the init context of your test script
2. Adding response data to the Custom Metric at the appropriate point in your main test function

The script below shows:

- A custom trend metric named `specific_response_time` declared within the init context
- A `thresholds` property within the `options` object
- A threshold configured for the built-in `http_req_duration` metric
- A threshold configured for the `specific_response_time` custom metric  
  (note the threshold property name must match the name of the custom metric)
- Two requests made within the main test function
- The response duration being add to the associated Trend object of the `specific_response_time` custom metric,  
  for the 2nd request in the main test function

The pass/fail criteria for this test script will therefore be:

1. 95% of all requests within the script must be less than 500 milliseconds, as the `http_req_duration` tracks every request
2. 100% of `http.get("https://test-api.k6.io/public/crocodiles/` requests ONLY must be less than 5 seconds,  
   as the `specific_response_time` custom metric is set to only track response data for tha request.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/customThreshold.png" alt="Custom Threshold" width="1100" height="800"> 

### Scenarios

You can add scenarios to your test configuration, within the `options` portion of the test script.  
Scenarios allow you to configure your VUs and test iterations in more granular detail,  
as they provide various additional options which dictate how your main test function runs.

The options provided are shown below.  
For more details, including the type of test executors available, see [here](https://grafana.com/docs/k6/latest/using-k6/scenarios/)

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/scenarioOptions.png" alt="Scenario Options" width="600" height="400"> 

### Example with Multiple Scenarios

You can use multiple scenarios in one script, and these scenarios can be run in sequence or in parallel.

The script shown below has two scenarios, contacts and news, which run in sequence:

1. At the beginning of the test, k6 starts the contacts scenario. 50 VUs try to run as many iterations as possible for 30 seconds.
2. After 30 seconds, k6 starts the news scenario. 50 VUs each try to run 100 iterations in one minute.

Each scenario has its own `options` configuration and different test logic,  
as each scenario calls a unique test function to execute.

Note that the value of the `exec` property of each scenario matches the name of a test function,  
as the purpose of this property to tell the scenario which function to execute.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/scenarioMulti.png" alt="Multiple Scenarios" width="700" height="700">

For further details on Multiple Scenario configurations, see [here](https://grafana.com/docs/k6/latest/using-k6/scenarios/advanced-examples/)

### Groups

For extra organization of your main test scripts you can utilise k6's groups feature.  
Groups can be used to separate your main test functions into smaller functions which have logical grouping.  
It is similar the concept of `steps` in Playwright and can allow for BDD-style testing.

All metrics emitted within a group will be tagged with the group name.  
For each group function k6 emits a `group_duration` metric, which contains the total time to execute the group function.

The group tags and the `group_duration` metric can add another element to your analysis of test results.
For further information on Groups and Tagging, see [here](https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/)

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/groups.png" alt="Groups" width="500" height="500">

### Cloud Configuration

To configure your test script to run in k6 cloud you need to add the `cloud` property within your scripts `options` object.
The cloud property simply states the location of the Amazon cloud server you wish to use,  
and the amount of load that will be distributed onto server as a percentage share.

If you are unsure how to do this, it can be added simply by setting configuring the load zone settings  
within the k6 test builder.

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudConfigBuilder.png" alt="Cloud Builder" width="950" height="350">

The configuration shown above will be added into the `options` object wiithin the test script as shown below

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/cloudConfigScript.png" alt="Cloud Script" width="800" height="500">

## Best Practice Guidelines for k6 Scripting

### Use Realistic Load Patterns

- **Gradual Ramp-up/Ramp-down**: Use stages to simulate realistic load patterns, and gradually increase and decrease load over time.  
  Drastically changing the load suddenly creates a spike, which is a different form of performance testing.
- **Think Time**: Include randomised, realistic sleep periods between requests, to simulate user think time and increase the realism of the test scenario.  
  This is to replicate actual human user behaviours, without it we would be simulating bots navigating the application.
- **Pause between iterations**: Add a short, hardcoded sleep between VU iterations, generally around 1 second.  
  This is to allow the current iteration of that VU to be disposed of, before the new iteration is spun up.
- **Graceful stop periods**: The `gracefulStop` is a period at the end of the test in which k6 lets iterations in progress finish.  
  If a test has a set duration or ramp down, its possible that k6 could interrupt iterations in progress.  
  These interruptions can lead to skewed metrics and unexpected test results.  
  The `gracefulStop` option is available for all scenario executors except `externally-controlled`
  Note that the `ramping-vus` executor allows for the extra property of a `gracefulRampDown`  
  which provides the time to wait for an already started iteration to finish before stopping it during a ramp down

The example script shown below, implements these guidelines for creating realistic load patterns

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/realisticPattern.png" alt="Realistic Pattern" width="800" height="700">

### Data Management

- **Data Preparation**: Prepare any necessary test data before the main test script executes.  
  Either withing the init context or using the `setup` function.
- **Data-driven Tests**: Use external data files or dynamic data generation to vary inputs and simulate real user interactions.  
  Where possible make requests that return a wide range of payloads to simulate realistic and varied workflows.
- **Shared Arrays** - Use k6's `sharedArray` component to import and use external data files.  
  They drastically reduce processing overheads, such as memory and CPU usage, compared to the alternatives.  
  Note a `sharedArray` can only be instantiated within the init context. For further information, see [here](https://grafana.com/docs/k6/latest/examples/data-parameterization/#performance-implications-of-sharedarray)

The simple example script shown below, implements these guidelines for creating realistic load patterns

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/usersJson.png" alt="Users JSON" width="600" height="200">

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/dataManagement.png" alt="Data Management" width="900" height="350">

### Monitoring and Logging

- **Custom Metrics**: Utilise custom metrics to capture specific types of response data,  
  which provides more granular insight into the overall test results.
- **Logging**: Use appropriate logging to capture important information without overwhelming the output.
- **Validate Responses**: Use checks to validate responses and ensure your application is fundamentally behaving as expected.  
  Keep the checks simple, short and basic, e.g. expected response code returned and/or an expected element in response body.

### Miscellaneous

- **Grouping Single Requests**: Don’t have single request groups as it adds unnecessary boilerplate.  
  Instead consider using tags for single requests to achieve similar group benefits e.g. name.  
  Or for single requests with dynamic URLs, use the URL grouping feature.  
  For further information see [here](https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/#discouraged-one-group-per-request)

Shown below is an example of bad practice when using groups

<img src="https://github.com/HealthResearchAuthority/rsp-iras-performance-tests/blob/main/src/resources/images/singleGroups.png" alt="Single Groups" width="800" height="500">

- **Baseline and Benchmarking**: Establish a performance baseline by running initial tests with a known configuration and load.  
  Use the baseline to compare against future tests to identify regressions or improvements.  
  Update and establish a new baseline when improvements are made.
  &nbsp;

# Supporting Documentation

1. [Test Tooling Standards Document](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/RSP%20Test%20Approach/Draft/Automation%20Test%20Tool%20Standards%20Draft%20Content.docx?d=wc9b5951cd936470984f391877ed0bd20&csf=1&web=1&e=PRwea3) (UPDATE THIS)
2. [k6 Setup Guide](https://healthresearchauthority.sharepoint.com/:w:/r/sites/Future-IRAS/Testing/QA%20Setup%20Docs/k6%20Setup%20Guide.docx?d=w773a69b410a8481b840b04b7f3bdc3a0&csf=1&web=1&e=VYFrQZ)
3. [k6 Documentation](https://grafana.com/docs/k6/latest/)
