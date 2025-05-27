import { sleep, group, fail, check } from "k6";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { decryptData } from "../utils/decryptData.js";
import { textSummary, ra } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

//Script Data and Variables
const baseURL = "https://irasportal-automationtest.azurewebsites.net/";

const loginDetails = new SharedArray("loginData", function () {
  return JSON.parse(open("../resources/data/testData.json")).loginDetails;
});
const usernameInput = loginDetails[0].usernameInput;
const username = loginDetails[0].username;

const scriptData = new SharedArray("scriptData", function () {
  return JSON.parse(
    open("../resources/data/testData.json")
  ).basicJourneysScript;
});
const baseGetHeaders = scriptData[0][2].baseGetHeaders;
const basePostHeaders = scriptData[0][2].basePostHeaders;
const revBodyPostBodies = scriptData[0][0].revBodyPostBodies;
const userPostBodies = scriptData[0][0].userPostBodies;
const orgNameBase = scriptData[0][1].organisationName;
const id = scriptData[0][1].id;
const createdBy = scriptData[0][1].createdBy;
const updatedBy = scriptData[0][1].updatedBy;
const isActive = scriptData[0][1].isActive;
const revBodyProfileIds = scriptData[0][1].revBodyProfileIds;
const editCreatedBy = scriptData[0][1].editCreatedBy;
const editUpdatedBy = scriptData[0][1].editUpdatedBy;
const emailPrefix = scriptData[0][1].emailPrefix;
const emailSuffix = scriptData[0][1].emailSuffix;
const userProfileIds = scriptData[0][1].userProfileIds;
const orgSearchParam = scriptData[0][1].orgSearchParam;

const homePageCheck = scriptData[2].homePageCheck;
const sysAdminCheck = scriptData[2].sysAdminCheck;
const revBodyListCheck = scriptData[2].revBodyListCheck;
const addRevBodyCheck = scriptData[2].addRevBodyCheck;
const confirmRevBodyChangeCheck = scriptData[2].confirmRevBodyChangeCheck;
const submitRevBodyCheck = scriptData[2].submitRevBodyCheck;
const revBodyProfileCheck = scriptData[2].revBodyProfileCheck;
const revBodyEditCheck = scriptData[2].revBodyEditCheck;
const revBodyStatusChangeCheck = scriptData[2].revBodyStatusChangeCheck;
const revBodyConfirmStatusChangeCheck =
  scriptData[2].revBodyConfirmStatusChangeCheck;
const revBodyAuditCheck = scriptData[2].revBodyAuditCheck;
const revBodyUserListCheck = scriptData[2].revBodyUserListCheck;
const revBodyAddUserCheck = scriptData[2].revBodyAddUserCheck;
const manageUserListCheck = scriptData[2].manageUserListCheck;
const addUserPageCheck = scriptData[2].addUserPageCheck;
const confirmAddUserCheck = scriptData[2].confirmAddUserCheck;
const submitAddUserCheck = scriptData[2].submitAddUserCheck;
const userProfileCheck = scriptData[2].userProfileCheck;
const userEditCheck = scriptData[2].userEditCheck;
const userStatusChangeCheck = scriptData[2].userStatusChangeCheck;
const submitUserStatusChangeCheck = scriptData[2].submitUserStatusChangeCheck;
const userAuditCheck = scriptData[2].userAuditCheck;
const myResearchPageCheck = scriptData[2].myResearchPageCheck;
const createProjectRecordPageCheck = scriptData[2].createProjectRecordPageCheck;
const startProjectIrasPageCheck = scriptData[2].startProjectIrasPageCheck;
const displayProjDetailsPageCheck = scriptData[2].displayProjDetailsPageCheck;
const displayKeyRolesPageCheck = scriptData[2].displayKeyRolesPageCheck;
const displayResearchLocationsPageCheck =
  scriptData[2].displayResearchLocationsPageCheck;
const displaySubmitApplicationPageCheck =
  scriptData[2].displaySubmitApplicationPageCheck;
const projectOverviewPageCheck = scriptData[2].projectOverviewPageCheck;

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
    http_req_duration: ["p(98)<1000", "p(100)<3000"],
    non_transactional_response_times: ["p(98)<1000"],
    transactional_response_times: ["p(98)<3000"],
  },
  scenarios: {
    BasicJourneysScript: {
      executor: "ramping-vus",
      gracefulStop: "30s",
      stages: [
        { target: 10, duration: "1m" },
        { target: 10, duration: "8m" },
        { target: 0, duration: "1m" },
      ],
      gracefulRampDown: "30s",
      exec: "basicJourneysScript",
    },
  },
};

