import http from "k6/http";
import { check, group, sleep, fail } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { decryptData } from "../utils/decryptData.js";
import { Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

const baseURL = "https://irasportal-automationtest.azurewebsites.net/";

const irasTabNavigationData = new SharedArray(
  "irasTabNavigationData",
  function () {
    return JSON.parse(open("../resources/data/testData.json"))
      .irasTabNavigation;
  }
);

export const options = {
  cloud: {
    distribution: {
      "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
    },
  },
  scenarios: {
    IrasTabNavigation: {
      executor: "ramping-vus",
      gracefulStop: "10s",
      stages: [
        { target: 5, duration: "10s" },
        { target: 5, duration: "10s" },
        { target: 0, duration: "10s" },
      ],
      gracefulRampDown: "10s",
      exec: "irasTabNavigation",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(95)<1000", "p(100)<5000"],
  },
};

//Custom Metrics
export const TrendHomePageReqDuration = new Trend(
  "load_iras_home_page_response_time",
  true
);
export const TrendReviewAppPageReqDuration = new Trend(
  "load_iras_review_app_page_response_time",
  true
);
export const TrendAdminPageReqDuration = new Trend(
  "load_iras_admin_page_response_time",
  true
);
export const TrendQsetPageReqDuration = new Trend(
  "load_iras_qset_page_response_time",
  true
);
export const TrendMyAppsPageReqDuration = new Trend(
  "load_iras_my_apps_page_response_time",
  true
);
export async function setup() {
  let response;
  let userPassword;
  if (`${__ENV.ENCRYPTED_DATA}`.toString() !== "undefined") {
    // the local env variable is defined
    const decrypted = await decryptData(`${__ENV.ENCRYPTED_DATA}`);
    userPassword = decrypted;
  } else if (`${__ENV.SECRET_DATA}`.toString() !== "undefined") {
    // the remote env variable is defined
    userPassword = `${__ENV.SECRET_DATA}`;
  } else {
    // no env variable is defined
    fail("No ENV Argument Set");
  }

  //Navigate to IDG Login Page
  const regexPatternSessionKey = /(?<=sessionDataKey=)[^&]+/;
  response = http.get(`${baseURL}auth/signin`);
  const isGetIdgLoginPageReqSuccessful = check(response, {
    "Get IDG Login Page Request Success": () => response.status === 200,
    "Get IDG Login Page Request Page Rendered": () =>
      response
        .html()
        .find(irasTabNavigationData[0].selectors.mainHeading)
        .text() == irasTabNavigationData[0].textAssertions.idgHeader,
  });
  console.log(
    "Request Sent: " + response.request.method + " " + response.request.url
  );
  if (!isGetIdgLoginPageReqSuccessful) {
    console.error(
      `Get IDG Login Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
    );
    fail("Failed to Access IDG successfully");
  }
  const sessionKey = response.url.match(regexPatternSessionKey);

  //Make Login Request
  response = http.post(`https://test.id.nihr.ac.uk/commonauth`, {
    usernameUserInput: "future_iras_auto_admin_user@test.id.nihr.ac.uk",
    username: "future_iras_auto_admin_user@test.id.nihr.ac.uk@carbon.super",
    password: `${userPassword}`,
    sessionDataKey: `${sessionKey[0]}`,
  });
  const isIdgLoginReqSuccessful = check(response, {
    "Post IDG Login Request Success": () => response.status === 200,
    "Post IDG Login Request Page Rendered": () =>
      response
        .html()
        .find(irasTabNavigationData[0].selectors.paragraph)
        .first()
        .text() == irasTabNavigationData[0].textAssertions.idgRedirectText,
  });
  console.log(
    "Request Sent: " + response.request.method + " " + response.request.url
  );
  if (!isIdgLoginReqSuccessful) {
    console.error(
      `Post IDG Login Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
    );
    fail("Failed to Login with IDG successfully");
  }
  const doc = response.html();

  //Follow IRAS Redirect to Login
  response = response.submitForm();
  const isLoginRedirectReqSuccessful = check(response, {
    "Post IRAS Redirect Request Success": () => response.status === 200,
    "Post IRAS Redirect Request Page Rendered": () =>
      response
        .html()
        .find(irasTabNavigationData[0].selectors.govukTextBody)
        .text()
        .trim() == irasTabNavigationData[0].textAssertions.authHomePageText,
  });
  console.log(
    "Request Sent: " + response.request.method + " " + response.request.url
  );
  if (!isLoginRedirectReqSuccessful) {
    console.error(
      `Post IRAS Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
    );
    fail("Failed Redirect from IDG Login successfully");
  }

  //Loading Home Page Directly to Fetch and Return Auth Cookies
  response = http.get(`${baseURL}`);
  TrendHomePageReqDuration.add(response.timings.duration);
  const isAuthHomePageReqSuccessful = check(response, {
    "Get Authenticated Home Page Request Success": () =>
      response.status === 200,
    "Get Authenticated Home Page Rendered": () =>
      response
        .html()
        .find(irasTabNavigationData[0].selectors.govukTextBody)
        .text()
        .trim() == irasTabNavigationData[0].textAssertions.authHomePageText,
  });
  console.log(
    "Request Sent: " + response.request.method + " " + response.request.url
  );
  if (!isAuthHomePageReqSuccessful) {
    console.error(
      `Get Authenticated Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
    );
    fail("Failed to Load Authenticated Home Page successfully");
  }
  return response.request.headers;
}

export function irasTabNavigation(data) {
  let response;
  function userThinkTime() {
    sleep(Math.random() * 2 + 2);
  }

  group("Navigate To All IRAS Pages Available in the NavBar", function () {
    //GET Home Page Request
    response = http.get(`${baseURL}`, { headers: data });
    TrendHomePageReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
      "Get Home Page Request Rendered": () =>
        response
          .html()
          .find(irasTabNavigationData[0].selectors.govukTextBody)
          .text()
          .trim() == irasTabNavigationData[0].textAssertions.authHomePageText,
      "Get Home Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Home Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    //GET Review Applications Page
    response = http.get(`${baseURL}applicationsreview`, { headers: data });
    TrendReviewAppPageReqDuration.add(response.timings.duration);
    const isGetAppReviewPageReqSuccessful = check(response, {
      "Get Review Applications Page Request Success": () =>
        response.status === 200,
      "Get Review Applications Page Request Rendered": () =>
        response
          .html()
          .find(irasTabNavigationData[0].selectors.titleId)
          .text() == irasTabNavigationData[0].textAssertions.reviewAppsHeader,
      "Get Review Applications Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Review Applications Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetAppReviewPageReqSuccessful) {
      console.error(
        `Get Review Applications Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    //GET Admin Page
    response = http.get(`${baseURL}admin`, { headers: data });
    TrendAdminPageReqDuration.add(response.timings.duration);
    const isGetAdminPageReqSuccessful = check(response, {
      "Get Admin Page Request Success": () => response.status === 200,
      "Get Admin Page Request Rendered": () =>
        response
          .html()
          .find(irasTabNavigationData[0].selectors.govukHeading)
          .text() == irasTabNavigationData[0].textAssertions.adminHeader,
      "Get Admin Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Admin Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetAdminPageReqSuccessful) {
      console.error(
        `Get Admin Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    //GET Question Set Page
    response = http.get(`${baseURL}questionset/upload`, { headers: data });
    TrendQsetPageReqDuration.add(response.timings.duration);
    const isGetQsetPageReqSuccessful = check(response, {
      "Get Question Set Page Request Success": () => response.status === 200,
      "Get Question Set Page Request Rendered": () =>
        response
          .html()
          .find(irasTabNavigationData[0].selectors.govukHeading)
          .text() == irasTabNavigationData[0].textAssertions.qsetHeader,
      "Get Question Set Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Question Set Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetQsetPageReqSuccessful) {
      console.error(
        `Get Question Set Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    //GET My Applications Page
    response = http.get(`${baseURL}application/myapplications`, {
      headers: data,
    });
    TrendMyAppsPageReqDuration.add(response.timings.duration);
    const isGetMyAppsPageReqSuccessful = check(response, {
      "Get My Applications Page Request Success": () => response.status === 200,
      "Get My Applications Page Request Rendered": () =>
        response
          .html()
          .find(irasTabNavigationData[0].selectors.titleId)
          .text() == irasTabNavigationData[0].textAssertions.myAppsHeader,
      "Get My Applications Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get My Applications Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetMyAppsPageReqSuccessful) {
      console.error(
        `Get My Applications Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/irasTabNavigationScriptReport.json": JSON.stringify(data),
  };
}
