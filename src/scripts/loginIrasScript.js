import { sleep, group, fail, check } from "k6";
import http from "k6/http";
import { decryptData } from "../utils/decryptData.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";
import { generateTOTP } from "../utils/generateMfaKey.js";

const baseURL =
  "https://fd-rsp-applications-automationtest-uks-e7f6hkg3c5edhxex.a03.azurefd.net/";

const loginDetails = new SharedArray("postBodies", function () {
  return JSON.parse(open("../resources/data/testData.json")).loginDetails;
});
const usernameInput = loginDetails[0].usernameInput;

export async function getPassword() {
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

export const options = {
  cloud: {
    distribution: {
      "amazon:gb:london": { loadZone: "amazon:gb:london", percent: 100 },
    },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    LoginIras: {
      executor: "ramping-vus",
      gracefulStop: "30s",
      stages: [
        { target: 1, duration: "5s" },
        { target: 0, duration: "5s" },
      ],
      gracefulRampDown: "10s",
      exec: "loginIras",
    },
  },
};

export async function setup() {
  let response;
  const password = await getPassword();
  response = http.get(`${baseURL}auth/signin`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });

  const csrf = response
    .html()
    .find("input[type=hidden][name=_csrf]")
    .first()
    .attr("value");

  response = http.post(
    `${response.url}`,
    {
      _csrf: `${csrf}`,
      supportInternationalNumbers: "",
    },
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://signin.integration.account.gov.uk",
      },
    }
  );

  response = http.post(
    `${response.url}`,
    {
      _csrf: `${csrf}`,
      email: `${usernameInput}`,
    },
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://signin.integration.account.gov.uk",
      },
    }
  );

  response = http.post(
    `${response.url}`,
    {
      _csrf: `${csrf}`,
      isReauthJourney: "false",
      password: `${password}`,
    },
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://signin.integration.account.gov.uk",
      },
    }
  );

  const secret = "ZE4S5KESHY7XYKJZTKHWW2GGFQLWJQY2";
  const totpCode = generateTOTP(secret);

  response = http.post(
    `${response.url}`,
    {
      _csrf: `${csrf}`,
      isAccountRecoveryPermitted: "true",
      mfaIssuePath: "/mfa-reset-with-ipv",
      code: `${totpCode}`,
    },
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://signin.integration.account.gov.uk",
      },
      redirects: 1,
    }
  );

  response = http.get(`${response.headers.Location}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirects: 1,
  });

  response = http.get(`${response.url}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirects: 1,
  });

  response = http.get(`${baseURL}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });

  if (
    response.html().find("h1[class=govuk-heading-l]").first().text() !=
    "My Account homepage"
  ) {
    fail("Failure to Authorize, No Cookies Set");
  }
  const authCookiesArr = response.request.headers.Cookie;
  return authCookiesArr;
}

export function loginIras(data) {
  let response;
  const cookies = data[0];

  group("Load HomePage after Auth", function () {
    response = http.get(`${baseURL}`, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-GB,en;q=0.9",
        "Cache-Control": "no-cache",
        Cookie: cookies,
      },
    });
    const isGetHomePageReqSuccessful = check(response, {
      "Home Page Request Success": () => response.status === 200,
      "Home Page Loaded Correctly": (res) =>
        res.body.indexOf(
          "This is your account homepage where you can access your workspaces"
        ) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/loginIrasScriptReport.json": JSON.stringify(data),
  };
}
