import http from "k6/http";
import { check, group, sleep, fail } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { decryptData } from "../utils/decryptData.js";

const baseURL = "https://test.k6.io";

export const options = {
  cloud: {
    distribution: {
      "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
    },
  },
  scenarios: {
    AccessMessages: {
      executor: "ramping-vus",
      gracefulStop: "10s",
      stages: [
        { target: 2, duration: "10s" },
        { target: 2, duration: "10s" },
        { target: 0, duration: "10s" },
      ],
      gracefulRampDown: "10s",
      exec: "accessMessages",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(95)<1000", "p(100)<5000"],
  },
};

export async function setup() {
  if (`${__ENV.ENCRYPTED_DATA}`.toString() !== "undefined") {
    // the local env variable is defined
    const decrypted = await decryptData(`${__ENV.ENCRYPTED_DATA}`);
    return decrypted;
  } else if (`${__ENV.SECRET_DATA}`.toString() !== "undefined") {
    // the remote env variable is defined
    return `${__ENV.SECRET_DATA}`;
  } else {
    // no env variable is defined
    fail("No ENV Argument Set");
  }
}

export function accessMessages(data) {
  let response;
  function userThinkTime() {
    sleep(Math.random() * 2 + 2);
  }

  group("Login to Messages, Logout Journey", function () {
    response = http.get(`${baseURL}`);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
      "Get Home Page Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Home Page Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url,
      +"\n" + response.request.body
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    response = http.get(`${baseURL}/my_messages.php`);
    const isGetUnauthMsgsReqSuccessful = check(response, {
      "Get Unauthorized Messages Request Success": () =>
        response.status === 200,
      "Get Unauthorized Messages Request Expected Page Returned": (r) =>
        r.body.indexOf("Unauthorized") !== -1,
      "Get Unauthorized Messages Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Get Unauthorized Messages Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetUnauthMsgsReqSuccessful) {
      console.error(
        `Get Unauthorized Messages Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code} \nResponse Body - ${response.body}`
      );
    }
    userThinkTime();

    let csrftoken = response
      .html()
      .find("input[name=csrftoken]")
      .first()
      .attr("value");

    response = http.post(`${baseURL}/login.php`, {
      redir: "1",
      csrftoken: `${csrftoken}`,
      login: "admin",
      password: `${data}`,
    });
    const isPostLoginMsgReqSuccessful = check(response, {
      "Post Login Messages Request Success": () => response.status === 200,
      "Post Login Messages Request Expected Page Returned": (r) =>
        r.body.indexOf("Welcome, admin!") !== -1,
      "Post Login Messages Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Post Login Messages Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isPostLoginMsgReqSuccessful) {
      console.error(
        `Post Login Messages Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code} \nResponse Body - ${response.body}`
      );
    }
    userThinkTime();

    csrftoken = response
      .html()
      .find("input[name=csrftoken]")
      .first()
      .attr("value");

    response = http.post(`${baseURL}/login.php`, {
      redir: "1",
      csrftoken: `${csrftoken}`,
    });
    const isPostLogoutMsgReqSuccessful = check(response, {
      "Post Logout Messages Request Success": () => response.status === 200,
      "Post Logout Messages Request Expected Page Returned": (r) =>
        r.body.indexOf("Unauthorized") !== -1,
      "Post Logout Messages Request Time < 5secs": () =>
        response.timings.duration < 5000,
      "Post Logout Messages Request Time < 1secs": () =>
        response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isPostLogoutMsgReqSuccessful) {
      console.error(
        `Post Logout Messages Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code} \nResponse Body - ${response.body}`
      );
    }
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/pocAuthSetupScriptReport.json": JSON.stringify(data),
  };
}
