import { sleep, group, fail, check } from "k6";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { decryptData } from "../utils/decryptData.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { generateTOTP } from "../utils/generateMfaKey.js";

//Script Data and Variables
const baseURL =
  "https://fd-rsp-applications-preprod-uks-f6esbkgtfncwc4gf.a03.azurefd.net/";

const loginDetails = new SharedArray("loginData", function () {
  return JSON.parse(
    open("../resources/data/preProdTestData.json")
  ).loginDetails;
});
const usernameInput = loginDetails[0].usernameInput;

const irasIds = new SharedArray("irasIds", function () {
  return JSON.parse(open("../resources/data/irasIds.json"));
});

const scriptData = new SharedArray("scriptData", function () {
  return JSON.parse(
    open("../resources/data/preProdTestData.json")
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
const revBodyProfileIdsWithUsers = scriptData[0][1].revBodyProfileIdsWithUsers;
const editCreatedBy = scriptData[0][1].editCreatedBy;
const editUpdatedBy = scriptData[0][1].editUpdatedBy;
const emailPrefix = scriptData[0][1].emailPrefix;
const emailEditPrefix = scriptData[0][1].emailEditPrefix;
const emailSuffix = scriptData[0][1].emailSuffix;
const userProfileIds = scriptData[0][1].userProfileIds;

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
const displayProjIdentifiersPageCheck =
  scriptData[2].displayProjIdentifiersPageCheck;
const displayPlannedEndDatePageCheck =
  scriptData[2].displayPlannedEndDatePageCheck;
const displayChiefInvestigatorPageCheck =
  scriptData[2].displayChiefInvestigatorPageCheck;
const displayResearchLocationsPageCheck =
  scriptData[2].displayResearchLocationsPageCheck;
const reviewAppAnswersCheck = scriptData[2].reviewAppAnswersCheck;
const projectCreatedCheck = scriptData[2].projectCreatedCheck;
const projectOverviewPageCheck = scriptData[2].projectOverviewPageCheck;
const postApprovalCheck = scriptData[2].postApprovalCheck;
const areaOfChangeCheck = scriptData[2].areaOfChangeCheck;
const modificationFreeTextCheck = scriptData[2].modificationFreeTextCheck;
const orgsAffectedCheck = scriptData[2].orgsAffectedCheck;
const orgsAffectedReviewAnswersCheck =
  scriptData[2].orgsAffectedReviewAnswersCheck;
const modReviewChangesCheck = scriptData[2].modReviewChangesCheck;
const modificationDetailsCheck = scriptData[2].modificationDetailsCheck;
const sponsorReferenceCheck = scriptData[2].sponsorReferenceCheck;
const getReviewAllChangeCheck = scriptData[2].getReviewAllChangeCheck;
const sentToSponsorCheck = scriptData[2].sentToSponsorCheck;
const sponsorWorkspaceCheck = scriptData[2].sponsorWorkspaceCheck;
const sponsorAuthorisationsCheck = scriptData[2].sponsorAuthorisationsCheck;
const checkAuthoriseCheck = scriptData[2].checkAuthoriseCheck;
const getSponsorAuthCheck = scriptData[2].getSponsorAuthCheck;
const approvalsWorkspaceCheck = scriptData[2].approvalsWorkspaceCheck;
const modificationsTasklistCheck = scriptData[2].modificationsTasklistCheck;
const selectReviewerCheck = scriptData[2].selectReviewerCheck;
const getModAssignSuccessCheck = scriptData[2].getModAssignSuccessCheck;
const myTasklistCheck = scriptData[2].myTasklistCheck;
const modReviewAllChangesCheck = scriptData[2].modReviewAllChangesCheck;
const modReviewOutcomeCheck = scriptData[2].modReviewOutcomeCheck;
const confirmReviewOutcomeCheck = scriptData[2].confirmReviewOutcomeCheck;
const submittedReviewOutcomeCheck = scriptData[2].submittedReviewOutcomeCheck;

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
export const TrendSaveProjectRecordPageReqDuration = new Trend(
  "save_project_record_page_response_time",
  true
);
export const TrendSaveProjectIdentifiersPageReqDuration = new Trend(
  "save_project_identifiers_page_response_time",
  true
);
export const TrendSavePlannedEndDatePageReqDuration = new Trend(
  "save_planned_end_date_page_response_time",
  true
);
export const TrendSaveChiefInvestigatorPageReqDuration = new Trend(
  "save_chief_investigator_page_response_time",
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
export const TrendProjectOverviewPageReqDuration = new Trend(
  "load_project_overview_page_response_time",
  true
);
export const TrendPostApprovalTabReqDuration = new Trend(
  "load_post_approval_tab_response_time",
  true
);
export const TrendCreateModificationPageReqDuration = new Trend(
  "load_create_modification_page_response_time",
  true
);
export const TrendSaveAreaOfChangePageReqDuration = new Trend(
  "save_area_of_change_page_response_time",
  true
);
export const TrendSaveModsFreeTextPageReqDuration = new Trend(
  "save_modification_free_text_page_response_time",
  true
);
export const TrendSaveOrgsAffectedPageReqDuration = new Trend(
  "save_organisations_affected_page_response_time",
  true
);
export const TrendSaveOrgsAffectedReviewAnswersPageReqDuration = new Trend(
  "save_organisations_affected_review_answers_page_response_time",
  true
);
export const TrendSaveModificationChangesPageReqDuration = new Trend(
  "save_modification_changes_page_response_time",
  true
);
export const TrendSponsorReferencePageReqDuration = new Trend(
  "load_sponsor_reference_page_response_time",
  true
);
export const TrendSaveSponsorReferencePageReqDuration = new Trend(
  "save_sponsor_reference_page_response_time",
  true
);
export const TrendSendToSponsorPageReqDuration = new Trend(
  "send_to_sponsor_page_response_time",
  true
);
export const TrendSponsorWorkspacePageReqDuration = new Trend(
  "load_sponsor_workspace_page_response_time",
  true
);
export const TrendSponsorAuthorisationsPageReqDuration = new Trend(
  "load_sponsor_authorisations_page_response_time",
  true
);
export const TrendSearchSponsorAuthPageReqDuration = new Trend(
  "search_sponsor_authorisations_page_response_time",
  true
);
export const TrendCheckAuthorisePageReqDuration = new Trend(
  "load_sponsor_check_authorise_page_response_time",
  true
);
export const TrendSponsorAuthConfirmPageReqDuration = new Trend(
  "save_sponsor_auth_confirm_page_response_time",
  true
);
export const TrendApprovalsWorkspacePageReqDuration = new Trend(
  "load_approvals_workspace_page_response_time",
  true
);
export const TrendModificationTasklistPageReqDuration = new Trend(
  "load_modification_tasklist_page_response_time",
  true
);
export const TrendSearchModTasklistPageReqDuration = new Trend(
  "search_modification_tasklist_page_response_time",
  true
);
export const TrendSelectReviewerPageReqDuration = new Trend(
  "load_select_reviewer_page_response_time",
  true
);
export const TrendModificationAssignedPageReqDuration = new Trend(
  "save_modification_assigned_page_response_time",
  true
);
export const TrendMyTasklistPageReqDuration = new Trend(
  "load_my_tasklist_page_response_time",
  true
);
export const TrendReviewAllChangesPageReqDuration = new Trend(
  "load_review_all_changes_page_response_time",
  true
);
export const TrendReviewOutcomePageReqDuration = new Trend(
  "load_review_outcome_page_response_time",
  true
);
export const TrendConfirmReviewOutcomePageReqDuration = new Trend(
  "confirm_review_outcome_page_response_time",
  true
);
export const TrendSubmitReviewOutcomePageReqDuration = new Trend(
  "submit_review_outcome_page_response_time",
  true
);

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
    redirects: 0,
  });

  response = http.get(`${response.headers.Location}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirects: 0,
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
    "My account homepage"
  ) {
    fail("Failure to Authorize, No Cookies Set");
  }
  const authCookiesArr = response.request.headers.Cookie;
  return authCookiesArr;
}

export function basicJourneysScript(data) {
  let response;
  let requestVerificationToken;
  let modificationDetailsUrl;
  let timestamp;
  let orgName;
  let emailAdd;
  let projectRecordId;
  let irasId;
  let shortTitle;
  let modificationId;
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

  group("Manage Review Body Journey", function () {
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
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
      RegulatoryBodyName: `${orgName}`,
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
      RegulatoryBodyName: `${orgName}`,
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

    const revBodyEditPageUrl = `${baseURL}reviewbody/update?id=${selectedRevBodyProfile}`;

    response = http.get(`${revBodyEditPageUrl}`, getHeaders);
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
      RegulatoryBodyName: `${orgName}`,
      EmailAddress: `${emailEditPrefix}${timestamp}${emailSuffix}`,
      Description: `${selectedPostBody.Description} ${timestamp}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersWithRefer = Object.assign({}, postHeaders.headers, {
      Referer: `${revBodyEditPageUrl}`,
    });

    const postHeadersEdit = { headers: postHeadersWithRefer, redirects: 0 };
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
    const redirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;
    const getSubmitRevBodyEditWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${revBodyEditPageUrl}`,
      }
    );

    response = http.get(`${redirectUrl}`, getSubmitRevBodyEditWithReferer);
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
      .find("button[type=submit][formaction]")
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
      .find("button[type=submit][formaction]")
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

    const selectedRevBodyWithUsers = randomItem(revBodyProfileIdsWithUsers); //add selected param here when add flow complete
    response = http.get(
      `${baseURL}reviewbody/viewreviewbodyusers?reviewBodyId=${selectedRevBodyWithUsers}`,
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
      `${baseURL}reviewbody/viewreviewbodyusers?SearchQuery=qa+auto&ReviewBodyId=${selectedRevBodyWithUsers}&PageSize=20`,
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
      "Get Home Page Request Success": () => response.status === 200,
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

    const getUserEditPageUrl = `${baseURL}admin/users/edituser?userId=${selectedUserProfile}`;
    response = http.get(`${getUserEditPageUrl}`, getHeaders);
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
      GivenName: `${selectedUserPostBody.GivenName} ${timestamp}`,
      FamilyName: `${selectedUserPostBody.FamilyName} ${timestamp}`,
      Email: `${emailEditPrefix}${timestamp}${emailSuffix}`,
      Organisation: `${selectedUserPostBody.Organisation} ${timestamp}`,
      JobTitle: `${selectedUserPostBody.JobTitle} ${timestamp}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersUserWithRefer = Object.assign({}, postHeaders.headers, {
      Referer: `${getUserEditPageUrl}`,
    });

    const postHeadersUserEdit = {
      headers: postHeadersUserWithRefer,
      redirects: 0,
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

    const redirectEditUserUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;
    const getSubmitRevBodyEditWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${getUserEditPageUrl}`,
      }
    );

    response = http.get(
      `${redirectEditUserUrl}`,
      getSubmitRevBodyEditWithReferer
    );
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
    // After run need to delete from DB
    const projectRecord = randomItem(irasIds);
    irasId = projectRecord.IRAS_ID;
    shortTitle = projectRecord.Short_Project_Title;
    const fullTitle = projectRecord.Full_Project_Title;

    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
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
      redirects: 0,
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
    const irasRedirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getHeadersIrasWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${baseURL}application/startproject`,
    });

    const getStartProjectIrasHeaders = {
      headers: getHeadersIrasWithReferer,
      redirects: 0,
    };

    response = http.get(`${irasRedirectUrl}`, getStartProjectIrasHeaders);
    TrendSaveStartProjectIrasPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetDisplayProjDetailsReqSuccessful = check(response, {
      "Display Confirm Project Details Page Request Success": () =>
        response.status === 200,
      "Display Confirm Project Details Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayProjDetailsPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayProjDetailsReqSuccessful) {
      console.error(
        `Get Display Confirm Project Details Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const projectRecordPostBody =
      scriptData[0][0].projectRecordPostBody[0].postBody;

    const confirmProjectRecordPostBody = Object.assign(
      {},
      projectRecordPostBody,
      {
        IrasId: `${irasId}`,
        ShortProjectTitle: `${shortTitle}`,
        FullProjectTitle: `${fullTitle}`,
        "Questions[0].AnswerText": `${shortTitle}`,
        "Questions[1].AnswerText": `${fullTitle}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersConfirmProjRecordWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${irasRedirectUrl}`,
      }
    );

    const postProjectRecordHeaders = {
      headers: postHeadersConfirmProjRecordWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}projectrecord/confirmprojectrecord`,
      confirmProjectRecordPostBody,
      postProjectRecordHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostConfirmProjRecordReqSuccessful = check(response, {
      "Post Confirm Project Record Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmProjRecordReqSuccessful) {
      console.error(
        `Post Start Project IRAS Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const confirmProjectRecRedirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getHeadersConfirmProjRecWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${irasRedirectUrl}`,
      }
    );

    const getConfirmProjectRecRedirectHeaders = {
      headers: getHeadersConfirmProjRecWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${confirmProjectRecRedirectUrl}`,
      getConfirmProjectRecRedirectHeaders
    );
    let secondRedirectDuration = response.timings.duration;
    const isGetProjDetailsReqSuccessful = check(response, {
      "Get Confirm Project Record Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjDetailsReqSuccessful) {
      console.error(
        `Get Confirm Project Record Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const displayProjIdentifiersUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getDisplayProjIdentifiersWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${irasRedirectUrl}`,
      }
    );

    const getDisplayProjIdentifiersHeaders = {
      headers: getDisplayProjIdentifiersWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${displayProjIdentifiersUrl}`,
      getDisplayProjIdentifiersHeaders
    );
    TrendSaveProjectRecordPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayProjIdentifiersReqSuccessful = check(response, {
      "Get Display Project Identifiers Page Request Success": () =>
        response.status === 200,
      "Display Project Identifiers Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayProjIdentifiersPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayProjIdentifiersReqSuccessful) {
      console.error(
        `Get Display Project Identifiers Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const projectIdentifiersPostBody =
      scriptData[0][0].projectIdentifiersPostBody[0].postBody;

    const saveProjectIdentifiersPostBody = Object.assign(
      {},
      projectIdentifiersPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSaveProjIdentifiersWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${displayProjIdentifiersUrl}`,
      }
    );

    const postProjectIdentifiersHeaders = {
      headers: postHeadersSaveProjIdentifiersWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      saveProjectIdentifiersPostBody,
      postProjectIdentifiersHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostProjDetailsReqSuccessful = check(response, {
      "Post Save Project Identifiers Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostProjDetailsReqSuccessful) {
      console.error(
        `Post Save Project Identifiers Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const projIdentifiersRedirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getProjIdRedirectWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${displayProjIdentifiersUrl}`,
    });

    const getProjectIdRedirectHeaders = {
      headers: getProjIdRedirectWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${projIdentifiersRedirectUrl}`,
      getProjectIdRedirectHeaders
    );
    secondRedirectDuration = response.timings.duration;
    const isGetProjIdRedirectReqSuccessful = check(response, {
      "Get Resume Project Identifiers Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjIdRedirectReqSuccessful) {
      console.error(
        `Get Resume Project Identifiers Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const displayPlannedEndDateUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getDisplayEndDateWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${displayProjIdentifiersUrl}`,
    });

    const getDisplayEndDateHeaders = {
      headers: getDisplayEndDateWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${displayPlannedEndDateUrl}`,
      getDisplayEndDateHeaders
    );
    TrendSaveProjectIdentifiersPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayEndDateReqSuccessful = check(response, {
      "Get Display Planned End Date Page Request Success": () =>
        response.status === 200,
      "Display Planned End Date Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayPlannedEndDatePageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayEndDateReqSuccessful) {
      console.error(
        `Get Display Planned End Date Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const endDatePostBody = scriptData[0][0].endDatePostBody[0].postBody;

    const plannedEndDatePostBody = Object.assign({}, endDatePostBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersSaveEndDateWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${displayPlannedEndDateUrl}`,
      }
    );

    const postPlannedEndDateHeaders = {
      headers: postHeadersSaveEndDateWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      plannedEndDatePostBody,
      postPlannedEndDateHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostEndDateReqSuccessful = check(response, {
      "Post Planned End Date Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostEndDateReqSuccessful) {
      console.error(
        `Post Planned End Date Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const endDateRedirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getEndDateRedirectWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${displayPlannedEndDateUrl}`,
      }
    );

    const getEndDateRedirectHeaders = {
      headers: getEndDateRedirectWithReferer,
      redirects: 0,
    };

    response = http.get(`${endDateRedirectUrl}`, getEndDateRedirectHeaders);
    secondRedirectDuration = response.timings.duration;
    const isGetEndDateRedirectReqSuccessful = check(response, {
      "Get Planned End Date Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetEndDateRedirectReqSuccessful) {
      console.error(
        `Get Planned End Date Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const displayChiefInvestigatorUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getDisplayChiefWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${displayPlannedEndDateUrl}`,
    });

    const getDisplayChiefInvestigatorHeaders = {
      headers: getDisplayChiefWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${displayChiefInvestigatorUrl}`,
      getDisplayChiefInvestigatorHeaders
    );
    TrendSavePlannedEndDatePageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayChiefReqSuccessful = check(response, {
      "Get Display Chief Investigator Page Request Success": () =>
        response.status === 200,
      "Display Chief Investigator Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayChiefInvestigatorPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayChiefReqSuccessful) {
      console.error(
        `Get Display Chief Investigator Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const chiefInvstgtrPostBody =
      scriptData[0][0].chiefInvstgtrPostBody[0].postBody;

    const chiefInvestigatorPostBody = Object.assign({}, chiefInvstgtrPostBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersSaveChiefWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${displayChiefInvestigatorUrl}`,
      }
    );

    const postChiefInvestigatorHeaders = {
      headers: postHeadersSaveChiefWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      chiefInvestigatorPostBody,
      postChiefInvestigatorHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostChiefInvestigatorReqSuccessful = check(response, {
      "Post Chief Investigator Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostChiefInvestigatorReqSuccessful) {
      console.error(
        `Post Chief Investigator Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const chiefInvestigatorRedirectUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getChiefRedirectWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${displayChiefInvestigatorUrl}`,
    });

    const getChiefRedirectHeaders = {
      headers: getChiefRedirectWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${chiefInvestigatorRedirectUrl}`,
      getChiefRedirectHeaders
    );
    secondRedirectDuration = response.timings.duration;
    const isGetChiefRedirectReqSuccessful = check(response, {
      "Get Chief Investigator Redirect Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetChiefRedirectReqSuccessful) {
      console.error(
        `Get Chief Investigator Redirect Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const displayResearchLocationsUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getDisplayLocationsWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${displayChiefInvestigatorUrl}`,
      }
    );

    const getDisplayResearchLocationsHeaders = {
      headers: getDisplayLocationsWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${displayResearchLocationsUrl}`,
      getDisplayResearchLocationsHeaders
    );
    TrendSaveChiefInvestigatorPageReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration + secondRedirectDuration
    );
    const isGetDisplayLocationsReqSuccessful = check(response, {
      "Get Display Research Locations Page Request Success": () =>
        response.status === 200,
      "Display Research Locations Page Loaded Correctly": (res) =>
        res.body.indexOf(`${displayResearchLocationsPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetDisplayLocationsReqSuccessful) {
      console.error(
        `Get Display Research Locations Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const locationsPostBody = scriptData[0][0].locationsPostBody[0].postBody;

    const researchLocationsPostBody = Object.assign({}, locationsPostBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersSaveLocationsWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${displayResearchLocationsUrl}`,
      }
    );

    const postResearchLocationHeaders = {
      headers: postHeadersSaveLocationsWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}questionnaire/saveresponses?saveAndContinue=True`,
      researchLocationsPostBody,
      postResearchLocationHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostResearchLocationsReqSuccessful = check(response, {
      "Post Research Locations Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostResearchLocationsReqSuccessful) {
      console.error(
        `Post Research Locations Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const reviewApplicationUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getReviewAppWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${displayResearchLocationsUrl}`,
    });

    const getReviewApplicationHeaders = {
      headers: getReviewAppWithReferer,
      redirects: 0,
    };

    response = http.get(`${reviewApplicationUrl}`, getReviewApplicationHeaders);
    TrendSaveResearchLocationsPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetReviewAppReqSuccessful = check(response, {
      "Get Review Application Answers Page Request Success": () =>
        response.status === 200,
      "Review Application Answers Page Loaded Correctly": (res) =>
        res.body.indexOf(`${reviewAppAnswersCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetReviewAppReqSuccessful) {
      console.error(
        `Get Review Application Answers Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const confirmDetailsPostBody =
      scriptData[0][0].confirmDetailsPostBody[0].postBody;

    const confirmProjAppDetailsPostBody = Object.assign(
      {},
      confirmDetailsPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersConfirmDetailsWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${reviewApplicationUrl}`,
      }
    );

    const postConfirmProjectDetailsHeaders = {
      headers: postHeadersConfirmDetailsWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}questionnaire/confirmprojectdetails`,
      confirmProjAppDetailsPostBody,
      postConfirmProjectDetailsHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostConfirmDetailsReqSuccessful = check(response, {
      "Post Confirm Project Details Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmDetailsReqSuccessful) {
      console.error(
        `Post Confirm Project Details Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const projectCreatedUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getprojectCreatedWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${reviewApplicationUrl}`,
    });

    const getProjectCreatedHeaders = {
      headers: getprojectCreatedWithReferer,
      redirects: 0,
    };

    response = http.get(`${projectCreatedUrl}`, getProjectCreatedHeaders);
    TrendSaveConfirmProjectReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetProjectCreatedReqSuccessful = check(response, {
      "Get Project Created Page Request Success": () => response.status === 200,
      "Project Created Page Loaded Correctly": (res) =>
        res.body.indexOf(`${projectCreatedCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjectCreatedReqSuccessful) {
      console.error(
        `Get Project Created Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const projectRecordUrl = response
      .html()
      .find("p[class=govuk-body] a[class=govuk-link]")
      .first()
      .attr("href");
    const startIndex = projectRecordUrl.lastIndexOf("=");
    projectRecordId = projectRecordUrl.slice(startIndex + 1);

    const getProjectOverviewWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${projectCreatedUrl}`,
      }
    );

    const getProjectOverviewHeaders = {
      headers: getProjectOverviewWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${baseURL}projectoverview/projectdetails?projectRecordId=${projectRecordId}`,
      getProjectOverviewHeaders
    );
    TrendProjectOverviewPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetProjectOverviewReqSuccessful = check(response, {
      "Get Project Overview Page Request Success": () =>
        response.status === 200,
      "Project Overview Page Loaded Correctly": (res) =>
        res.body.indexOf(`${projectOverviewPageCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetProjectOverviewReqSuccessful) {
      console.error(
        `Get Project Overview Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });

  group("Create Modification Journey", function () {
    const postApprovalTabUrl = `${baseURL}projectoverview/postapproval?projectRecordId=${projectRecordId}`;

    response = http.get(`${postApprovalTabUrl}`, getHeaders);
    TrendPostApprovalTabReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetPostApprovalReqSuccessful = check(response, {
      "Get Post Approval Tab Request Success": () => response.status === 200,
      "Post Approval Tab Loaded Correctly": (res) =>
        res.body.indexOf(`${postApprovalCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetPostApprovalReqSuccessful) {
      console.error(
        `Get Post Approval Tab Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getHeadersCreateModWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${postApprovalTabUrl}`,
      }
    );
    const getCreateModHeaders = {
      headers: getHeadersCreateModWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${baseURL}modifications/createmodification`,
      getCreateModHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isGetCreateModificationPageReqSuccessful = check(response, {
      "Create Modification Page Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetCreateModificationPageReqSuccessful) {
      console.error(
        `Get Create Modification Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const modificationsChangeUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    response = http.get(`${modificationsChangeUrl}`, getCreateModHeaders);
    TrendCreateModificationPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendNonTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetAreaOfChangePageReqSuccessful = check(response, {
      "Get Area of Change Page Request Success": () => response.status === 200,
      "Area of Change Page Loaded Correctly": (res) =>
        res.body.indexOf(`${areaOfChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetAreaOfChangePageReqSuccessful) {
      console.error(
        `Get Area of Change Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const selectChangePostBody =
      scriptData[0][0].areaOfChangePostBody[0].postBody;

    const areaOfChangePostBody = Object.assign({}, selectChangePostBody, {
      ProjectRecordId: `${projectRecordId}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersAreaOfChangeWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${modificationsChangeUrl}`,
      }
    );

    const postAreaOfChangeHeaders = {
      headers: postHeadersAreaOfChangeWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/confirmmodificationjourney`,
      areaOfChangePostBody,
      postAreaOfChangeHeaders
    );
    firstRedirectDuration = response.timings.duration;

    const isPostAreaOfChangeReqSuccessful = check(response, {
      "Post Area of Change Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostAreaOfChangeReqSuccessful) {
      console.error(
        `Post Area of Change Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    const freeTextTextUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getFreeTextWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${modificationsChangeUrl}`,
    });

    const getFreeTextHeaders = {
      headers: getFreeTextWithReferer,
      redirects: 0,
    };

    response = http.get(`${freeTextTextUrl}`, getFreeTextHeaders);
    TrendSaveAreaOfChangePageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetFreeTextReqSuccessful = check(response, {
      "Get Modification Free Text Request Success": () =>
        response.status === 200,
      "Modification Free Text Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modificationFreeTextCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetFreeTextReqSuccessful) {
      console.error(
        `Get Modification Free Text Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const modifcationTextPostBody =
      scriptData[0][0].modificationFreeTextPostBody[0].postBody;

    const modifcationFreeTextPostBody = Object.assign(
      {},
      modifcationTextPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersFreeTextWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${freeTextTextUrl}`,
      }
    );

    const postFreeTextHeaders = {
      headers: postHeadersFreeTextWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/modificationchanges/saveresponses`,
      modifcationFreeTextPostBody,
      postFreeTextHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostFreeTextReqSuccessful = check(response, {
      "Post Modification Free Text Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostFreeTextReqSuccessful) {
      console.error(
        `Post Modification Free Text Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const orgsAffectedUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getOrgsAffectedWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${freeTextTextUrl}`,
    });

    const getOrgsAffectedHeaders = {
      headers: getOrgsAffectedWithReferer,
      redirects: 0,
    };

    response = http.get(`${orgsAffectedUrl}`, getOrgsAffectedHeaders);
    TrendSaveModsFreeTextPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetOrgsAffectedReqSuccessful = check(response, {
      "Get Organisations Affected Request Success": () =>
        response.status === 200,
      "Organisations Affected Page Loaded Correctly": (res) =>
        res.body.indexOf(`${orgsAffectedCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetOrgsAffectedReqSuccessful) {
      console.error(
        `Get Organisations Affected Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const orgsAffectedPostBody =
      scriptData[0][0].orgsAffectedPostBody[0].postBody;
    const organisationsAffectedPostBody = Object.assign(
      {},
      orgsAffectedPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersOrgsAffectedWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${orgsAffectedUrl}`,
      }
    );

    const postOrgsAffectedHeaders = {
      headers: postHeadersOrgsAffectedWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/modificationchanges/saveresponses`,
      organisationsAffectedPostBody,
      postOrgsAffectedHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostOrgsAffectedReqSuccessful = check(response, {
      "Post Organisations Affected Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostOrgsAffectedReqSuccessful) {
      console.error(
        `Post Organisations Affected Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const orgsAffectedReviewAnswersUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getOrgsAffectedReviewWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${orgsAffectedUrl}`,
      }
    );

    const getOrgsAffectedReviewAnswersHeaders = {
      headers: getOrgsAffectedReviewWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${orgsAffectedReviewAnswersUrl}`,
      getOrgsAffectedReviewAnswersHeaders
    );
    TrendSaveOrgsAffectedPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetOrgsAffectedReviewAnswerReqSuccessful = check(response, {
      "Get Orgs Affected Review Answers Request Success": () =>
        response.status === 200,
      "Orgs Affected Review Answers Page Loaded Correctly": (res) =>
        res.body.indexOf(`${orgsAffectedReviewAnswersCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetOrgsAffectedReviewAnswerReqSuccessful) {
      console.error(
        `Get Orgs Affected Review Answers Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const orgsAffectedReviewPostBody =
      scriptData[0][0].orgsAffectedReviewPostBody[0].postBody;

    const orgsAffectedReviewAnswersPostBody = Object.assign(
      {},
      orgsAffectedReviewPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersOrgsAffectedReviewWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${orgsAffectedReviewAnswersUrl}`,
      }
    );

    const postOrgsAffectedReviewAnswersHeaders = {
      headers: postHeadersOrgsAffectedReviewWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/modificationchanges/saveresponses`,
      orgsAffectedReviewAnswersPostBody,
      postOrgsAffectedReviewAnswersHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostOrgsAffectedReviewReqSuccessful = check(response, {
      "Post Orgs Affected Review Answers Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostOrgsAffectedReviewReqSuccessful) {
      console.error(
        `Post Orgs Affected Review Answers Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const modificationReviewChangesUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getModificationReviewWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${orgsAffectedReviewAnswersUrl}`,
      }
    );

    const getModificationReviewChangesHeaders = {
      headers: getModificationReviewWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modificationReviewChangesUrl}`,
      getModificationReviewChangesHeaders
    );
    TrendSaveOrgsAffectedReviewAnswersPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isModificationReviewChangesReqSuccessful = check(response, {
      "Get Modification Review Changes Request Success": () =>
        response.status === 200,
      "Modification Review Changes Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modReviewChangesCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isModificationReviewChangesReqSuccessful) {
      console.error(
        `Get Modification Review Changes Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const confirmModificationPostBody =
      scriptData[0][0].confirmDetailsPostBody[0].postBody;

    const confirmModificationChangesPostBody = Object.assign(
      {},
      confirmModificationPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersConfirmModificationWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${modificationReviewChangesUrl}`,
      }
    );

    const postConfirmModificationHeaders = {
      headers: postHeadersConfirmModificationWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/modificationchanges/confirmmodificationchanges?projectRecordId=${projectRecordId}`,
      confirmModificationChangesPostBody,
      postConfirmModificationHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostConfirmModificationReqSuccessful = check(response, {
      "Post Confirm Modification Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostConfirmModificationReqSuccessful) {
      console.error(
        `Post Confirm Modification Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    modificationDetailsUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getModificationDetailsWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${modificationReviewChangesUrl}`,
      }
    );

    const getModificationDetailsHeaders = {
      headers: getModificationDetailsWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modificationDetailsUrl}`,
      getModificationDetailsHeaders
    );
    TrendSaveModificationChangesPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetModificationDetailsReqSuccessful = check(response, {
      "Get Modification Details Request Success": () => response.status === 200,
      "Modification Details Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modificationDetailsCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModificationDetailsReqSuccessful) {
      console.error(
        `Get Modification Details Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
  });

  group("Send Modification to Sponsor Journey", function () {
    const postApprovalTabUrl = `${baseURL}projectoverview/postapproval?projectRecordId=${projectRecordId}`;
    const getSponsorRefWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${modificationDetailsUrl}`,
    });
    const getSponsorReferenceHeaders = {
      headers: getSponsorRefWithReferer,
    };
    const getSponsorReferenceUrl = `${baseURL}modifications/sponsorreference?projectRecordId=${projectRecordId}`;
    response = http.get(
      `${getSponsorReferenceUrl}`,
      getSponsorReferenceHeaders
    );
    TrendSponsorReferencePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetSponsorRefReqSuccessful = check(response, {
      "Get Sponsor Reference Request Success": () => response.status === 200,
      "Sponsor Reference Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sponsorReferenceCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSponsorRefReqSuccessful) {
      console.error(
        `Get Sponsor Reference Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const saveSponsorRefPostBody =
      scriptData[0][0].saveSponsorRefPostBody[0].postBody;

    const saveSponsorReferencePostBody = Object.assign(
      {},
      saveSponsorRefPostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSaveSponsorRefWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${getSponsorReferenceUrl}`,
      }
    );

    const postSaveSponsorReferenceHeaders = {
      headers: postHeadersSaveSponsorRefWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modifications/savesponsorreference`,
      saveSponsorReferencePostBody,
      postSaveSponsorReferenceHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isPostSaveSponsorRefReqSuccessful = check(response, {
      "Post Save Sponsor Reference Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSaveSponsorRefReqSuccessful) {
      console.error(
        `Post Save Sponsor Reference Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const reviewAllChangesUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getReviewAllChangesWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${getSponsorReferenceUrl}`,
      }
    );

    const getReviewAllChangesHeaders = {
      headers: getReviewAllChangesWithReferer,
      redirects: 0,
    };

    response = http.get(`${reviewAllChangesUrl}`, getReviewAllChangesHeaders);
    TrendSaveSponsorReferencePageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetReviewAllChangesReqSuccessful = check(response, {
      "Get Review All Changes Request Success": () => response.status === 200,
      "Review All Changes Page Loaded Correctly": (res) =>
        res.body.indexOf(`${getReviewAllChangeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetReviewAllChangesReqSuccessful) {
      console.error(
        `Get Review All Changes Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    irasId = response.html().find("input[name=irasId]").first().attr("value");
    shortTitle = response
      .html()
      .find("input[name=shortTitle]")
      .first()
      .attr("value");
    modificationId = response
      .html()
      .find("input[name=projectModificationId]")
      .first()
      .attr("value");

    const sendModificationToSponsorUrl = `${baseURL}modifications/sendmodificationtosponsor?projectModificationId=${modificationId}&projectRecordId=${projectRecordId}`;

    const sendToSponsorPostBody =
      scriptData[0][0].sendToSponsorPostBody[0].postBody;

    const sendToModificationToSponsorPostBody = Object.assign(
      {},
      sendToSponsorPostBody,
      {
        ProjectRecordId: `${projectRecordId}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSendToSponsorWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${reviewAllChangesUrl}`,
      }
    );

    const postSendModificationToSponsorHeaders = {
      headers: postHeadersSendToSponsorWithReferer,
    };
    response = http.post(
      `${sendModificationToSponsorUrl}`,
      sendToModificationToSponsorPostBody,
      postSendModificationToSponsorHeaders
    );
    TrendSendToSponsorPageReqDuration.add(response.timings.duration);
    TrendTransactionalReqDuration.add(response.timings.duration);
    const isPostSendToSponsorReqSuccessful = check(response, {
      "Post Send Modification To Sponsor Request Success": () =>
        response.status === 200,
      "Post Modification Sent to Sponsor Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sentToSponsorCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSendToSponsorReqSuccessful) {
      console.error(
        `Post Send Modification To Sponsor Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    const getPostApprovalWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${sendModificationToSponsorUrl}`,
    });

    const getPostApprovalHeaders = {
      headers: getPostApprovalWithReferer,
    };

    response = http.get(`${postApprovalTabUrl}`, getPostApprovalHeaders);
    TrendPostApprovalTabReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetPostApprovalReqSuccessful = check(response, {
      "Get Post Approval Tab Request Success": () => response.status === 200,
      "Post Approval Tab Loaded Correctly": (res) =>
        res.body.indexOf(`${postApprovalCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetPostApprovalReqSuccessful) {
      console.error(
        `Get Post Approval Tab Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);
  });

  group("Modification Authorised by Sponsor Journey", function () {
    const sponsorOrgId = "fa47ef3f-56e9-44c4-a4cc-dd4598e39c02";
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
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

    response = http.get(`${baseURL}sponsorworkspace`, getHeaders);
    TrendSponsorWorkspacePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetSponsorWorkspacePageReqSuccessful = check(response, {
      "Get Sponsor Workspace Page Request Success": () =>
        response.status === 200,
      "Sponsor Workspace Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sponsorWorkspaceCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSponsorWorkspacePageReqSuccessful) {
      console.error(
        `Get Sponsor Workspace Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getSponsorAuthUrl = `${baseURL}sponsorworkspace/authorisations?sponsorOrganisationUserId=${sponsorOrgId}`;
    response = http.get(`${getSponsorAuthUrl}`, getHeaders);
    TrendSponsorAuthorisationsPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetSponsorAuthorisationsPageReqSuccessful = check(response, {
      "Get Sponsor Authorisations Page Request Success": () =>
        response.status === 200,
      "Sponsor Authorisations Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sponsorAuthorisationsCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSponsorAuthorisationsPageReqSuccessful) {
      console.error(
        `Get Sponsor Authorisations Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const searchSponsorAuthPostBody =
      scriptData[0][0].searchSponsorAuthPostBody[0].postBody;

    const searchSponsorAuthorisationsPostBody = Object.assign(
      {},
      searchSponsorAuthPostBody,
      {
        "Search.SearchTerm": `${irasId}`,
        SponsorOrganisationUserId: `${sponsorOrgId}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSearchSponsorAuthWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${getSponsorAuthUrl}`,
      }
    );

    const postSearchSponsorAuthHeaders = {
      headers: postHeadersSearchSponsorAuthWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}sponsorworkspace/applyfilters`,
      searchSponsorAuthorisationsPostBody,
      postSearchSponsorAuthHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isPostSearchSponsorAuthReqSuccessful = check(response, {
      "Post Search Sponsor Authorisations Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSearchSponsorAuthReqSuccessful) {
      console.error(
        `Post Search Sponsor Authorisations Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    const getSponsorAuthWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${getSponsorAuthUrl}`,
    });

    const getSponsorAuthRedirectHeaders = {
      headers: getSponsorAuthWithReferer,
      redirects: 0,
    };

    response = http.get(`${getSponsorAuthUrl}`, getSponsorAuthRedirectHeaders);
    TrendSearchSponsorAuthPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    isGetSponsorAuthorisationsPageReqSuccessful = check(response, {
      "Get Sponsor Authorisations Page Request Success": () =>
        response.status === 200,
      "Sponsor Authorisations Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sponsorAuthorisationsCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSponsorAuthorisationsPageReqSuccessful) {
      console.error(
        `Get Sponsor Authorisations Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getSponsorCheckWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${getSponsorAuthUrl}`,
    });

    const getSponsorCheckAuthHeaders = {
      headers: getSponsorCheckWithReferer,
      redirects: 0,
    };

    const sponsorCheckAuthUrl = `${baseURL}sponsorworkspace/checkandauthorise?projectRecordId=${projectRecordId}&irasId=${irasId}&projectModificationId=${modificationId}&sponsorOrganisationUserId=${sponsorOrgId}`;

    response = http.get(`${sponsorCheckAuthUrl}`, getSponsorCheckAuthHeaders);
    TrendCheckAuthorisePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetCheckAuthorisePageReqSuccessful = check(response, {
      "Get Sponsor Check Authorise Page Request Success": () =>
        response.status === 200,
      "Sponsor Check Authorise Page Loaded Correctly": (res) =>
        res.body.indexOf(`${checkAuthoriseCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetCheckAuthorisePageReqSuccessful) {
      console.error(
        `Get Sponsor Check Authorise Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const sponsorAuthPostBody =
      scriptData[0][0].sponsorAuthPostBody[0].postBody;

    const saveSponsorAuthorisationPostBody = Object.assign(
      {},
      sponsorAuthPostBody,
      {
        ProjectRecordId: `${projectRecordId}`,
        IrasId: `${irasId}`,
        ShortTitle: `${shortTitle}`,
        ModificationId: `${modificationId}`,
        SponsorOrganisationUserId: `${sponsorOrgId}`,
        ProjectModificationId: `${modificationId}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSponsorAuthWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${sponsorCheckAuthUrl}`,
      }
    );

    const postSaveSponsorAuthorisationHeaders = {
      headers: postHeadersSponsorAuthWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}sponsorworkspace/checkandauthorise`,
      saveSponsorAuthorisationPostBody,
      postSaveSponsorAuthorisationHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostSaveSponsorRefReqSuccessful = check(response, {
      "Post Save Sponsor Authorisation Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSaveSponsorRefReqSuccessful) {
      console.error(
        `Post Save Sponsor Authorisation Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const sponsorAuthConfirmUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getSponsorConfirmWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${sponsorCheckAuthUrl}`,
    });

    const getSponsorAuthConfirmHeaders = {
      headers: getSponsorConfirmWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${sponsorAuthConfirmUrl}`,
      getSponsorAuthConfirmHeaders
    );
    TrendSponsorAuthConfirmPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isSponsorAuthConfirmReqSuccessful = check(response, {
      "Get Sponsor Auth Confirm Request Success": () => response.status === 200,
      "Sponsor Auth Confirm Page Loaded Correctly": (res) =>
        res.body.indexOf(`${getSponsorAuthCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isSponsorAuthConfirmReqSuccessful) {
      console.error(
        `Get Sponsor Auth Confirm Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getSponsorAuthReturnWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${getSponsorAuthUrl}`,
      }
    );

    const getSponsorAuthReturnHeaders = {
      headers: getSponsorAuthReturnWithReferer,
      redirects: 0,
    };

    response = http.get(`${getSponsorAuthUrl}`, getSponsorAuthReturnHeaders);
    TrendSponsorAuthorisationsPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetSponsorAuthorisationsPageReqSuccessful = check(response, {
      "Get Sponsor Authorisations Page Request Success": () =>
        response.status === 200,
      "Sponsor Authorisations Page Loaded Correctly": (res) =>
        res.body.indexOf(`${sponsorAuthorisationsCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSponsorAuthorisationsPageReqSuccessful) {
      console.error(
        `Get Sponsor Authorisations Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);
  });

  group("Modification Assignment Journey", function () {
    const reviwerId = "cd01b6ab-6fe4-4fa0-94ac-c2bd461ed035";

    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
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

    response = http.get(`${baseURL}approvalsmenu`, getHeaders);
    TrendApprovalsWorkspacePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetApprovalsWorkspacePageReqSuccessful = check(response, {
      "Get Approvals Workspace Page Request Success": () =>
        response.status === 200,
      "Approvals Workspace Page Loaded Correctly": (res) =>
        res.body.indexOf(`${approvalsWorkspaceCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetApprovalsWorkspacePageReqSuccessful) {
      console.error(
        `Get Approvals Workspace Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const modificationTasklistUrl = `${baseURL}modificationstasklist/index`;

    response = http.get(`${modificationTasklistUrl}`, getHeaders);
    TrendModificationTasklistPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetModTasklistPageReqSuccessful = check(response, {
      "Get Modification Tasklist Page Request Success": () =>
        response.status === 200,
      "Modification Tasklist Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modificationsTasklistCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModTasklistPageReqSuccessful) {
      console.error(
        `Get Modification Tasklist Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const searchModTasklistPostBody =
      scriptData[0][0].searchModTasklistPostBody[0].postBody;

    const searchModificationTasklistPostBody = Object.assign(
      {},
      searchModTasklistPostBody,
      {
        "Search.IrasId": `${irasId}`,
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSearchModTasklistWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${modificationTasklistUrl}`,
      }
    );

    const postSearchModTasklistHeaders = {
      headers: postHeadersSearchModTasklistWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modificationstasklist/applyfilters`,
      searchModificationTasklistPostBody,
      postSearchModTasklistHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isPostSearchModTasklistReqSuccessful = check(response, {
      "Post Search Modification Tasklist Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSearchModTasklistReqSuccessful) {
      console.error(
        `Post Search Modification Tasklist Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }

    const getModificationTasklistWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${modificationTasklistUrl}`,
      }
    );

    const getModTasklistRedirectHeaders = {
      headers: getModificationTasklistWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modificationTasklistUrl}`,
      getModTasklistRedirectHeaders
    );
    TrendSearchModTasklistPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    isGetModTasklistPageReqSuccessful = check(response, {
      "Get Modification Tasklist Page Request Success": () =>
        response.status === 200,
      "Modification Tasklist Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modificationsTasklistCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModTasklistPageReqSuccessful) {
      console.error(
        `Get Modification Tasklist Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const selectReviewerAssignModUrl = `${baseURL}modificationstasklist/assignmodifications?selectedModificationIds=${modificationId}`;

    response = http.get(`${selectReviewerAssignModUrl}`, getHeaders);
    TrendSelectReviewerPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetSelectReviewerPageReqSuccessful = check(response, {
      "Get Select a Reviewer Page Request Success": () =>
        response.status === 200,
      "Select a Reviewer Page Loaded Correctly": (res) =>
        res.body.indexOf(`${selectReviewerCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSelectReviewerPageReqSuccessful) {
      console.error(
        `Get Select a Reviewer Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const modAssignPostBody = scriptData[0][0].modAssignPostBody[0].postBody;

    const modificationAssignPostBody = Object.assign({}, modAssignPostBody, {
      ModificationIds: `${modificationId}`,
      ReviewerId: `${reviwerId}`,
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersModAssignWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${selectReviewerAssignModUrl}`,
      }
    );

    const postModificationAssignHeaders = {
      headers: postHeadersModAssignWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${baseURL}modificationstasklist/assignmodifications`,
      modificationAssignPostBody,
      postModificationAssignHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostModificationAssignReqSuccessful = check(response, {
      "Post Modification Assign Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostModificationAssignReqSuccessful) {
      console.error(
        `Post Modification Assign Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const modAssignSuccessUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getModAssignSuccessWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${selectReviewerAssignModUrl}`,
      }
    );

    const getModificationAssignSuccessHeaders = {
      headers: getModAssignSuccessWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modAssignSuccessUrl}`,
      getModificationAssignSuccessHeaders
    );
    TrendModificationAssignedPageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetModificationAssignReqSuccessful = check(response, {
      "Get Modification Assigned Success Request Success": () =>
        response.status === 200,
      "Modification Assigned Success Page Loaded Correctly": (res) =>
        res.body.indexOf(`${getModAssignSuccessCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModificationAssignReqSuccessful) {
      console.error(
        `Get Modification Assigned Success Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getModTasklistReturnWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${modAssignSuccessUrl}`,
      }
    );

    const getModTasklistReturnHeaders = {
      headers: getModTasklistReturnWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modificationTasklistUrl}`,
      getModTasklistReturnHeaders
    );
    TrendModificationTasklistPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetModTasklistPageReqSuccessful = check(response, {
      "Get Modification Tasklist Page Request Success": () =>
        response.status === 200,
      "Modification Tasklist Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modificationsTasklistCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModTasklistPageReqSuccessful) {
      console.error(
        `Get Modification Tasklist Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);
  });

  group("Modification Outcome Journey", function () {
    response = http.get(`${baseURL}`, getHeaders);
    TrendHomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetHomePageReqSuccessful = check(response, {
      "Get Home Page Request Success": () => response.status === 200,
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

    response = http.get(`${baseURL}approvalsmenu`, getHeaders);
    TrendApprovalsWorkspacePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    const isGetApprovalsWorkspacePageReqSuccessful = check(response, {
      "Get Approvals Workspace Page Request Success": () =>
        response.status === 200,
      "Approvals Workspace Page Loaded Correctly": (res) =>
        res.body.indexOf(`${approvalsWorkspaceCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetApprovalsWorkspacePageReqSuccessful) {
      console.error(
        `Get Approvals Workspace Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const myTasklistUrl = `${baseURL}mytasklist/index`;

    response = http.get(`${myTasklistUrl}`, getHeaders);
    TrendMyTasklistPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetMyTasklistPageReqSuccessful = check(response, {
      "Get My Tasklist Page Request Success": () => response.status === 200,
      "My Tasklist Page Loaded Correctly": (res) =>
        res.body.indexOf(`${myTasklistCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetMyTasklistPageReqSuccessful) {
      console.error(
        `Get My Tasklist Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const modReviewAllChangesUrl = `${baseURL}modifications/reviewallchanges?projectRecordId=${projectRecordId}&irasId=${irasId}&projectModificationId=${modificationId}`;
    response = http.get(`${modReviewAllChangesUrl}`, getHeaders);
    TrendReviewAllChangesPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetModReviewChangesPageReqSuccessful = check(response, {
      "Get Modification Review All Changes Page Request Success": () =>
        response.status === 200,
      "Modification Review All Changes Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modReviewAllChangesCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModReviewChangesPageReqSuccessful) {
      console.error(
        `Get Modification Review All Changes Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");
    const modReviewOutcomeUrl = `${baseURL}modifications/reviewoutcome`;
    const getModRevOutcomeWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${modReviewAllChangesUrl}`,
    });
    const getModReviewOutcomeHeaders = {
      headers: getModRevOutcomeWithReferer,
      redirects: 0,
    };

    response = http.get(`${modReviewOutcomeUrl}`, getModReviewOutcomeHeaders);
    TrendReviewOutcomePageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    let isGetModReviewOutcomePageReqSuccessful = check(response, {
      "Get Modification Review Outcome Page Request Success": () =>
        response.status === 200,
      "Modification Review Outcome Page Loaded Correctly": (res) =>
        res.body.indexOf(`${modReviewOutcomeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetModReviewOutcomePageReqSuccessful) {
      console.error(
        `Get Modification Review Outcome Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const reviewOutcomePostBody =
      scriptData[0][0].reviewOutcomePostBody[0].postBody;

    const modReviewOutcomePostBody = Object.assign({}, reviewOutcomePostBody, {
      __RequestVerificationToken: `${requestVerificationToken}`,
    });

    const postHeadersReviewOutcomeWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${modReviewOutcomeUrl}`,
      }
    );

    const postReviewOutcomeHeaders = {
      headers: postHeadersReviewOutcomeWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${modReviewOutcomeUrl}`,
      modReviewOutcomePostBody,
      postReviewOutcomeHeaders
    );
    let firstRedirectDuration = response.timings.duration;
    const isPostReviewOutcomeReqSuccessful = check(response, {
      "Post Review Outcome Request Success": () => response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostReviewOutcomeReqSuccessful) {
      console.error(
        `Post Review Outcome Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const modConfirmReviewOutcomeUrl = `${baseURL}modifications/confirmreviewoutcome`;

    const getConfirmOutcomeWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${modReviewOutcomeUrl}`,
    });

    const getConfirmRevOutcomeHeaders = {
      headers: getConfirmOutcomeWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modConfirmReviewOutcomeUrl}`,
      getConfirmRevOutcomeHeaders
    );
    TrendConfirmReviewOutcomePageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetConfirmRevOutcomePageReqSuccessful = check(response, {
      "Get Confirm Review Outcome Page Request Success": () =>
        response.status === 200,
      "Confirm Review Outcome Page Loaded Correctly": (res) =>
        res.body.indexOf(`${confirmReviewOutcomeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetConfirmRevOutcomePageReqSuccessful) {
      console.error(
        `Get Confirm Review Outcome Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    requestVerificationToken = response
      .html()
      .find("input[type=hidden][name=__RequestVerificationToken]")
      .first()
      .attr("value");

    const modSubmitReviewOutcomeUrl = `${baseURL}modifications/submitreviewoutcome`;

    const submitRevOutcomePostBody =
      scriptData[0][0].confirmDetailsPostBody[0].postBody;

    const submitReviewOutcomePostBody = Object.assign(
      {},
      submitRevOutcomePostBody,
      {
        __RequestVerificationToken: `${requestVerificationToken}`,
      }
    );

    const postHeadersSubmitOutcomeWithReferer = Object.assign(
      {},
      postHeaders.headers,
      {
        Referer: `${modConfirmReviewOutcomeUrl}`,
      }
    );

    const postSubmitReviewOutcomeHeaders = {
      headers: postHeadersSubmitOutcomeWithReferer,
      redirects: 0,
    };

    response = http.post(
      `${modSubmitReviewOutcomeUrl}`,
      submitReviewOutcomePostBody,
      postSubmitReviewOutcomeHeaders
    );
    firstRedirectDuration = response.timings.duration;
    const isPostSubmitOutcomeReqSuccessful = check(response, {
      "Post Submit Review Outcome Request Success": () =>
        response.status === 302,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isPostSubmitOutcomeReqSuccessful) {
      console.error(
        `Post Submit Review Outcome Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    const modOutcomeSubmittedUrl = `${baseURL}${response.headers.Location.replace(
      "/",
      ""
    )}`;

    const getRevOutcomeSubmittedWithReferer = Object.assign(
      {},
      getHeaders.headers,
      {
        Referer: `${modConfirmReviewOutcomeUrl}`,
      }
    );

    const getRevOutcomeSubmittedHeaders = {
      headers: getRevOutcomeSubmittedWithReferer,
      redirects: 0,
    };

    response = http.get(
      `${modOutcomeSubmittedUrl}`,
      getRevOutcomeSubmittedHeaders
    );
    TrendSubmitReviewOutcomePageReqDuration.add(
      response.timings.duration + firstRedirectDuration
    ); //combining duration of intial request and redirect requests
    TrendTransactionalReqDuration.add(
      response.timings.duration + firstRedirectDuration
    );
    const isGetSubmitRevOutcomePageReqSuccessful = check(response, {
      "Get Submitted Review Outcome Page Request Success": () =>
        response.status === 200,
      "Submitted Review Outcome Page Loaded Correctly": (res) =>
        res.body.indexOf(`${submittedReviewOutcomeCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetSubmitRevOutcomePageReqSuccessful) {
      console.error(
        `Get Submitted Review Outcome Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    userThinkTime(2, 4);

    const getMyTasklistWithReferer = Object.assign({}, getHeaders.headers, {
      Referer: `${modOutcomeSubmittedUrl}`,
    });

    const getMyTasklistHeaders = {
      headers: getMyTasklistWithReferer,
      redirects: 0,
    };

    response = http.get(`${myTasklistUrl}`, getMyTasklistHeaders);
    TrendMyTasklistPageReqDuration.add(response.timings.duration);
    TrendNonTransactionalReqDuration.add(response.timings.duration);
    isGetMyTasklistPageReqSuccessful = check(response, {
      "Get My Tasklist Page Request Success": () => response.status === 200,
      "My Tasklist Page Loaded Correctly": (res) =>
        res.body.indexOf(`${myTasklistCheck}`) !== -1,
    });
    console.info(
      "Request Sent: " + response.request.method + " " + response.request.url
    );
    if (!isGetMyTasklistPageReqSuccessful) {
      console.error(
        `Get My Tasklist Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`
      );
    }
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "→", enableColors: true }),
    "tests/results/basicJourneysScriptPreProdReport.json": JSON.stringify(data),
  };
}
