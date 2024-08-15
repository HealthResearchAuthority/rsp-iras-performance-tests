import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const baseURL = "https://petstore.swagger.io/v2";

//Request Params to Select From
const petNames = ["Percy", "Penelope", "Polly", "Paul", "Phil"];
const petCategories = ["Pig", "Python", "Parrot", "Porcupine", "Porpoise"];

export const options = {
  cloud: {
    distribution: {
      "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
    },
  },
  scenarios: {
    PocK6ApiJourney: {
      executor: "ramping-vus",
      gracefulStop: "10s",
      stages: [
        { duration: "10s", target: 2 },
        { duration: "20s", target: 2 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
      exec: "pocK6ApiJourney",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(95)<1000", "p(100)<5000"],
    //Use Custom Metric As Threshold
    delete_pet_response_time: ["p(100)<5000", "p(95)<1000"],
  },
};

//Custom Metric
export const TrendPostPetReqDuration = new Trend(
  "post_pet_response_time",
  true
);
export const TrendGetPetReqDuration = new Trend("get_pet_response_time", true);
export const TrendDeletePetReqDuration = new Trend(
  "delete_pet_response_time",
  true
);

export function pocK6ApiJourney() {
  let response;

  function userThinkTime() {
    sleep(Math.random() * 2 + 2);
  }

  function generateRandomId() {
    const id = Math.floor(100000 + Math.random() * 900000);
    return id;
  }

  const postHeaders = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  group("Create, Fetch & Remove Pet Journey", function () {
    const petId = generateRandomId();
    const petCategoryId = generateRandomId();
    const petCategory = randomItem(petCategories);
    const petName = randomItem(petNames);

    const postData = JSON.stringify({
      id: petId,
      category: {
        id: petCategoryId,
        name: `${petCategory}`,
      },
      name: `${petName}`,
      photoUrls: [],
      tags: [],
      status: "available",
    });

    response = http.post(`${baseURL}/pet`, postData, postHeaders);
    TrendPostPetReqDuration.add(response.timings.duration);
    const isPostPetReqSuccessful = check(response, {
      "Post Pet Request Success": () => response.status === 200,
      "Post Pet Request Time < 5secs": () => response.timings.duration < 5000,
      "Post Pet Request Time < 1secs": () => response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url,
      +"\n" + response.request.body
    );
    if (!isPostPetReqSuccessful) {
      console.error(
        `Post Pet Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime();

    response = http.get(`${baseURL}/pet/${petId}`);
    TrendGetPetReqDuration.add(response.timings.duration);
    const isGetPetReqSuccessful = check(response, {
      "Get Pet Request Success": () => response.status === 200,
      "Get Pet Request Expected Pet Id Returned": (r) =>
        r.body.includes(`"id":${petId}`) == true,
      "Get Pet Request Time < 5secs": () => response.timings.duration < 5000,
      "Get Pet Request Time < 1secs": () => response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetPetReqSuccessful) {
      console.error(
        `Get Pet Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code} \nResponse Body - ${response.body}`
      );
    }
    userThinkTime();

    response = http.del(`${baseURL}/pet/${petId}`);
    TrendDeletePetReqDuration.add(response.timings.duration);
    const isDeletePetReqSuccessful = check(response, {
      "Delete Pet Request Success": () => response.status === 200,
      "Delete Pet Request Expected Pet Id Returned": (r) =>
        r.body.includes(`"message":"${petId}"`) == true,
      "Delete Pet Request Time < 5secs": () => response.timings.duration < 5000,
      "Delete Pet Request Time < 1secs": () => response.timings.duration < 1000,
    });
    console.log(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isDeletePetReqSuccessful) {
      console.error(
        `Delete Pet Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code} \nResponse Body - ${response.body}`
      );
    }
    userThinkTime();
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/pocApiScriptReport.json": JSON.stringify(data),
  };
}
