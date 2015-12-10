var getFolderID = function (url) {
  var url = unescape(url);
  if (url.match(/#folderID/)) {
    return url.match(/#folderID="([0-9a-fA-F\-]+)"/)[1];
  } else {
    return null;
  }
};

var getSessions = function (obj) {
  var video, dateInt, date, sessions = [];

  for (var i = 0; i < obj.d.Results.length; i += 1) {
    video = obj.d.Results[i];
    sessions.push({
      "folderName": video.FolderName,
      "sessionName": video.SessionName,
      "videoURL": video.IosVideoUrl.replace(/\\/g, ""),
      "date": parseInt(video.StartTime.match(/Date\(([0-9]+)\)/i)[1])
    });
  };

  sessions.sort(function (a, b) {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  if (sessions.length > 0) {
    chrome.runtime.sendMessage({
      "sessions": sessions
    });
  }
};


// ------ Main

var parseSessions = function (url) {
  // construct URL
  var postURL = location.protocol + "//" + window.location.hostname;
  postURL += "/Panopto/Services/Data.svc/GetSessions";

  // construct request to API
  var payload = {
    "queryParameters": {
      "maxResults": 9999,
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
      getSessions(JSON.parse(xhr.responseText));
    } else if (xhr.status !== 200) {
      console.log(xhr.responseText);
    }
  }

  // send request
  xhr.send(JSON.stringify(payload));
};

parseSessions(window.location.href);
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.parseURL) {
    parseSessions(message.parseURL);
  }
});
