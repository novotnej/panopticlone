var getFolderID = function (url) {
  var url = unescape(url);
  if (url.match(/#folderID/)) {
    return url.match(/#folderID="([0-9a-fA-F\-]+)"/)[1];
  } else {
    return null;
  }
};

var getVideos = function (obj) {
  var video, dateInt, date, videos = [];

  for (var i = 0; i < obj.d.Results.length; i += 1) {
    video = obj.d.Results[i];
    videos.push({
      "folderName": video.FolderName,
      "sessionName": video.SessionName,
      "videoURL": video.IosVideoUrl.replace(/\\/g, ""),
      "date": parseInt(video.StartTime.match(/Date\(([0-9]+)\)/i)[1])
    });
  };

  videos.sort(function (a, b) {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  if (videos.length > 0) {
    chrome.runtime.sendMessage({
      "videos": videos
    });
  }
};


// ------ Main

var parseVideos = function (url) {
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
      getVideos(JSON.parse(xhr.responseText));
    } else if (xhr.status !== 200) {
      console.log(xhr.responseText);
    }
  }

  // send request
  xhr.send(JSON.stringify(payload));
};

parseVideos(window.location.href);
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.parseURL) {
    parseVideos(message.parseURL);
  }
});