//Custom Metrics
export const TrendNonTransactionalReqDuration = new Trend(
  "non_transactional_response_times",
  true
);
export const TrendTransactionalReqDuration = new Trend(
  "transactional_response_times",
  true
);
export const TrendHomePageReqDuration = new Trend(
  "load_iras_home_page_response_time",
  true
);
export const TrendSysAdminReqDuration = new Trend(
  "load_sys_admin_page_response_time",
  true
);
export const TrendRevBodyListReqDuration = new Trend(
  "load_rev_body_list_page_response_time",
  true
);
export const TrendAddRevBodyReqDuration = new Trend(
  "load_add_rev_body_page_response_time",
  true
);
export const TrendConfirmRevBodyChangesReqDuration = new Trend(
  "load_confirm_rev_body_change_page_response_time",
  true
);
export const TrendSubmitRevBodyReqDuration = new Trend(
  "load_submit_rev_body_page_response_time",
  true
);
export const TrendRevBodyListSearchReqDuration = new Trend(
  "load_rev_body_list_search_page_response_time",
  true
);
export const TrendRevBodyProfileReqDuration = new Trend(
  "load_rev_body_profile_page_response_time",
  true
);
export const TrendRevBodyEditReqDuration = new Trend(
  "load_rev_body_edit_page_response_time",
  true
);
export const TrendSubmitRevBodyEditReqDuration = new Trend(
  "load_submit_rev_body_edit_page_response_time",
  true
);
export const TrendRevBodyStatusChangeReqDuration = new Trend(
  "submit_rev_body_status_change_page_response_time",
  true
);
export const TrendRevBodyConfirmStatusChangeReqDuration = new Trend(
  "confirm_rev_body_status_change_page_response_time",
  true
);
export const TrendRevBodyAuditReqDuration = new Trend(
  "load_rev_body_audit_page_response_time",
  true
);
export const TrendRevBodyUserListReqDuration = new Trend(
  "load_rev_body_user_list_page_response_time",
  true
);
export const TrendRevBodyUserListSearchReqDuration = new Trend(
  "load_rev_body_user_list_search_page_response_time",
  true
);
export const TrendRevBodyAddUserReqDuration = new Trend(
  "load_rev_body_add_user_page_response_time",
  true
);
export const TrendRevBodyAddUserSearchReqDuration = new Trend(
  "load_rev_body_add_user_search_page_response_time",
  true
);
export const TrendManageUsersListReqDuration = new Trend(
  "load_manage_users_list_page_response_time",
  true
);
export const TrendAddUserReqDuration = new Trend(
  "load_add_user_page_response_time",
  true
);
export const TrendConfirmAddUserReqDuration = new Trend(
  "load_confirm_add_user_page_response_time",
  true
);
export const TrendSubmitAddUserReqDuration = new Trend(
  "load_submit_add_user_page_response_time",
  true
);
export const TrendManageUsersSearchReqDuration = new Trend(
  "load_manage_users_list_search_response_time",
  true
);
export const TrendUserProfileReqDuration = new Trend(
  "load_user_profile_page_response_time",
  true
);
export const TrendUserEditReqDuration = new Trend(
  "load_user_edit_page_response_time",
  true
);
export const TrendSubmitEditUserReqDuration = new Trend(
  "load_submit_edit_user_page_response_time",
  true
);
export const TrendUserStatusChangeReqDuration = new Trend(
  "load_user_status_change_page_response_time",
  true
);
export const TrendSubmitUserStatusChangeReqDuration = new Trend(
  "load_submit_user_status_change_page_response_time",
  true
);
export const TrendUserAuditReqDuration = new Trend(
  "load_user_audit_page_response_time",
  true
);
export const TrendMyResearchPageReqDuration = new Trend(
  "load_my_research_page_response_time",
  true
);
export const TrendCreateProjectRecordPageReqDuration = new Trend(
  "load_create_project_record_page_response_time",
  true
);
export const TrendStartProjectIrasPageReqDuration = new Trend(
  "load_start_project_iras_page_response_time",
  true
);
export const TrendSaveStartProjectIrasPageReqDuration = new Trend(
  "save_start_project_iras_page_response_time",
  true
);
export const TrendSaveProjectDetailsPageReqDuration = new Trend(
  "save_project_details_page_response_time",
  true
);
export const TrendSearchRtsOrgsReqDuration = new Trend(
  "search_rts_organisations_response_time",
  true
);
export const TrendSaveKeyRolesPageReqDuration = new Trend(
  "save_key_roles_page_response_time",
  true
);
export const TrendSaveResearchLocationsPageReqDuration = new Trend(
  "save_research_locations_page_response_time",
  true
);
export const TrendSaveConfirmProjectReqDuration = new Trend(
  "save_confirm_project_page_response_time",
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
      usernameUserInput: `${usernameInput}`,
      username: `${username}`,
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

export function basicJourneysScript(data) {
  let response;
  let requestVerificationToken;
  let timestamp;
  let orgName;
  let emailAdd;
  const cookies = data[0];
  const getHeadersWithCookies = Object.assign({}, baseGetHeaders.headers, {
    Cookie: `${cookies}`,
  });
  const postHeadersWithCookies = Object.assign({}, basePostHeaders.headers, {
    Cookie: `${cookies}`,
  });
  const getHeaders = { headers: getHeadersWithCookies };
  const postHeaders = { headers: postHeadersWithCookies };

  function userThinkTime(min, max) {
    return sleep(Math.random() * (max - min) + min);
  }

  function generateIrasId(min, max) {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil);
  }

  group("Manage Review Body Journey", function () {
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Home Page Request Success": () => response.status === 200,
      "Home Page Loaded Correctly": (res) =>
        res.body.indexOf(`${homePageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}systemadmin`, getHeaders);
    TrendSysAdminReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetSysAdminPageReqSuccessful = check(response, {
      "System Admin Page Request Success": () => response.status === 200,
      "System Admin Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sysAdminCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSysAdminPageReqSuccessful) {
      console.error(
        `Get System Admin Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}reviewbody/view`, getHeaders);
    TrendRevBodyListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetRevBodyListPageReqSuccessful = check(response, {
      "Review Body List Page Request Success": () => response.status === 200,
      "Review Body List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyListPageReqSuccessful) {
      console.error(
        `Get Review Body List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}reviewbody/create`, getHeaders);
    TrendAddRevBodyReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetAddRevBodyPageReqSuccessful = check(response, {
      "Add Review Body Page Request Success": () => response.status === 200,
      "Add Review Body Page Loaded Correctly": (res) =>
        res.body.indexOf(`${addRevBodyCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetAddRevBodyPageReqSuccessful) {
      console.error(
        `Get Add Review Body Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    timestamp = Date.now();
    orgName = `${orgNameBase}${timestamp}`;
    const selectedPostBody = randomItem(revBodyPostBodies).postBody;

    const confirmPostBody = Object.assign({}, selectedPostBody, {
      Id: `${id}`,
      CreatedBy: `${createdBy}`,
      UpdatedBy: `${updatedBy}`,
      IsActive: `${isActive}`,
      OrganisationName: `${orgName}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(
      `${baseURL}reviewbody/confirm-changes`,
      confirmPostBody,
      postHeaders
    );
    TrendConfirmRevBodyChangesReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostConfirmRevBodyChangesPageReqSuccessful = check(response, {
      "Confirm Review Body Changes Page Request Success": () =>
        response.status === 200,
      "Confirm Review Body Changes Page Loaded Correctly": (res) =>
        res.body.indexOf(`${confirmRevBodyChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmRevBodyChangesPageReqSuccessful) {
      console.error(
        `Post Confirm Review Body Changes Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const submitPostBody = Object.assign({}, selectedPostBody, {
      OrganisationName: `${orgName}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(
      `${baseURL}reviewbody/submit`,
      submitPostBody,
      postHeaders
    );
    TrendSubmitRevBodyReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostSubmitRevBodyPageReqSuccessful = check(response, {
      "Submit Review Body Page Request Success": () => response.status === 200,
      "Submit Review Body Page Loaded Correctly": (res) =>
        res.body.indexOf(`${submitRevBodyCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitRevBodyPageReqSuccessful) {
      console.error(
        `Post Submit Review Body Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}reviewbody/view`, getHeaders);
    TrendRevBodyListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetRevBodyListPageReqSuccessful = check(response, {
      "Review Body List Page Request Success": () => response.status === 200,
      "Review Body List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyListPageReqSuccessful) {
      console.error(
        `Get Review Body List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/view?SearchQuery=k6&PageSize=20`,
      getHeaders
    );
    TrendRevBodyListSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    let isGetRevBodyListSearchPageReqSuccessful = check(response, {
      "Review Body List Search Request Success": () => response.status === 200,
      "Review Body List Search Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyListSearchPageReqSuccessful) {
      console.error(
        `Get Review Body List Search Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const selectedRevBodyProfile = randomItem(revBodyProfileIds);
    response = http.get(
      `${baseURL}reviewbody/view/${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyProfileReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetRevBodyProfilePageReqSuccessful = check(response, {
      "Review Body Profile Page Request Success": () => response.status === 200,
      "Review Body Profile Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyProfilePageReqSuccessful) {
      console.error(
        `Get Review Body Profile Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/update?id=${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyEditReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyEditPageReqSuccessful = check(response, {
      "Review Body Edit Page Request Success": () => response.status === 200,
      "Review Body Edit Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyEditCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyEditPageReqSuccessful) {
      console.error(
        `Get Review Body Edit Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    timestamp = Date.now();
    orgName = `${orgNameBase}${timestamp}`;

    const submitEditPostBody = Object.assign({}, selectedPostBody, {
      Id: `${selectedRevBodyProfile}`,
      CreatedBy: `${editCreatedBy}`,
      UpdatedBy: `${editUpdatedBy}`,
      IsActive: `${isActive}`,
      OrganisationName: `${orgName}`,
      EmailAddress: `${emailPrefix}${timestamp}${emailSuffix}`,
      Description: `${selectedPostBody.Description} ${timestamp}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersWithRefer = Object.assign({}, postHeaders.headers, {
      Referer: `${baseURL}reviewbody/update?id=${selectedRevBodyProfile}`,
    });
    const postHeadersEdit = { headers: postHeadersWithRefer, redirects: 1 };

    response = http.post(
      `${baseURL}reviewbody/submit`,
      submitEditPostBody,
      postHeadersEdit
    );
    const redirectDuration = response.timings.duration;
    const isPostSubmitRevBodyEditReqSuccessful = check(response, {
      "Submit Review Body Edit Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitRevBodyEditReqSuccessful) {
      console.error(
        `Post Submit Review Body Edit Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const redirectUrl = response.url;

    response = http.get(`${redirectUrl}`, getHeaders);
    TrendSubmitRevBodyEditReqDuration.add(
      response.timings.duration + redirectDuration
    ); //combining duration of intial request and redirect request
    TrendTransactionalReqDuration.add(
      response.timings.duration + redirectDuration
    );
    const isGetSubmitRevBodyEditRedirectPageReqSuccessful = check(response, {
      "Submit Review Body Edit Redirect Page Request Success": () =>
        response.status === 200,
      "Submit Review Body Edit Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSubmitRevBodyEditRedirectPageReqSuccessful) {
      console.error(
        `Get Submit Review Body Edit Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const statusReqParam = response
      .html()
      .find("button[type=submit]")
      .first()
      .attr("formaction")
      .replace("/", "");

    const revBodyStatusPostBody =
      scriptData[0][0].revBodyStatusPostBody[0].postBody;
    const submitRevBodyStatusPostBody = Object.assign(
      {},
      revBodyStatusPostBody,
      {
        Id: `${selectedRevBodyProfile}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    response = http.post(
      `${baseURL}${statusReqParam}`,
      submitRevBodyStatusPostBody,
      postHeaders
    );
    TrendRevBodyStatusChangeReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    let isPostRevBodyStatusChangePageReqSuccessful = check(response, {
      "Review Body Status Change Page Request Success": () =>
        response.status === 200,
      "Review Body Status Change Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyStatusChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostRevBodyStatusChangePageReqSuccessful) {
      console.error(
        `Post Review Body Status Change Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const confirmStatusReqParam = response
      .html()
      .find("button[type=submit]")
      .first()
      .attr("formaction")
      .replace("/", "");
    const newIsActive = response
      .html()
      .find("input[type=hidden][id=IsActive]")
      .first()
      .attr("value");

    const revBodyConfirmStatusPostBody =
      scriptData[0][0].revBodyConfirmStatusPostBody[0].postBody;
    const confirmRevBodyStatusPostBody = Object.assign(
      {},
      revBodyConfirmStatusPostBody,
      {
        Id: `${selectedRevBodyProfile}`,
        IsActive: `${newIsActive}`,
        OrganisationName: `${orgName}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    response = http.post(
      `${baseURL}${confirmStatusReqParam}`,
      confirmRevBodyStatusPostBody,
      postHeaders
    );
    TrendRevBodyConfirmStatusChangeReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    let isPostConfirmRevBodyStatusChangePageReqSuccessful = check(response, {
      "Review Body Confirm Status Change Page Request Success": () =>
        response.status === 200,
      "Review Body Confirm Status Change Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyConfirmStatusChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmRevBodyStatusChangePageReqSuccessful) {
      console.error(
        `Post Review Body Confirm Status Change Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}reviewbody/view`, getHeaders);
    TrendRevBodyListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetRevBodyListPageReqSuccessful = check(response, {
      "Review Body List Page Request Success": () => response.status === 200,
      "Review Body List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyListPageReqSuccessful) {
      console.error(
        `Get Review Body List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/view?SearchQuery=k6&PageSize=20`,
      getHeaders
    );
    TrendRevBodyListSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    isGetRevBodyListSearchPageReqSuccessful = check(response, {
      "Review Body List Search Request Success": () => response.status === 200,
      "Review Body List Search Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyListSearchPageReqSuccessful) {
      console.error(
        `Get Review Body List Search Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/view/${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyProfileReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetRevBodyProfilePageReqSuccessful = check(response, {
      "Review Body Profile Page Request Success": () => response.status === 200,
      "Review Body Profile Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyProfilePageReqSuccessful) {
      console.error(
        `Get Review Body Profile Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/audit-trail?reviewBodyId=${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyAuditReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyAuditPageReqSuccessful = check(response, {
      "Review Body Audit Page Request Success": () => response.status === 200,
      "Review Body Audit Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyAuditCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyAuditPageReqSuccessful) {
      console.error(
        `Get Review Body Audit Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/view/${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyProfileReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetRevBodyProfilePageReqSuccessful = check(response, {
      "Review Body Profile Page Request Success": () => response.status === 200,
      "Review Body Profile Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyProfilePageReqSuccessful) {
      console.error(
        `Get Review Body Profile Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/viewreviewbodyusers?ReviewBodyId=37d402d6-2081-4a6f-868d-06649cb68aab`, //add selected param here when add flow complete
      getHeaders
    );
    TrendRevBodyUserListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyUserListPageReqSuccessful = check(response, {
      "Review Body User List Page Request Success": () =>
        response.status === 200,
      "Review Body User List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyUserListPageReqSuccessful) {
      console.error(
        `Get Review Body User List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/viewreviewbodyusers?SearchQuery=qa+auto&ReviewBodyId=37d402d6-2081-4a6f-868d-06649cb68aab&PageSize=20`, //add selected param here when add flow complete
      getHeaders
    );
    TrendRevBodyUserListSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyUserListSearchPageReqSuccessful = check(response, {
      "Review Body User List Search Page Request Success": () =>
        response.status === 200,
      "Review Body User List Search Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyUserListSearchPageReqSuccessful) {
      console.error(
        `Get Review Body User List Search Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/viewadduser?reviewBodyId=${selectedRevBodyProfile}`,
      getHeaders
    );
    TrendRevBodyAddUserReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyAddUserPageReqSuccessful = check(response, {
      "Review Body Add User Page Request Success": () =>
        response.status === 200,
      "Review Body Add User Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyAddUserCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyAddUserPageReqSuccessful) {
      console.error(
        `Get Review Body Add User Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}reviewbody/viewadduser?SearchQuery=k6&ReviewBodyId=${selectedRevBodyProfile}&PageSize=20`,
      getHeaders
    );
    TrendRevBodyAddUserSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isGetRevBodyAddUserSearchPageReqSuccessful = check(response, {
      "Review Body Add User Search Page Request Success": () =>
        response.status === 200,
      "Review Body Add User Search Page Loaded Correctly": (res) =>
        res.body.indexOf(`${revBodyAddUserCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRevBodyAddUserSearchPageReqSuccessful) {
      console.error(
        `Get Review Body Add User Search Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });

  group("Manage User Journey", function () {
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Home Page Request Success": () => response.status === 200,
      "Home Page Loaded Correctly": (res) =>
        res.body.indexOf(`${homePageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}systemadmin`, getHeaders);
    TrendSysAdminReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetSysAdminPageReqSuccessful = check(response, {
      "System Admin Page Request Success": () => response.status === 200,
      "System Admin Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sysAdminCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSysAdminPageReqSuccessful) {
      console.error(
        `Get System Admin Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}admin/users`, getHeaders);
    TrendManageUsersListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetManagUsersListPageReqSuccessful = check(response, {
      "Manage Users List Page Request Success": () => response.status === 200,
      "Manage Users List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${manageUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetManagUsersListPageReqSuccessful) {
      console.error(
        `Get Manage Users List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}admin/users/createuser`, getHeaders);
    TrendAddUserReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetAddUsersPageReqSuccessful = check(response, {
      "Add User Page Request Success": () => response.status === 200,
      "Add User Page Loaded Correctly": (res) =>
        res.body.indexOf(`${addUserPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetAddUsersPageReqSuccessful) {
      console.error(
        `Get Add User Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    timestamp = Date.now();
    emailAdd = `${emailPrefix}${timestamp}${emailSuffix}`;
    const selectedUserPostBody = randomItem(userPostBodies).postBody;

    const confirmUserPostBody = Object.assign({}, selectedUserPostBody, {
      Id: "",
      OriginalEmail: "",
      Email: `${emailAdd}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(
      `${baseURL}admin/users/confirmusersubmission`,
      confirmUserPostBody,
      postHeaders
    );
    TrendConfirmAddUserReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostConfirmAddUserPageReqSuccessful = check(response, {
      "Confirm Add User Page Request Success": () => response.status === 200,
      "Confirm Add User Page Loaded Correctly": (res) =>
        res.body.indexOf(`${confirmAddUserCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmAddUserPageReqSuccessful) {
      console.error(
        `Post Confirm Add User Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const submitUserPostBody = Object.assign({}, selectedUserPostBody, {
      Status: "Active",
      Email: `${emailAdd}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(
      `${baseURL}admin/users/submituser`,
      submitUserPostBody,
      postHeaders
    );
    TrendSubmitAddUserReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostSubmitAddUserPageReqSuccessful = check(response, {
      "Submit Add User Page Request Success": () => response.status === 200,
      "Submit Add User Page Loaded Correctly": (res) =>
        res.body.indexOf(`${submitAddUserCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitAddUserPageReqSuccessful) {
      console.error(
        `Post Submit Add User Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    userThinkTime(2, 4);

    response = http.get(`${baseURL}admin/users`, getHeaders);
    TrendManageUsersListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetManagUsersListPageReqSuccessful = check(response, {
      "Manage Users List Page Request Success": () => response.status === 200,
      "Manage Users List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${manageUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetManagUsersListPageReqSuccessful) {
      console.error(
        `Get Manage Users List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}admin/users?SearchQuery=k6&PageSize=20`,
      getHeaders
    );
    TrendManageUsersSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    let isGetManageUsersSearchReqSuccessful = check(response, {
      "Manage Users List Search Request Success": () => response.status === 200,
      "Manage Users List Search Loaded Correctly": (res) =>
        res.body.indexOf(`${manageUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetManageUsersSearchReqSuccessful) {
      console.error(
        `Get Manage Users List Search Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const selectedUserProfile = randomItem(userProfileIds);
    response = http.get(
      `${baseURL}admin/users/viewuser?userId=${selectedUserProfile}`,
      getHeaders
    );
    TrendUserProfileReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetUserProfilePageReqSuccessful = check(response, {
      "User Profile Page Request Success": () => response.status === 200,
      "User Profile Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetUserProfilePageReqSuccessful) {
      console.error(
        `Get User Profile Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}admin/users/edituser?userId=${selectedUserProfile}`,
      getHeaders
    );
    TrendUserEditReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetUserEditPageReqSuccessful = check(response, {
      "User Edit Page Request Success": () => response.status === 200,
      "User Edit Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userEditCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetUserEditPageReqSuccessful) {
      console.error(
        `Get User Edit Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const originalEmail = response
      .html()
      .find("input[type=hidden][id=OriginalEmail]")
      .first()
      .attr("value");
    const status = response
      .html()
      .find("input[type=text][id=Status]")
      .first()
      .attr("value");
    timestamp = Date.now();

    const submitEditUserPostBody = Object.assign({}, selectedUserPostBody, {
      Id: `${selectedUserProfile}`,
      OriginalEmail: `${originalEmail}`,
      Status: `${status}`,
      FirstName: `${selectedUserPostBody.FirstName} ${timestamp}`,
      LastName: `${selectedUserPostBody.LastName} ${timestamp}`,
      Email: `${emailPrefix}${timestamp}${emailSuffix}`,
      Organisation: `${selectedUserPostBody.Organisation} ${timestamp}`,
      JobTitle: `${selectedUserPostBody.JobTitle} ${timestamp}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersUserWithRefer = Object.assign({}, postHeaders.headers, {
      Referer: `${baseURL}admin/users/edituser?userId=${selectedUserProfile}`,
    });
    const postHeadersUserEdit = {
      headers: postHeadersUserWithRefer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}admin/users/submituser`,
      submitEditUserPostBody,
      postHeadersUserEdit
    );
    const redirectUserEditDuration = response.timings.duration;
    const isPostSubmitEditUserPageReqSuccessful = check(response, {
      "Submit Edit User Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitEditUserPageReqSuccessful) {
      console.error(
        `Post Submit Edit User Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const redirectEditUserUrl = response.url;

    response = http.get(`${redirectEditUserUrl}`, getHeaders);
    TrendSubmitEditUserReqDuration.add(
      response.timings.duration + redirectUserEditDuration
    ); //combining duration of intial request and redirect request
    TrendTransactionalReqDuration.add(
      response.timings.duration + redirectUserEditDuration
    );
    const isPostSubmitEditUserRedirectPageReqSuccessful = check(response, {
      "Submit Edit User Redirect Page Request Success": () =>
        response.status === 200,
      "Submit Edit User Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitEditUserRedirectPageReqSuccessful) {
      console.error(
        `Get Submit Edit User Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const currentUserStatus = response
      .html()
      .find("input[type=hidden][id=Status]")
      .first()
      .attr("value");
    let statusReqParam;
    if (currentUserStatus == "Active") {
      statusReqParam = "disableuser";
    } else {
      statusReqParam = "enableuser";
    }

    response = http.get(
      `${baseURL}admin/users/${statusReqParam}?userId=${selectedUserProfile}`,
      getHeaders
    );
    TrendUserStatusChangeReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetUserStatusChangePageReqSuccessful = check(response, {
      "User Status Change Page Request Success": () => response.status === 200,
      "User Status Change Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userStatusChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetUserStatusChangePageReqSuccessful) {
      console.error(
        `Get User Status Change Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const userStatusPostBody = scriptData[0][0].userStatusPostBody[0].postBody;
    const submitUserStatusPostBody = Object.assign({}, userStatusPostBody, {
      Id: `${selectedUserProfile}`,
      Email: `${submitEditUserPostBody.Email}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    response = http.post(
      `${baseURL}admin/users/${statusReqParam}`,
      submitUserStatusPostBody,
      postHeaders
    );
    TrendSubmitUserStatusChangeReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostSubmitUserStatusChangePageReqSuccessful = check(response, {
      "Submit User Status Change Page Request Success": () =>
        response.status === 200,
      "Submit User Status Change Page Loaded Correctly": (res) =>
        res.body.indexOf(`${submitUserStatusChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitUserStatusChangePageReqSuccessful) {
      console.error(
        `Post Submit User Status Change Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    userThinkTime(2, 4);

    response = http.get(`${baseURL}admin/users`, getHeaders);
    TrendManageUsersListReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetManagUsersListPageReqSuccessful = check(response, {
      "Manage Users List Page Request Success": () => response.status === 200,
      "Manage Users List Page Loaded Correctly": (res) =>
        res.body.indexOf(`${manageUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetManagUsersListPageReqSuccessful) {
      console.error(
        `Get Manage Users List Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}admin/users?SearchQuery=k6&PageSize=20`,
      getHeaders
    );
    TrendManageUsersSearchReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    isGetManageUsersSearchReqSuccessful = check(response, {
      "Manage Users List Search Request Success": () => response.status === 200,
      "Manage Users List Search Loaded Correctly": (res) =>
        res.body.indexOf(`${manageUserListCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetManageUsersSearchReqSuccessful) {
      console.error(
        `Get Manage Users List Search Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}admin/users/viewuser?userId=${selectedUserProfile}`,
      getHeaders
    );
    TrendUserProfileReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetUserProfilePageReqSuccessful = check(response, {
      "User Profile Page Request Success": () => response.status === 200,
      "User Profile Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userProfileCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetUserProfilePageReqSuccessful) {
      console.error(
        `Get User Profile Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}admin/users/useraudittrail?userId=${selectedUserProfile}`,
      getHeaders
    );
    TrendUserAuditReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetUserAuditPageReqSuccessful = check(response, {
      "User Audit Page Request Success": () => response.status === 200,
      "User Audit Page Loaded Correctly": (res) =>
        res.body.indexOf(`${userAuditCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetUserAuditPageReqSuccessful) {
      console.error(
        `Get User Audit Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });

  group("Create Project Journey", function () {
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Home Page Request Success": () => response.status === 200,
      "Home Page Loaded Correctly": (res) =>
        res.body.indexOf(`${homePageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetHomePageReqSuccessful) {
      console.error(
        `Get Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}application/welcome`, getHeaders);
    TrendMyResearchPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetMyResearchPageReqSuccessful = check(response, {
      "My Research Page Request Success": () => response.status === 200,
      "My Research Page Loaded Correctly": (res) =>
        res.body.indexOf(`${myResearchPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetMyResearchPageReqSuccessful) {
      console.error(
        `Get My Research Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}application/createapplication`, getHeaders);
    TrendCreateProjectRecordPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetCreateProjectRecordPageReqSuccessful = check(response, {
      "Create Project Record Page Request Success": () =>
        response.status === 200,
      "Create Project Record Page Loaded Correctly": (res) =>
        res.body.indexOf(`${createProjectRecordPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetCreateProjectRecordPageReqSuccessful) {
      console.error(
        `Get Create Project Record Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(`${baseURL}application/startproject`, getHeaders);
    TrendStartProjectIrasPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetStartProjectIrasPageReqSuccessful = check(response, {
      "Start Project IRAS Page Request Success": () => response.status === 200,
      "Start Project IRAS Page Loaded Correctly": (res) =>
        res.body.indexOf(`${startProjectIrasPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetStartProjectIrasPageReqSuccessful) {
      console.error(
        `Get Start Project IRAS Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const irasId = generateIrasId(1000, 9999999);

    const irasPostBody = scriptData[0][0].startProjIrasPostBody[0].postBody;
    const startProjIrasPostBody = Object.assign({}, irasPostBody, {
      IrasId: `${irasId}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersIrasWithReferer = Object.assign({}, postHeaders.headers, {
      Referer: `${baseURL}application/startproject`,
    });
    const postStartProjectIrasHeaders = {
      headers: postHeadersIrasWithReferer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}application/startproject`,
      startProjIrasPostBody,
      postStartProjectIrasHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isPostStartProjIrasReqSuccessful = check(response, {
      "Start Project IRAS Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostStartProjIrasReqSuccessful) {
      console.error(
        `Post Start Project IRAS Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    let irasRedirectUrl = response.url;
    const getHeadersIrasWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${baseURL}application/startproject`,
    });
    const getStartProjectIrasHeaders = {
      headers: getHeadersIrasWithReferer,
      redirects: 1,
    };

    response = http.get(`${irasRedirectUrl}`, getStartProjectIrasHeaders);
    let secondRedirectDuration = response.timings.duration;
    const isGetStartProjIrasReqSuccessful = check(response, {
      "Resume Start Project IRAS Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetStartProjIrasReqSuccessful) {
      console.error(
        `Get Resume Start Project IRAS Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    irasRedirectUrl = response.url;

    response = http.get(`${irasRedirectUrl}`, getStartProjectIrasHeaders);
    TrendSaveStartProjectIrasPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayProjDetailsReqSuccessful = check(response, {
      "Display Project Details Redirect Page Request Success": () =>
        response.status === 200,
      "Display Project Details Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayProjDetailsPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayProjDetailsReqSuccessful) {
      console.error(
        `Get Display Project Details Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const projectDetailsPostBody =
      scriptData[0][0].projectDetailsPostBody[0].postBody;
    const verifiedProjectDetailsPostBody = Object.assign(
      {},
      projectDetailsPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersProjDetailsWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${irasRedirectUrl}`,
      }
    );
    const postProjectDetailsHeaders = {
      headers: postHeadersProjDetailsWithReferer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      verifiedProjectDetailsPostBody,
      postProjectDetailsHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostProjDetailsReqSuccessful = check(response, {
      "Save Project Details Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostProjDetailsReqSuccessful) {
      console.error(
        `Post Save Project Details Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    let projectDetailsRedirectUrl = response.url;
    const getHeadersProjDetailsWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${irasRedirectUrl}`,
      }
    );
    const getProjectDetailsHeaders = {
      headers: getHeadersProjDetailsWithReferer,
      redirects: 1,
    };

    response = http.get(
      `${projectDetailsRedirectUrl}`,
      getProjectDetailsHeaders
    );
    secondRedirectDuration = response.timings.duration;
    const isGetProjDetailsReqSuccessful = check(response, {
      "Resume Project Details Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjDetailsReqSuccessful) {
      console.error(
        `Get Resume Project Details Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    projectDetailsRedirectUrl = response.url;

    response = http.get(
      `${projectDetailsRedirectUrl}`,
      getProjectDetailsHeaders
    );
    TrendSaveProjectDetailsPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayKeyRolesReqSuccessful = check(response, {
      "Display Key Roles Redirect Page Request Success": () =>
        response.status === 200,
      "Display Key Roles Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayKeyRolesPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayKeyRolesReqSuccessful) {
      console.error(
        `Get Display Key Roles Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    response = http.get(
      `${baseURL}organisation/getorganisations?name=${orgSearchParam}`,
      getHeaders
    );
    TrendSearchRtsOrgsReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isGetRtsOrgsSearchReqSuccessful = check(response, {
      "Search Rts Orgs Request Success": () => response.status === 200,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetRtsOrgsSearchReqSuccessful) {
      console.error(
        `Get Search Rts Orgs Request Success Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const keyRolesPostBody = scriptData[0][0].keyRolesPostBody[0].postBody;
    const verifiedKeyRolesPostBody = Object.assign({}, keyRolesPostBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersKeyRolesWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${projectDetailsRedirectUrl}`,
      }
    );
    const postKeyRolesHeaders = {
      headers: postHeadersKeyRolesWithReferer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      verifiedKeyRolesPostBody,
      postKeyRolesHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostKeyRolesReqSuccessful = check(response, {
      "Save Key Roles Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostKeyRolesReqSuccessful) {
      console.error(
        `Post Save Key Roles Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    let keyRolesRedirectUrl = response.url;
    const getHeadersKeyRolesWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${projectDetailsRedirectUrl}`,
      }
    );
    const getKeyRolesHeaders = {
      headers: getHeadersKeyRolesWithReferer,
      redirects: 1,
    };

    response = http.get(`${keyRolesRedirectUrl}`, getKeyRolesHeaders);
    secondRedirectDuration = response.timings.duration;
    const isGetKeyRolesReqSuccessful = check(response, {
      "Resume Key Roles Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetKeyRolesReqSuccessful) {
      console.error(
        `Get Resume Key Roles Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    keyRolesRedirectUrl = response.url;

    response = http.get(`${keyRolesRedirectUrl}`, getKeyRolesHeaders);
    TrendSaveKeyRolesPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayResearchLocationsReqSuccessful = check(response, {
      "Display Research Locations Redirect Page Request Success": () =>
        response.status === 200,
      "Display Research Locations Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayResearchLocationsPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayResearchLocationsReqSuccessful) {
      console.error(
        `Get Display Research Locations Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const researchLocationPostBody =
      scriptData[0][0].researchLocationPostBody[0].postBody;
    const verifiedResearchLocationsPostBody = Object.assign(
      {},
      researchLocationPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersResearchLocationsWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${keyRolesRedirectUrl}`,
      }
    );
    const postResearchLocationsHeaders = {
      headers: postHeadersResearchLocationsWithReferer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      verifiedResearchLocationsPostBody,
      postResearchLocationsHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostResearchLocationsReqSuccessful = check(response, {
      "Save Research Locations Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostResearchLocationsReqSuccessful) {
      console.error(
        `Post Save Research Locations Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    let researchLocationsRedirectUrl = response.url;
    const getResearchLocationsWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${keyRolesRedirectUrl}`,
      }
    );
    const getResearchLocationsHeaders = {
      headers: getResearchLocationsWithReferer,
      redirects: 1,
    };

    response = http.get(
      `${researchLocationsRedirectUrl}`,
      getResearchLocationsHeaders
    );
    TrendSaveResearchLocationsPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetDisplaySubmitApplicationReqSuccessful = check(response, {
      "Display Submit Application Redirect Page Request Success": () =>
        response.status === 200,
      "Display Submit Application Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displaySubmitApplicationPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplaySubmitApplicationReqSuccessful) {
      console.error(
        `Get Display Submit Application Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const confirmProjDetailsPostBody =
      scriptData[0][0].confirmProjDetailsPostBody[0].postBody;
    const verifiedConfirmProjDetailsPostBody = Object.assign(
      {},
      confirmProjDetailsPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersConfirmProjDetailsWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${researchLocationsRedirectUrl}`,
      }
    );
    const postConfirmProjDetailsHeaders = {
      headers: postHeadersConfirmProjDetailsWithReferer,
      redirects: 1,
    };

    response = http.post(
      `${baseURL}questionnaire/confirmprojectdetails`,
      verifiedConfirmProjDetailsPostBody,
      postConfirmProjDetailsHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostConfirmProjDetailsReqSuccessful = check(response, {
      "Confirm Project Details Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmProjDetailsReqSuccessful) {
      console.error(
        `Post Confirm Project Details Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    const getProjectOverviewWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${researchLocationsRedirectUrl}`,
      }
    );
    const getProjectOverviewHeaders = {
      headers: getProjectOverviewWithReferer,
      redirects: 1,
    };

    response = http.get(
      `${baseURL}application/projectoverview`,
      getProjectOverviewHeaders
    );
    TrendSaveConfirmProjectReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetProjectOverviewReqSuccessful = check(response, {
      "Project Overview Redirect Page Request Success": () =>
        response.status === 200,
      "Project Overview Redirect Page Loaded Correctly": (res) =>
        res.body.indexOf(`${projectOverviewPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjectOverviewReqSuccessful) {
      console.error(
        `Get Project Overview Redirect Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/basicJourneysScriptReport.json": JSON.stringify(data),
  };
}
