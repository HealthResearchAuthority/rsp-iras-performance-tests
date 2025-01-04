import { sleep, check, group } from "k6";
import http from "k6/http";
import { Trend } from "k6/metrics";

export const options = {
  cloud: {
    distribution: {
      "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<=2000"],
    http_req_failed: [{ threshold: "rate<=0.01", abortOnFail: true }],
    http_req_duration: ["p(99)<=1000"],
    Get_HomePage: ["p(95)<=200"],
  },
  scenarios: {
    Scenario_SampleTest: {
      executor: "ramping-vus",
      gracefulStop: "30s",
      stages: [
        { target: 20, duration: "100s" },
        { target: 20, duration: "100s" },
        { target: 10, duration: "50s" },
        { target: 10, duration: "100s" },
        { target: 20, duration: "50s" },
        { target: 20, duration: "100s" },
        { target: 0, duration: "100s" },
      ],
      gracefulRampDown: "30s",
      exec: "scenario_sample",
    },
  },
};

export const TrendHomePage = new Trend("Get_HomePage");

export function scenario_sample() {
  let response;

  function waitTime() {
    sleep(Math.random() * 2 + 2);
  }
  function checkResponse() {
    check(response, {
      "status equals 200": (response) => response.status.toString() === "200",
    });
  }

  const headerVal = {
    headers: {
      "upgrade-insecure-requests": "1",
      "sec-ch-ua":
        '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  };

  group("Navigate to Contacts Page", function () {
    response = http.get("https://test.k6.io/", headerVal);
    TrendHomePage.add(response.timings.duration);
    checkResponse();
    waitTime();

    response = http.get("https://test.k6.io/contacts.php", headerVal);
    checkResponse();
    waitTime();
  });

  group("Navigate to News Page", function () {
    response = http.get("https://test.k6.io/", headerVal);
    checkResponse();
    waitTime();

    response = http.get("https://test.k6.io/news.php", headerVal);
    checkResponse();
    waitTime();
  });

  group("Navigate to HomePage", function () {
    response = http.get("https://test.k6.io/", headerVal);
    checkResponse();
    waitTime();
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/K6ScriptReport.json": JSON.stringify(data),
  };
}
