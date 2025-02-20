import { sleep, group, fail, check } from "k6";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { decryptData } from "../utils/decryptData.js";
import { textSummary, ra } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const baseURL = "https://irasportal-automationtest.azurewebsites.net/";

const postBodies = new SharedArray("postBodies", function () {
  return JSON.parse(open("../resources/data/testData.json")).initialQsetScript;
});

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
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(95)<3000", "p(100)<5000"],
  },
  scenarios: {
    InitialQsetJourney: {
      executor: "ramping-vus",
      gracefulStop: "30s",
      stages: [
        { target: 2, duration: "10s" },
        { target: 2, duration: "30s" },
        { target: 0, duration: "30s" },
      ],
      gracefulRampDown: "30s",
      exec: "initialQsetJourney",
    },
  },
};

//Custom Metric
export const TrendHomePageReqDuration = new Trend(
  "load_iras_home_page_response_time",
  true
);
export const TrendStartAppReqDuration = new Trend(
  "load_start_app_response_time",
  true
);
export const TrendCreateAppReqDuration = new Trend(
  "load_create_app_response_time",
  true
);
export const TrendGetProjFilterReqDuration = new Trend(
  "load_proj_filter_qset_response_time",
  true
);
export const TrendPostProjFilterReqDuration = new Trend(
  "submit_proj_filter_qset_response_time",
  true
);
export const TrendResumeProjFilterReqDuration = new Trend(
  "resume_proj_filter_qset_response_time",
  true
);
export const TrendGetProjDetailsReqDuration = new Trend(
  "load_proj_details_qset_response_time",
  true
);

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
  if (response.status != 200) {
    fail("Failure to Authorize, No Cookies Set");
  }
  const authCookiesArr = response.request.headers.Cookie;
  return authCookiesArr;
}

