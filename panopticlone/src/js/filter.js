
// --------- Interaction with Panopto API

var getFolderID = function (url) {
  var url = unescape(url);
  if (url.match(/#folderID/)) {
    return url.match(/#folderID="([0-9a-fA-F\-]+)"/)[1];
  } else {
    return null;
  }
};


var parseSessions = function (url) {
  // construct URL
  var postURL = url.substring(0, url.indexOf("/", url.indexOf("//") + 2));
  postURL += "/Panopto/Services/Data.svc/GetSessions";

  // construct request to API
  var payload = {
    "queryParameters": {
      "maxResults": 999,
      "folderID": getFolderID(url),
    }
  }

  // create request
  var xhr = new XMLHttpRequest();
  xhr.open("POST", postURL, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // set up callback
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status == 200) {
      chrome.runtime.sendMessage(null, {
        "panoptoResponse": JSON.parse(xhr.responseText),
        "success": true
      });
    } else if (xhr.status !== 200) {
      console.log(xhr.responseText);
      chrome.runtime.sendMessage(null, {
        "success": false
      });
    }
  }

  // send request
  xhr.send(JSON.stringify(payload));
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.parseURL) {
    var sessions = parseSessions(message.parseURL);
  }
});
