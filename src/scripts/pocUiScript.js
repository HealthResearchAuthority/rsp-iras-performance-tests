import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const baseURL = 'https://test.k6.io'

export const options = {
  cloud: {
    distribution: {
        'amazon:gb:london': { loadZone: 'amazon:gb:london', percent: 100 },
    },
},
  scenarios: {
    PocK6UiJourney: {
      executor: 'ramping-vus',
      gracefulStop: '10s',
      stages: [
        { duration: '10s', target: 2 },
        { duration: '20s', target: 2 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'pocK6UiJourney',
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<1000', 'p(100)<5000'],
  },
};

//Custom Metric
export const TrendHomePageReqDuration = new Trend('load_k6_home_page_response_time', true);
export const TrendContactPageReqDuration = new Trend('load_k6_contact_page_response_time', true);
export const TrendNewsPageReqDuration = new Trend('load_k6_news_page_response_time', true);
export const TrendMessagesPageReqDuration = new Trend('load_k6_msg_page_response_time', true);
export const TrendMessagesLoginReqDuration = new Trend('login_k6_msg_page_response_time', true);

export function pocK6UiJourney() {
  let response;

  function userThinkTime() {
    sleep(Math.random() * 2 + 2);
  };

  group('Load k6 Contact Page User Journey', function () {
    response = http.get(`${baseURL}`);
    TrendHomePageReqDuration.add(response.timings.duration);
    const isHomePageReqSuccessful = check(response,
      {
        'Home Page Request Success': () => response.status === 200,
        'Home Page Subtitle Present': (r) => r.body.indexOf('Collection of simple web-pages suitable for load testing.') !== -1,
        'Home Page Request Time < 5secs': () => response.timings.duration < 5000,
        'Home Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isHomePageReqSuccessful) {
      console.error(`Load k6 Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };
    userThinkTime();

    response = http.get(`${baseURL}/contacts.php`);
    TrendContactPageReqDuration.add(response.timings.duration);
    const isContactPageReqSuccessful = check(response,
      {
        'Contact Page Request Success': () => response.status === 200,
        'Contact Page Header Present': (r) => r.body.indexOf('Contact us') !== -1,
        'Contact Page Request Time < 5secs': () => response.timings.duration < 5000,
        'Contact Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isContactPageReqSuccessful) {
      console.error(`Load k6 Contact Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };
    userThinkTime();
  });

  group('Load k6 News Page User Journey', function () {
    response = http.get(`${baseURL}`);
    TrendHomePageReqDuration.add(response.timings.duration);
    const isHomePageReqSuccessful = check(response,
      {
        'Home Page Request Success': () => response.status === 200,
        'Home Page Subtitle Present': (r) => r.body.indexOf('Collection of simple web-pages suitable for load testing.') !== -1,
        'Home Page Request Time < 5secs': () => response.timings.duration < 5000,
        'Home Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isHomePageReqSuccessful) {
      console.error(`Load k6 Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };
    userThinkTime();

    response = http.get(`${baseURL}/news.php`);
    TrendNewsPageReqDuration.add(response.timings.duration);
    const isNewsPageReqSuccessful = check(response,
      {
        'News Page Request Success': () => response.status === 200,
        'News Page Header Present': (r) => r.body.indexOf('In the news') !== -1,
        'News Page Request Time < 5secs': () => response.timings.duration < 5000,
        'News Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isNewsPageReqSuccessful) {
      console.error(`Load k6 News Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };
  });

  group('Load k6 and Login to Message', function () {
    response = http.get(`${baseURL}`);
    TrendHomePageReqDuration.add(response.timings.duration);
    const isHomePageReqSuccessful = check(response,
      {
        'Home Page Request Success': () => response.status === 200,
        'Home Page Subtitle Present': (r) => r.body.indexOf('Collection of simple web-pages suitable for load testing.') !== -1,
        'Home Page Request Time < 5secs': () => response.timings.duration < 5000,
        'Home Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isHomePageReqSuccessful) {
      console.error(`Load k6 Home Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };
    userThinkTime();

    response = http.get(`${baseURL}/my_messages.php`);
    TrendMessagesPageReqDuration.add(response.timings.duration);
    const isMessagesPageReqSuccessful = check(response,
      {
        'Unauthorized Messages Page Request Success': () => response.status === 200,
        'Unauthorized Messages Page Request Time < 5secs': () => response.timings.duration < 5000,
        'Unauthorized Messages Page Request Time < 1secs': () => response.timings.duration < 1000
      });
    console.log("Request Sent: " + response.request.method + ' ' + response.url);
    if (!isMessagesPageReqSuccessful) {
      console.error(`Load k6 Unauthorized Messages Page Request Failed - ${response.url} \nStatus - ${response.status}` +
        `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
    };

    //Only execute login execution if 
    const isMessagePageUnauthorized = check(response,
      {
        'Unauthorized Messages Header Present': (r) => r.body.indexOf('Unauthorized') !== -1
      })
    if (!isMessagePageUnauthorized) {
      console.error(`Messages Page is not Unauthorized \nNot Attempting Login`);
    } else {
      const token = response.html().find('input[name=csrftoken]').first().attr('value');
      response = http.post(`${baseURL}/login.php`,
        { login: 'admin', password: '123', redir: '1', csrftoken: `${token}` });
      TrendMessagesLoginReqDuration.add(response.timings.duration);
      const isMessageLoginReqSuccessful = check(response,
        {
          'Login Messages Request Success': () => response.status === 200,
          'Authorized Messages Header Present': (r) => r.body.indexOf('Welcome, admin!') !== -1,
          'Login Messages Page Request Time < 5secs': () => response.timings.duration < 5000,
          'Login Messages Page Request Time < 1secs': () => response.timings.duration < 1000
        });
      console.log("Request Sent: " + response.request.method + ' ' + response.url);
      if (!isMessageLoginReqSuccessful) {
        console.error(`Load k6 Authorized Messages Page Request Failed - ${response.url} \nStatus - ${response.status}` +
          `\nResponse Time - ${response.timings.duration} \nError Code - ${response.error_code}`);
      };
    }
  });
  sleep(1)
};

export function handleSummary(data) {
  return {
      stdout: textSummary(data, { indent: '→', enableColors: true }),
      'tests/results/report.json': JSON.stringify(data)
  };
};