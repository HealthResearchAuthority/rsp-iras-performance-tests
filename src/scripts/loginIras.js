import { sleep, group } from "k6";
import http from "k6/http";
import { decryptData } from "../utils/decryptData.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const baseURL = "https://irasportal-automationtest.azurewebsites.net/";
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
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      Host: "irasportal-automationtest.azurewebsites.net",
    },
  });
  const sessionKey = response
    .html()
    .find("input[type=hidden][name=sessionDataKey]")
    .first()
    .attr("value");
  const clientIdRegex = new RegExp(/(?<=[=]).*?(?=[\&])/);
  const clientId = clientIdRegex.exec(response.url).toString();
  const dateTime = Date.now();

  response = http.get(
    `https://test.id.nihr.ac.uk/logincontext?sessionDataKey=${sessionKey}&relyingParty=${clientId}&tenantDomain=carbon.super&_=${dateTime}`,
    {
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
      },
    }
  );

  response = http.post(
    "https://test.id.nihr.ac.uk/commonauth",
    {
      usernameUserInput: "future_iras_auto_admin_user@test.id.nihr.ac.uk",
      username: "future_iras_auto_admin_user@test.id.nihr.ac.uk@carbon.super",
      password: `${password}`,
      sessionDataKey: `${sessionKey}`,
    },
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://test.id.nihr.ac.uk",
      },
    }
  );
  const code = response
    .html()
    .find("input[type=hidden][name=code]")
    .first()
    .attr("value");
  const state = response
    .html()
    .find("input[type=hidden][name=state]")
    .first()
    .attr("value");
  const sessionState = response
    .html()
    .find("input[type=hidden][name=session_state]")
    .first()
    .attr("value");

  response = http.post(
    `${baseURL}signin-oidc`,
    {
      code: `${code}`,
      state: `${state}`,
      session_state: `${sessionState}`,
    },
    {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "irasportal-automationtest.azurewebsites.net",
        Origin: "https://test.id.nihr.ac.uk",
      },
    }
  );

  response = http.get(`${baseURL}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      Host: "irasportal-automationtest.azurewebsites.net",
    },
  });
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
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Host: "irasportal-automationtest.azurewebsites.net",
        Cookie: cookies,
      },
    });
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/pocAuthSetupScriptReport.json": JSON.stringify(data),
  };
}
//To document
//
//add initial recorded script of Qset journey, copy script into new file
//Assume loginIras has been created previously - note to add the setup method from it, and pass in the data
//summarise changes to recorded script, to fit best practice guide in ReadMe - baseUrl, trim req, use variables,
//custom metrics, checks, groups etc
//add variable used to fill out create form and project info qset to external file, import as Shared Array and use
//submit as finished doc on sharepoint, link and reference in ReadMe (in test builder and Shared Array section)
//PR
//Review KT vid for anything else