export function initialQsetJourney(data) {
  let response;
  const cookies = data[0];
  function userThinkTime(min, max) {
    return sleep(Math.random() * (max - min) + min);
  }

  group("Start a New Application", function () {
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
    TrendHomePageReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Home Page Request Success": () => response.status === 200,
      "Home Page Loaded Correctly": (res) =>
        res.body.indexOf("Make changes to an approved project") !== -1,
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
    userThinkTime(2, 4);

    response = http.get(`${baseURL}application/startnewapplication`, {
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
    TrendStartAppReqDuration.add(response.timings.duration);
    const isGetStartAppReqSuccessful = check(response, {
      "Start Application Request Success": () => response.status === 200,
      "Start Application Loaded Correctly": (res) =>
        res.body.indexOf("Enter application details") !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetStartAppReqSuccessful) {
      console.error(
        `Get Start Application Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const postBody = Object.assign({}, randomItem(postBodies[0]).postBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(`${baseURL}application/createapplication`, postBody, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "irasportal-automationtest.azurewebsites.net",
        Origin: "https://irasportal-automationtest.azurewebsites.net",
        Cookie: cookies,
      },
    });
    TrendCreateAppReqDuration.add(response.timings.duration);
    const isPostCreateAppReqSuccessful = check(response, {
      "Create Application Request Success": () => response.status === 200,
      "Create Application Loaded Correctly": (res) =>
        res.body.indexOf("Continue to make changes") !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isPostCreateAppReqSuccessful) {
      console.error(
        `Post Create Application Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);
  });

  group("Complete Project Filter Question Set", function () {
    const applicationId = response
      .html()
      .find("dd[id=review_title]")
      .first()
      .text();

    response = http.get(
      `${baseURL}questionnaire/displayquestionnaire?categoryId=A`,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          Host: "irasportal-automationtest.azurewebsites.net",
          Cookie: cookies,
        },
      }
    );
    TrendGetProjFilterReqDuration.add(response.timings.duration);
    const isGetProjFilterQsetReqSuccessful = check(response, {
      "Project Filter Qset Request Success": () => response.status === 200,
      "Project Filter Qset Loaded Correctly": (res) =>
        res.body.indexOf(
          "Provide project title between 15 and 100 characters"
        ) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetProjFilterQsetReqSuccessful) {
      console.error(
        `Get Project Filter Qset Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(30, 45);

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      "CurrentStage=&Questions%5B0%5D.Index=0&Questions%5B0%5D.QuestionId=IQA0002&Questions%5B0%5D.Category=A&Questions%5B0%5D.SectionId=IQT0001&Questions%5B0%5D.Section=Project%2BDetails&Questions%5B0%5D.Heading=1&Questions%5B0%5D.QuestionText=Short%2Bproject%2Btitle&Questions%5B0%5D.QuestionType=Text&Questions%5B0%5D.DataType=Text&Questions%5B0%5D.IsMandatory=True&Questions%5B0%5D.IsOptional=False&Questions%5B0%5D.AnswerText=Testing%2BTo%2BFill%2BThe%2BSpace&Questions%5B1%5D.Index=1&Questions%5B1%5D.QuestionId=IQA0001&Questions%5B1%5D.Category=A&Questions%5B1%5D.SectionId=IQT0001&Questions%5B1%5D.Section=Project%2BDetails&Questions%5B1%5D.Heading=2&Questions%5B1%5D.QuestionText=Identify%2Byour%2Brole&Questions%5B1%5D.QuestionType=Look-up%2Blist&Questions%5B1%5D.DataType=TBC&Questions%5B1%5D.IsMandatory=True&Questions%5B1%5D.IsOptional=False&Questions%5B2%5D.Index=2&Questions%5B2%5D.QuestionId=IQA0003&Questions%5B2%5D.Category=A&Questions%5B2%5D.SectionId=IQT0001&Questions%5B2%5D.Section=Project%2BDetails&Questions%5B2%5D.Heading=3&Questions%5B2%5D.QuestionText=Full%2Bproject%2Btitle&Questions%5B2%5D.QuestionType=Text&Questions%5B2%5D.DataType=Text&Questions%5B2%5D.IsMandatory=True&Questions%5B2%5D.IsOptional=False&Questions%5B2%5D.AnswerText=Full%2BProject%2BTitle&Questions%5B3%5D.Index=3&Questions%5B3%5D.QuestionId=IQA0004&Questions%5B3%5D.Category=A&Questions%5B3%5D.SectionId=IQT0001&Questions%5B3%5D.Section=Project%2BDetails&Questions%5B3%5D.Heading=4&Questions%5B3%5D.QuestionText=Is%2Bthis%2Bproject%2Blikely%2Bto%2Bbe%2Bmanaged%2Bas%2Bcommercial%2Bresearch%3F&Questions%5B3%5D.QuestionType=Boolean&Questions%5B3%5D.DataType=Boolean&Questions%5B3%5D.IsMandatory=True&Questions%5B3%5D.IsOptional=False&Questions%5B3%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B3%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B3%5D.SelectedOption=OPT0004&Questions%5B3%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B3%5D.Answers%5B1%5D.AnswerText=No&Questions%5B4%5D.Index=4&Questions%5B4%5D.QuestionId=IQA03271&Questions%5B4%5D.Category=A&Questions%5B4%5D.SectionId=IQT0001&Questions%5B4%5D.Section=Project%2BDetails&Questions%5B4%5D.Heading=5&Questions%5B4%5D.QuestionText=Are%2Byou%2Bseeking%2BNIHR%2Bfunding%2Bfor%2Bthis%2Bproject%3F&Questions%5B4%5D.QuestionType=Boolean&Questions%5B4%5D.DataType=Boolean&Questions%5B4%5D.IsMandatory=True&Questions%5B4%5D.IsOptional=False&Questions%5B4%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B4%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B4%5D.SelectedOption=OPT0004&Questions%5B4%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B4%5D.Answers%5B1%5D.AnswerText=No&Questions%5B5%5D.Index=5&Questions%5B5%5D.QuestionId=IQG0001&Questions%5B5%5D.Category=A&Questions%5B5%5D.SectionId=IQT0001&Questions%5B5%5D.Section=Project%2BDetails&Questions%5B5%5D.Heading=Note&Questions%5B5%5D.QuestionText=The%2Bfollowing%2Bservices%2Bto%2Bsupport%2Bresearchers%2Bare%2Bavailable%2Bvia%2Bthe%2BCentral%2BPortfolio%2BManagement%2BSystem%2B%28CPMS%29%0D%0A%E2%80%A2%2Bcreation%2Bof%2Ba%2BSchedule%2Bof%2BEvents%2BCost%2BAttribution%2BTemplate%2B%28SoECAT%29%2Bto%2Bsupport%2Bnon-commercial%2Bfunding%2Bapplications%2Band%2Bthe%2Bset-up%2Bof%2Bstudies%2Bin%2Bthe%2BNHS%2Bor%2BHSC%0D%0A%E2%80%A2%2Bcreation%2Bof%2Ban%2Binteractive%2Bcosting%2Btool%2B%28for%2Bcommercial%2Bsponsors%29%2Bfor%2Bset%2Bup%2Bof%2Bstudies%2Bin%2Bthe%2BNHS%2Bor%2BHSC%2B%0D%0A%E2%80%A2%2Baccess%2Bto%2Bfeasibility%2Bservices%0D%0A%E2%80%A2%2Baccess%2Bto%2Bclinical%2Bresearch%2Bnetwork%2Bsupport&Questions%5B5%5D.QuestionType=Label%3A%2Bon-screen%2Binstruction&Questions%5B5%5D.DataType=n%2Fa&Questions%5B5%5D.IsMandatory=True&Questions%5B5%5D.IsOptional=False&Questions%5B6%5D.Index=6&Questions%5B6%5D.QuestionId=IQA0005&Questions%5B6%5D.Category=A&Questions%5B6%5D.SectionId=IQT0001&Questions%5B6%5D.Section=Project%2BDetails&Questions%5B6%5D.Heading=6&Questions%5B6%5D.QuestionText=Do%2Byou%2Bwish%2Bto%2Baccess%2Bone%2Bor%2Bmore%2Bof%2Bthe%2BCPMS%2Bservices%3F%2BIf%2Byou%2Bselect%2B%27Yes%27%2C%2BIRAS%2Bwill%2Bshare%2Binformation%2Bwith%2Bthe%2BCPMS%2Bonce%2Bthe%2B%27continue%27%2Bbutton%2Bat%2Bthe%2Bbottom%2Bof%2Bthe%2Bpage%2Bhas%2Bbeen%2Bpressed.&Questions%5B6%5D.QuestionType=Boolean&Questions%5B6%5D.DataType=Boolean&Questions%5B6%5D.IsMandatory=True&Questions%5B6%5D.IsOptional=False&Questions%5B6%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B6%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B6%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B6%5D.Answers%5B1%5D.AnswerText=No&Questions%5B6%5D.SelectedOption=OPT0005&Questions%5B7%5D.Index=7&Questions%5B7%5D.QuestionId=IQA0006&Questions%5B7%5D.Category=A&Questions%5B7%5D.SectionId=IQT0001&Questions%5B7%5D.Section=Project%2BDetails&Questions%5B7%5D.Heading=6a&Questions%5B7%5D.QuestionText=Provide%2Bthe%2Bemail%2Bof%2Bthe%2Bperson%2Bwho%2Bwill%2Bbe%2Bthe%2Binitial%2Bcontact%2Bfor%2BCPMS.&Questions%5B7%5D.QuestionType=Text&Questions%5B7%5D.DataType=Email&Questions%5B7%5D.IsMandatory=False&Questions%5B7%5D.IsOptional=False&Questions%5B7%5D.AnswerText=&Questions%5B8%5D.Index=8&Questions%5B8%5D.QuestionId=IQG0002&Questions%5B8%5D.Category=A&Questions%5B8%5D.SectionId=IQT0001&Questions%5B8%5D.Section=Project%2BDetails&Questions%5B8%5D.Heading=Note&Questions%5B8%5D.QuestionText=The%2Bperson%2Bidentified%2Bwill%2Bbe%2Bable%2Bto%2Baccess%2BCPMS%2B%5Blink%2Bto%2BCPMS%2BSIM%2BHomepage%2BLink%5D.&Questions%5B8%5D.QuestionType=Label%3A%2Bon-screen%2Binstruction&Questions%5B8%5D.DataType=n%2Fa&Questions%5B8%5D.IsMandatory=False&Questions%5B8%5D.IsOptional=False&Questions%5B9%5D.Index=9&Questions%5B9%5D.QuestionId=IQA0012&Questions%5B9%5D.Category=A&Questions%5B9%5D.SectionId=IQT0003&Questions%5B9%5D.Section=Project%2BScope&Questions%5B9%5D.Heading=1&Questions%5B9%5D.QuestionText=Is%2Bthe%2Bresearch%2Bproject%2Bor%2Bany%2Bpart%2Bof%2Bit%2Bbeing%2Bundertaken%2Bas%2Ban%2Beducational%2Bproject%3F&Questions%5B9%5D.QuestionType=Boolean&Questions%5B9%5D.DataType=Boolean&Questions%5B9%5D.IsMandatory=True&Questions%5B9%5D.IsOptional=False&Questions%5B9%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B9%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B9%5D.SelectedOption=OPT0004&Questions%5B9%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B9%5D.Answers%5B1%5D.AnswerText=No&Questions%5B10%5D.Index=10&Questions%5B10%5D.QuestionId=IQA0061&Questions%5B10%5D.Category=A&Questions%5B10%5D.SectionId=IQT0003&Questions%5B10%5D.Section=Project%2BScope&Questions%5B10%5D.Heading=2&Questions%5B10%5D.QuestionText=Select%2Ball%2Bthe%2Bactivities%2Bthat%2Bwill%2Bbe%2Binvolved%2Bin%2Bthis%2Bproject%3A&Questions%5B10%5D.QuestionType=Look-up%2Blist&Questions%5B10%5D.DataType=Checkbox&Questions%5B10%5D.IsMandatory=True&Questions%5B10%5D.IsOptional=False&Questions%5B10%5D.Answers%5B0%5D.AnswerId=OPT0006&Questions%5B10%5D.Answers%5B0%5D.AnswerText=Use%2Bof%2Bpreviously%2Bcollected%2Bdata%2Babout%2Bpeople&Questions%5B10%5D.Answers%5B0%5D.IsSelected=true%2Cfalse&Questions%5B10%5D.Answers%5B1%5D.AnswerId=OPT0007&Questions%5B10%5D.Answers%5B1%5D.AnswerText=Use%2Bof%2Bpreviously%2Bcollected%2Bhuman%2Bbiological%2Bsamples&Questions%5B10%5D.Answers%5B2%5D.AnswerId=OPT0008&Questions%5B10%5D.Answers%5B2%5D.AnswerText=Research%2Binvolving%2Bstaff%2Bonly&Questions%5B10%5D.Answers%5B3%5D.AnswerId=OPT0009&Questions%5B10%5D.Answers%5B3%5D.AnswerText=Non-clinical%2Bactivities%2Bwith%2Bstaff%2C%2Bsuch%2Bas%2Binterviews%2C%2Bquestionnaires%2Bor%2Bobservation&Questions%5B10%5D.Answers%5B4%5D.AnswerId=OPT0010&Questions%5B10%5D.Answers%5B4%5D.AnswerText=Non-clinical%2Bactivities%2Bwith%2Bpeople%2B%28other%2Bthan%2Bstaff%29%2C%2Bsuch%2Bas%2Binterviews%2Bor%2Bsurveys&Questions%5B10%5D.Answers%5B5%5D.AnswerId=OPT0011&Questions%5B10%5D.Answers%5B5%5D.AnswerText=Non-clinical%2Bactivities%2Bwith%2Bpeople%2C%2Bsuch%2Bas%2Bnon-clinical%2Bassessments%2C%2Bobservations%2Bor%2Bcare%2Bprocedures&Questions%5B10%5D.Answers%5B6%5D.AnswerId=OPT0012&Questions%5B10%5D.Answers%5B6%5D.AnswerText=Clinical%2Bactivities%2Bwith%2Bpeople%2C%2Bsuch%2Bas%2Bcollecting%2Bhuman%2Bbiological%2Bsamples%2C%2Bimaging%2Binvestigations%2Bor%2Bdiagnostics&Questions%5B10%5D.Answers%5B7%5D.AnswerId=OPT0013&Questions%5B10%5D.Answers%5B7%5D.AnswerText=Treatment%2C%2Bsuch%2Bas%2Bmedicines%2C%2Bdevices%2C%2Bsurgery%2C%2Bvaccines%2Bor%2Btherapies&Questions%5B11%5D.Index=11&Questions%5B11%5D.QuestionId=IQA0014&Questions%5B11%5D.Category=A&Questions%5B11%5D.SectionId=IQT0003&Questions%5B11%5D.Section=Project%2BScope&Questions%5B11%5D.Heading=3&Questions%5B11%5D.QuestionText=Is%2Bthis%2Bapplication%2Bto%2Bestablis%2Ba%2Bresearch%2Bbioresource%3F&Questions%5B11%5D.QuestionType=Boolean&Questions%5B11%5D.DataType=Boolean&Questions%5B11%5D.IsMandatory=False&Questions%5B11%5D.IsOptional=False&Questions%5B11%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B11%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B11%5D.SelectedOption=OPT0004&Questions%5B11%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B11%5D.Answers%5B1%5D.AnswerText=No&Questions%5B12%5D.Index=12&Questions%5B12%5D.QuestionId=IQA0015&Questions%5B12%5D.Category=A&Questions%5B12%5D.SectionId=IQT0003&Questions%5B12%5D.Section=Project%2BScope&Questions%5B12%5D.Heading=3a&Questions%5B12%5D.QuestionText=Will%2Bthe%2Bbioresource%2Bbe%2Bestablished%2Bwithin%2Ba%2BNHS%2Bor%2BHSC%2Bdiagnostic%2Barchive%3F&Questions%5B12%5D.QuestionType=Boolean&Questions%5B12%5D.DataType=Boolean&Questions%5B12%5D.IsMandatory=False&Questions%5B12%5D.IsOptional=False&Questions%5B12%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B12%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B12%5D.SelectedOption=OPT0004&Questions%5B12%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B12%5D.Answers%5B1%5D.AnswerText=No&Questions%5B13%5D.Index=13&Questions%5B13%5D.QuestionId=IQA0017&Questions%5B13%5D.Category=A&Questions%5B13%5D.SectionId=IQT0003&Questions%5B13%5D.Section=Project%2BScope&Questions%5B13%5D.Heading=4&Questions%5B13%5D.QuestionText=Is%2Bthis%2Bproject%2Ba%2Bclinical%2Btrial%2Bof%2Ban%2Binvestigational%2Bmedicinal%2Bproduct%2B%28CTIMP%29%3F&Questions%5B13%5D.QuestionType=Boolean&Questions%5B13%5D.DataType=Boolean&Questions%5B13%5D.IsMandatory=False&Questions%5B13%5D.IsOptional=False&Questions%5B13%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B13%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B13%5D.SelectedOption=OPT0004&Questions%5B13%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B13%5D.Answers%5B1%5D.AnswerText=No&Questions%5B14%5D.Index=14&Questions%5B14%5D.QuestionId=IQA0018&Questions%5B14%5D.Category=A&Questions%5B14%5D.SectionId=IQT0003&Questions%5B14%5D.Section=Project%2BScope&Questions%5B14%5D.Heading=4a&Questions%5B14%5D.QuestionText=Select%2Bthe%2Boption%2Bthat%2Bapplies%2Bto%2Byour%2Bproject%3A&Questions%5B14%5D.QuestionType=Boolean&Questions%5B14%5D.DataType=Boolean&Questions%5B14%5D.IsMandatory=False&Questions%5B14%5D.IsOptional=False&Questions%5B14%5D.Answers%5B0%5D.AnswerId=OPT0014&Questions%5B14%5D.Answers%5B0%5D.AnswerText=clinical%2Btrial%2Bof%2Ban%2Binvestigational%2Bmedicinal%2Bproduct&Questions%5B14%5D.SelectedOption=OPT0014&Questions%5B14%5D.Answers%5B1%5D.AnswerId=OPT0015&Questions%5B14%5D.Answers%5B1%5D.AnswerText=combined%2Btrial%2Bof%2Ban%2Binvestigational%2Bmedicinal%2Bproduct%2Band%2Ban%2Binvestigational%2Bmedical%2Bdevice&Questions%5B15%5D.Index=15&Questions%5B15%5D.QuestionId=IQA03282&Questions%5B15%5D.Category=A&Questions%5B15%5D.SectionId=IQT0003&Questions%5B15%5D.Section=Project%2BScope&Questions%5B15%5D.Heading=4b&Questions%5B15%5D.QuestionText=Does%2Bany%2Binvestigational%2Bmedicinal%2Bproduct%2Bcontain%2Bgenetically%2Bmodified%2Borganisms%3F&Questions%5B15%5D.QuestionType=Boolean&Questions%5B15%5D.DataType=Boolean&Questions%5B15%5D.IsMandatory=False&Questions%5B15%5D.IsOptional=False&Questions%5B15%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B15%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B15%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B15%5D.Answers%5B1%5D.AnswerText=No&Questions%5B16%5D.Index=16&Questions%5B16%5D.QuestionId=IQA0020&Questions%5B16%5D.Category=A&Questions%5B16%5D.SectionId=IQT0003&Questions%5B16%5D.Section=Project%2BScope&Questions%5B16%5D.Heading=5&Questions%5B16%5D.QuestionText=Is%2Bthis%2Bproject%2Ba%2Bclinical%2Binvestigation%2Bor%2Bother%2Bstudy%2Bof%2Ba%2Bmedical%2Bdevice%2B%28including%2Bdigital%2Btechnology%29%3F&Questions%5B16%5D.QuestionType=Boolean&Questions%5B16%5D.DataType=Boolean&Questions%5B16%5D.IsMandatory=False&Questions%5B16%5D.IsOptional=False&Questions%5B16%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B16%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B16%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B16%5D.Answers%5B1%5D.AnswerText=No&Questions%5B17%5D.Index=17&Questions%5B17%5D.QuestionId=IQA0021&Questions%5B17%5D.Category=A&Questions%5B17%5D.SectionId=IQT0003&Questions%5B17%5D.Section=Project%2BScope&Questions%5B17%5D.Heading=6&Questions%5B17%5D.QuestionText=Does%2Bthe%2Bproject%2Binvolve%2Bexposing%2Bparticipants%2Bto%2Bany%2Bionising%2Bradiation%3F&Questions%5B17%5D.QuestionType=Boolean&Questions%5B17%5D.DataType=Boolean&Questions%5B17%5D.IsMandatory=False&Questions%5B17%5D.IsOptional=False&Questions%5B17%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B17%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B17%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B17%5D.Answers%5B1%5D.AnswerText=No&Questions%5B18%5D.Index=18&Questions%5B18%5D.QuestionId=IQA0022&Questions%5B18%5D.Category=A&Questions%5B18%5D.SectionId=IQT0003&Questions%5B18%5D.Section=Project%2BScope&Questions%5B18%5D.Heading=7&Questions%5B18%5D.QuestionText=Will%2Byou%2Bbe%2Btaking%2Bor%2Busing%2Bany%2Bhuman%2Bbiological%2Bsamples%3F&Questions%5B18%5D.QuestionType=Boolean&Questions%5B18%5D.DataType=Boolean&Questions%5B18%5D.IsMandatory=False&Questions%5B18%5D.IsOptional=False&Questions%5B18%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B18%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B18%5D.SelectedOption=OPT0004&Questions%5B18%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B18%5D.Answers%5B1%5D.AnswerText=No&Questions%5B19%5D.Index=19&Questions%5B19%5D.QuestionId=IQA0023&Questions%5B19%5D.Category=A&Questions%5B19%5D.SectionId=IQT0003&Questions%5B19%5D.Section=Project%2BScope&Questions%5B19%5D.Heading=7a&Questions%5B19%5D.QuestionText=Select%2Bthe%2Boption%2Bthat%2Bapplies%2Bto%2Byour%2Bproject%3A&Questions%5B19%5D.QuestionType=Look-up%2Blist&Questions%5B19%5D.DataType=Radio%2Bbutton&Questions%5B19%5D.IsMandatory=False&Questions%5B19%5D.IsOptional=False&Questions%5B20%5D.Index=20&Questions%5B20%5D.QuestionId=IQA0024&Questions%5B20%5D.Category=A&Questions%5B20%5D.SectionId=IQT0003&Questions%5B20%5D.Section=Project%2BScope&Questions%5B20%5D.Heading=8&Questions%5B20%5D.QuestionText=Will%2Bidentifiable%2Bpatient%2Bdata%2Bbe%2Baccessed%2Boutside%2Bthe%2Bcare%2Bteam%2Bwithout%2Bprior%2Bconsent%2Bat%2Bany%2Bstage%2Bof%2Bthe%2Bproject%2B%28including%2Bidentification%2Bof%2Bpotential%2Bparticipants%29%3F&Questions%5B20%5D.QuestionType=Boolean&Questions%5B20%5D.DataType=Boolean&Questions%5B20%5D.IsMandatory=False&Questions%5B20%5D.IsOptional=False&Questions%5B20%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B20%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B20%5D.SelectedOption=OPT0004&Questions%5B20%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B20%5D.Answers%5B1%5D.AnswerText=No&Questions%5B21%5D.Index=21&Questions%5B21%5D.QuestionId=IQA0025&Questions%5B21%5D.Category=A&Questions%5B21%5D.SectionId=IQT0003&Questions%5B21%5D.Section=Project%2BScope&Questions%5B21%5D.Heading=9&Questions%5B21%5D.QuestionText=Do%2Byou%2Bplan%2Bat%2Bany%2Bstage%2Bof%2Bthe%2Bproject%2Bto%2Bundertake%2Bresearch%2Bwith%2Badults%2Blacking%2Bcapacity%2Bto%2Bconsent%2Bfor%2Bthemselves%2Bthat%2Bwould%2Botherwise%2Brequire%2Bconsent%3F&Questions%5B21%5D.QuestionType=Boolean&Questions%5B21%5D.DataType=Boolean&Questions%5B21%5D.IsMandatory=False&Questions%5B21%5D.IsOptional=False&Questions%5B21%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B21%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B21%5D.SelectedOption=OPT0004&Questions%5B21%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B21%5D.Answers%5B1%5D.AnswerText=No&Questions%5B22%5D.Index=22&Questions%5B22%5D.QuestionId=IQA0026&Questions%5B22%5D.Category=A&Questions%5B22%5D.SectionId=IQT0003&Questions%5B22%5D.Section=Project%2BScope&Questions%5B22%5D.Heading=10&Questions%5B22%5D.QuestionText=Will%2Byou%2Binclude%2Bany%2Bparticipants%2Bwho%2Bare%2Bchildren%3F&Questions%5B22%5D.QuestionType=Boolean&Questions%5B22%5D.DataType=Boolean&Questions%5B22%5D.IsMandatory=False&Questions%5B22%5D.IsOptional=False&Questions%5B22%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B22%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B22%5D.SelectedOption=OPT0004&Questions%5B22%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B22%5D.Answers%5B1%5D.AnswerText=No&Questions%5B23%5D.Index=23&Questions%5B23%5D.QuestionId=IQA0027&Questions%5B23%5D.Category=A&Questions%5B23%5D.SectionId=IQT0003&Questions%5B23%5D.Section=Project%2BScope&Questions%5B23%5D.Heading=11&Questions%5B23%5D.QuestionText=Will%2Byou%2Binclude%2Bany%2Bparticipants%2Bwho%2Bare%2Bprisoners%2Bor%2Byoung%2Boffenders%2Bin%2Bthe%2Bcustody%2Bof%2BHis%2BMajesty%27s%2BPrison%2Band%2BProbation%2BService%2B%28HMPPS%29%2Bor%2Bwho%2Bare%2Boffenders%2Bsupervised%2Bby%2Bthe%2Bprobation%2Bservice%2Bin%2BEngland%2Bor%2BWales%3F&Questions%5B23%5D.QuestionType=Boolean&Questions%5B23%5D.DataType=Boolean&Questions%5B23%5D.IsMandatory=True&Questions%5B23%5D.IsOptional=False&Questions%5B23%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B23%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B23%5D.SelectedOption=OPT0004&Questions%5B23%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B23%5D.Answers%5B1%5D.AnswerText=No&Questions%5B24%5D.Index=24&Questions%5B24%5D.QuestionId=IQA0028&Questions%5B24%5D.Category=A&Questions%5B24%5D.SectionId=IQT0003&Questions%5B24%5D.Section=Project%2BScope&Questions%5B24%5D.Heading=12&Questions%5B24%5D.QuestionText=Will%2Bthis%2Bproject%2Binvolve%2Bany%2Bactivity%2Bunder%2Bthe%2Bresponsibility%2Bof%2Bthe%2BMinistry%2Bof%2BDefence%2B%28MOD%29%3F&Questions%5B24%5D.QuestionType=Boolean&Questions%5B24%5D.DataType=Boolean&Questions%5B24%5D.IsMandatory=True&Questions%5B24%5D.IsOptional=False&Questions%5B24%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B24%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B24%5D.SelectedOption=OPT0004&Questions%5B24%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B24%5D.Answers%5B1%5D.AnswerText=No&Questions%5B25%5D.Index=25&Questions%5B25%5D.QuestionId=IQA0029&Questions%5B25%5D.Category=A&Questions%5B25%5D.SectionId=IQT0003&Questions%5B25%5D.Section=Project%2BScope&Questions%5B25%5D.Heading=13&Questions%5B25%5D.QuestionText=Will%2Bthis%2Bproject%2Binvolve%2Bactivities%2Bregulated%2Bby%2Bthe%2BHuman%2BFertilisation%2Band%2BEmbryology%2BAuthority%2B%28HFEA%29%3F&Questions%5B25%5D.QuestionType=Boolean&Questions%5B25%5D.DataType=Boolean&Questions%5B25%5D.IsMandatory=True&Questions%5B25%5D.IsOptional=False&Questions%5B25%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B25%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B25%5D.SelectedOption=OPT0004&Questions%5B25%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B25%5D.Answers%5B1%5D.AnswerText=No&Questions%5B26%5D.Index=26&Questions%5B26%5D.QuestionId=IQA0142&Questions%5B26%5D.Category=A&Questions%5B26%5D.SectionId=IQT0004&Questions%5B26%5D.Section=Research%2BLocation&Questions%5B26%5D.Heading=1&Questions%5B26%5D.QuestionText=Is%2Bthis%2Bproject%2Btaking%2Bplace%2Bin%2Bany%2Bcountries%2Bother%2Bthan%2Bthe%2BUK%3F&Questions%5B26%5D.QuestionType=Boolean&Questions%5B26%5D.DataType=Boolean&Questions%5B26%5D.IsMandatory=True&Questions%5B26%5D.IsOptional=False&Questions%5B26%5D.Answers%5B0%5D.AnswerId=OPT0016&Questions%5B26%5D.Answers%5B0%5D.AnswerText=UK%2Bonly&Questions%5B26%5D.SelectedOption=OPT0016&Questions%5B26%5D.Answers%5B1%5D.AnswerId=OPT0017&Questions%5B26%5D.Answers%5B1%5D.AnswerText=Multi-national&Questions%5B27%5D.Index=27&Questions%5B27%5D.QuestionId=IQA0143&Questions%5B27%5D.Category=A&Questions%5B27%5D.SectionId=IQT0004&Questions%5B27%5D.Section=Research%2BLocation&Questions%5B27%5D.Heading=1a&Questions%5B27%5D.QuestionText=List%2Bthe%2Bcountries%2Boutside%2Bthe%2BUK%2Bparticipating%2Bin%2Bthis%2Bproject.&Questions%5B27%5D.QuestionType=Look-up%2Blist&Questions%5B27%5D.DataType=Checkbox&Questions%5B27%5D.IsMandatory=False&Questions%5B27%5D.IsOptional=False&Questions%5B28%5D.Index=28&Questions%5B28%5D.QuestionId=IQA0032&Questions%5B28%5D.Category=A&Questions%5B28%5D.SectionId=IQT0004&Questions%5B28%5D.Section=Research%2BLocation&Questions%5B28%5D.Heading=2&Questions%5B28%5D.QuestionText=In%2Bwhich%2Bcountries%2Bof%2Bthe%2BUK%2Bwill%2Bthe%2Bproject%2Btake%2Bplace%3F%2BSelect%2Ball%2Bthat%2Bapply%3A&Questions%5B28%5D.QuestionType=Look-up%2Blist&Questions%5B28%5D.DataType=Checkbox&Questions%5B28%5D.IsMandatory=True&Questions%5B28%5D.IsOptional=False&Questions%5B28%5D.Answers%5B0%5D.AnswerId=OPT0018&Questions%5B28%5D.Answers%5B0%5D.AnswerText=England&Questions%5B28%5D.Answers%5B0%5D.IsSelected=true%2Cfalse&Questions%5B28%5D.Answers%5B1%5D.AnswerId=OPT0019&Questions%5B28%5D.Answers%5B1%5D.AnswerText=Northern%2BIreland&Questions%5B28%5D.Answers%5B2%5D.AnswerId=OPT0020&Questions%5B28%5D.Answers%5B2%5D.AnswerText=Scotland&Questions%5B28%5D.Answers%5B3%5D.AnswerId=OPT0021&Questions%5B28%5D.Answers%5B3%5D.AnswerText=Wales&Questions%5B29%5D.Index=29&Questions%5B29%5D.QuestionId=IQA0033&Questions%5B29%5D.Category=A&Questions%5B29%5D.SectionId=IQT0004&Questions%5B29%5D.Section=Research%2BLocation&Questions%5B29%5D.Heading=3a&Questions%5B29%5D.QuestionText=Where%2Bin%2Bthe%2BUK%2Bwill%2Bthe%2Bhuman%2Bbiologicial%2Bsamples%2Bor%2Bdata%2Bbe%2Bheld%3F%2BSelect%2Ball%2Bthat%2Bapply%3A&Questions%5B29%5D.QuestionType=Look-up%2Blist&Questions%5B29%5D.DataType=Checkbox&Questions%5B29%5D.IsMandatory=False&Questions%5B29%5D.IsOptional=False&Questions%5B29%5D.Answers%5B0%5D.AnswerId=OPT0018&Questions%5B29%5D.Answers%5B0%5D.AnswerText=England&Questions%5B29%5D.Answers%5B0%5D.IsSelected=true%2Cfalse&Questions%5B29%5D.Answers%5B1%5D.AnswerId=OPT0019&Questions%5B29%5D.Answers%5B1%5D.AnswerText=Northern%2BIreland&Questions%5B29%5D.Answers%5B2%5D.AnswerId=OPT0020&Questions%5B29%5D.Answers%5B2%5D.AnswerText=Scotland&Questions%5B29%5D.Answers%5B3%5D.AnswerId=OPT0021&Questions%5B29%5D.Answers%5B3%5D.AnswerText=Wales&Questions%5B30%5D.Index=30&Questions%5B30%5D.QuestionId=IQA0034&Questions%5B30%5D.Category=A&Questions%5B30%5D.SectionId=IQT0004&Questions%5B30%5D.Section=Research%2BLocation&Questions%5B30%5D.Heading=3b&Questions%5B30%5D.QuestionText=From%2Bwhere%2Bin%2Bthe%2BUK%2Bwill%2Bhuman%2Bbiologicial%2Bsamples%2Bor%2Bdata%2Bbe%2Bobtained%3F%2BSelect%2Ball%2Bthat%2Bapply%3A&Questions%5B30%5D.QuestionType=Look-up%2Blist&Questions%5B30%5D.DataType=Checkbox&Questions%5B30%5D.IsMandatory=False&Questions%5B30%5D.IsOptional=False&Questions%5B30%5D.Answers%5B0%5D.AnswerId=OPT0018&Questions%5B30%5D.Answers%5B0%5D.AnswerText=England&Questions%5B30%5D.Answers%5B0%5D.IsSelected=true%2Cfalse&Questions%5B30%5D.Answers%5B1%5D.AnswerId=OPT0019&Questions%5B30%5D.Answers%5B1%5D.AnswerText=Northern%2BIreland&Questions%5B30%5D.Answers%5B2%5D.AnswerId=OPT0020&Questions%5B30%5D.Answers%5B2%5D.AnswerText=Scotland&Questions%5B30%5D.Answers%5B3%5D.AnswerId=OPT0021&Questions%5B30%5D.Answers%5B3%5D.AnswerText=Wales&Questions%5B31%5D.Index=31&Questions%5B31%5D.QuestionId=IQA0144&Questions%5B31%5D.Category=A&Questions%5B31%5D.SectionId=IQT0004&Questions%5B31%5D.Section=Research%2BLocation&Questions%5B31%5D.Heading=4&Questions%5B31%5D.QuestionText=Where%2Bwill%2Bthe%2Bproject%2Bbe%2Btaking%2Bplace%3F%2BSelect%2Ball%2Bthat%2Bapply%3A&Questions%5B31%5D.QuestionType=Look-up%2Blist&Questions%5B31%5D.DataType=Checkbox&Questions%5B31%5D.IsMandatory=True&Questions%5B31%5D.IsOptional=False&Questions%5B31%5D.Answers%5B0%5D.AnswerId=OPT0022&Questions%5B31%5D.Answers%5B0%5D.AnswerText=Independent%2Bprimary%2Bcare%2Bcontractors&Questions%5B31%5D.Answers%5B0%5D.IsSelected=true%2Cfalse&Questions%5B31%5D.Answers%5B1%5D.AnswerId=OPT0023&Questions%5B31%5D.Answers%5B1%5D.AnswerText=Independent%2Bresearch%2Bunits&Questions%5B31%5D.Answers%5B2%5D.AnswerId=OPT0024&Questions%5B31%5D.Answers%5B2%5D.AnswerText=Local%2Bcouncils&Questions%5B31%5D.Answers%5B3%5D.AnswerId=OPT0025&Questions%5B31%5D.Answers%5B3%5D.AnswerText=NHS%2Bor%2BHSC%2Borganisations&Questions%5B31%5D.Answers%5B4%5D.AnswerId=OPT0026&Questions%5B31%5D.Answers%5B4%5D.AnswerText=Phase%2B1%2Btrial%2Bunits%2B%28non-NHS%2Bor%2BHSC%2Borganisation%29&Questions%5B31%5D.Answers%5B5%5D.AnswerId=OPT0027&Questions%5B31%5D.Answers%5B5%5D.AnswerText=Prison%2Bor%2Bprobation%2Bsetting&Questions%5B31%5D.Answers%5B6%5D.AnswerId=OPT0028&Questions%5B31%5D.Answers%5B6%5D.AnswerText=Schools%2Bor%2Bother%2Beducational%2Bestablishments&Questions%5B31%5D.Answers%5B7%5D.AnswerId=OPT0029&Questions%5B31%5D.Answers%5B7%5D.AnswerText=Social%2Bcare%2Bsettings&Questions%5B31%5D.Answers%5B8%5D.AnswerId=OPT0030&Questions%5B31%5D.Answers%5B8%5D.AnswerText=University&Questions%5B31%5D.Answers%5B9%5D.AnswerId=OPT0031&Questions%5B31%5D.Answers%5B9%5D.AnswerText=Voluntary%2Bsector%2Bor%2Bprivate%2Borganisations&Questions%5B31%5D.Answers%5B10%5D.AnswerId=OPT0032&Questions%5B31%5D.Answers%5B10%5D.AnswerText=Community%2Bsettings&Questions%5B31%5D.Answers%5B11%5D.AnswerId=OPT0033&Questions%5B31%5D.Answers%5B11%5D.AnswerText=Other&Questions%5B32%5D.Index=32&Questions%5B32%5D.QuestionId=IQA0145&Questions%5B32%5D.Category=A&Questions%5B32%5D.SectionId=IQT0004&Questions%5B32%5D.Section=Research%2BLocation&Questions%5B32%5D.Heading=4a&Questions%5B32%5D.QuestionText=Give%2Bdetails%2Bof%2Bother%2Borganisations%2Bresponsible%2Bfor%2Bconducting%2Bthe%2Bproject.&Questions%5B32%5D.QuestionType=Look-up%2Blist&Questions%5B32%5D.DataType=Text&Questions%5B32%5D.IsMandatory=False&Questions%5B32%5D.IsOptional=False&Questions%5B32%5D.AnswerText=&Questions%5B33%5D.Index=33&Questions%5B33%5D.QuestionId=IQA0146&Questions%5B33%5D.Category=A&Questions%5B33%5D.SectionId=IQT0004&Questions%5B33%5D.Section=Research%2BLocation&Questions%5B33%5D.Heading=5&Questions%5B33%5D.QuestionText=Will%2Byou%2Ballow%2Byour%2Bresearch%2Bsites%2Bto%2Buse%2BParticipant%2BIdentification%2BCentres%2B%28PICs%29%3F&Questions%5B33%5D.QuestionType=Boolean&Questions%5B33%5D.DataType=Boolean&Questions%5B33%5D.IsMandatory=False&Questions%5B33%5D.IsOptional=False&Questions%5B33%5D.Answers%5B0%5D.AnswerId=OPT0004&Questions%5B33%5D.Answers%5B0%5D.AnswerText=Yes&Questions%5B33%5D.Answers%5B1%5D.AnswerId=OPT0005&Questions%5B33%5D.Answers%5B1%5D.AnswerText=No&Questions%5B33%5D.Answers%5B2%5D.AnswerId=OPT0034&Questions%5B33%5D.Answers%5B2%5D.AnswerText=Not%2Bapplicable&__RequestVerificationToken=CfDJ8Mnwxy4aCkFFgvXPro-ADVZHWYU5PF3nfegaNVMbMNBuTIKOUzjiFGjRq71TfpyXb4CD3oZen6oO6eAsRwRmq7F3drFxkQh1PZc6ad0o1moW6RdqtiDwBMCpE5WTMqCuCW6fr4r6w73-C4kGGFJU_aW7APV1UxTqczYlGNaSKZNxpLiXx9mDAHM6pHQn7Jx47g&Questions%5B10%5D.Answers%5B1%5D.IsSelected=false&Questions%5B10%5D.Answers%5B2%5D.IsSelected=false&Questions%5B10%5D.Answers%5B3%5D.IsSelected=false&Questions%5B10%5D.Answers%5B4%5D.IsSelected=false&Questions%5B10%5D.Answers%5B5%5D.IsSelected=false&Questions%5B10%5D.Answers%5B6%5D.IsSelected=false&Questions%5B10%5D.Answers%5B7%5D.IsSelected=false&Questions%5B28%5D.Answers%5B1%5D.IsSelected=false&Questions%5B28%5D.Answers%5B2%5D.IsSelected=false&Questions%5B28%5D.Answers%5B3%5D.IsSelected=false&Questions%5B29%5D.Answers%5B1%5D.IsSelected=false&Questions%5B29%5D.Answers%5B2%5D.IsSelected=false&Questions%5B29%5D.Answers%5B3%5D.IsSelected=false&Questions%5B30%5D.Answers%5B1%5D.IsSelected=false&Questions%5B30%5D.Answers%5B2%5D.IsSelected=false&Questions%5B30%5D.Answers%5B3%5D.IsSelected=false&Questions%5B31%5D.Answers%5B1%5D.IsSelected=false&Questions%5B31%5D.Answers%5B2%5D.IsSelected=false&Questions%5B31%5D.Answers%5B3%5D.IsSelected=false&Questions%5B31%5D.Answers%5B4%5D.IsSelected=false&Questions%5B31%5D.Answers%5B5%5D.IsSelected=false&Questions%5B31%5D.Answers%5B6%5D.IsSelected=false&Questions%5B31%5D.Answers%5B7%5D.IsSelected=false&Questions%5B31%5D.Answers%5B8%5D.IsSelected=false&Questions%5B31%5D.Answers%5B9%5D.IsSelected=false&Questions%5B31%5D.Answers%5B10%5D.IsSelected=false&Questions%5B31%5D.Answers%5B11%5D.IsSelected=false",
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "irasportal-automationtest.azurewebsites.net",
          Origin: "https://irasportal-automationtest.azurewebsites.net",
          Cookie: cookies,
        },
      }
    );
    TrendPostProjFilterReqDuration.add(response.timings.duration);
    const isPostProjFilterQsetReqSuccessful = check(response, {
      "Submit Project Filter Qset Request Success": () =>
        response.status === 200,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isPostProjFilterQsetReqSuccessful) {
      console.error(
        `Post Project Filter Qset Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(0.5, 1);

    response = http.get(
      `${baseURL}questionnaire/resume?applicationId=${applicationId}&categoryId=B`,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          Host: "irasportal-automationtest.azurewebsites.net",
          Cookie: cookies,
        },
      }
    );
    TrendResumeProjFilterReqDuration.add(response.timings.duration);
    const isGetResumeProjFilterQsetReqSuccessful = check(response, {
      "Resume After Project Filter Qset Request Success": () =>
        response.status === 200,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetResumeProjFilterQsetReqSuccessful) {
      console.error(
        `Get Resume After Project Filter Qset Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(0.5, 1);

    response = http.get(
      `${baseURL}questionnaire/displayquestionnaire?categoryId=B`,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          Host: "irasportal-automationtest.azurewebsites.net",
          Cookie: cookies,
        },
      }
    );
    TrendGetProjDetailsReqDuration.add(response.timings.duration);
    const isGetProjDetailsQsetReqSuccessful = check(response, {
      "Project Details Qset Request Success": () => response.status === 200,
      "Project Details Qset Loaded Correctly": (res) =>
        res.body.indexOf("Project Information") !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.url
    );
    if (!isGetProjDetailsQsetReqSuccessful) {
      console.error(
        `Get Project Details Qset Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/initialQsetScriptReport.json": JSON.stringify(data),
  };
}
