// --------- HTML generation

var createHeadingHTML = function (heading, sessions) {
  var container, headingNode, headingNodeText,
      sessionButton, sessionButtonText;

  container = document.getElementById("heading-container");

  // set title
  headingNode = document.getElementById("heading");
  headingNodeText = document.createTextNode(heading);

  // set download link
  sessionButton = document.createElement("button");
  sessionButtonText = document.createTextNode("Download All");
  sessionButton.id = "download_all";
  sessionButton.type = "button";

  // add nodes to parents
  headingNode.appendChild(headingNodeText);
  sessionButton.appendChild(sessionButtonText);
  container.appendChild(headingNode);
  container.appendChild(sessionButton);
};

var download = function (sessions) {
  // this allows downloads to be queued by the background script
  chrome.runtime.sendMessage(null, {
    "download": sessions
  });
};

var createDownloadFunction = function (session) {
  return function () {
    download([session]);
    return false; // prevent default action
  };
};

var createSessionHTML = function (session, downloadFunction) {
  var sessionNode, sessionNodeText,
      sessionButton, sessionButtonText;

  // set name
  sessionNode = document.createElement("p");
  sessionNodeText = document.createTextNode(session.sessionName);
  sessionNode.appendChild(sessionNodeText);

  // set download link
  sessionButton = document.createElement("button");
  sessionButtonText = document.createTextNode("Download");
  sessionButton.className = "download";
  sessionButton.type = "button";

  // set download link function
  sessionButton.onclick = downloadFunction;

  sessionButton.appendChild(sessionButtonText);
  sessionNode.appendChild(sessionButton);

  return sessionNode;
};


// --------- Helper functions

var fail = function (message) {
  document.getElementById("session_list").innerHTML = "<h3>" + message + "</h3>";
};


// --------- Render popup

var renderPage = function (sessions) {
  var sessionList = document.getElementById("session_list");

  if (sessions.length > 0) {
    var downloadFunction,
        downloads = [];

    createHeadingHTML(sessions[0].folderName); // add heading

    for (var i = 0; i < sessions.length; i += 1) {
      sessionList.appendChild(document.createElement("hr")); // add horizontal rule

      // make the download function and append to list
      downloadFunction = createDownloadFunction(sessions[i]);
      downloads.push(sessions[i]);

      // add session name and download button
      sessionList.appendChild(createSessionHTML(sessions[i], downloadFunction));
    }

    // add function to download all lectures
    document.getElementById("download_all").onclick = function () {
      download(downloads);
    };
  } else {
    fail("Sorry, I couldn't find any sessions on this page. :(");
  }
};


// --------- Parse response from Panopto

var getSessions = function (obj) {
  var video, url, dateInt, date, sessions = [];

  for (var i = 0; i < obj.d.Results.length; i += 1) {
    video = obj.d.Results[i];
    if (video.IosVideoUrl && video.IosVideoUrl.length > 0) {
      url = video.IosVideoUrl.replace(/\\/g, "");
    } else {
      url = video.ViewerUrl.split("Panopto")[0];
      url += "Panopto/Podcast/Embed/" + video.DeliveryID + ".mp4";
    }

    sessions.push({
      "folderName": video.FolderName,
      "sessionName": video.SessionName,
      "videoURL": url,
      "date": parseInt(video.StartTime.match(/Date\(([0-9]+)\)/i)[1])
    });
  };

  sessions.sort(function (a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  return sessions;
};


// --------- Message handling

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.panoptoResponse !== undefined) {
    renderPage(getSessions(message.panoptoResponse));
  } else if (message.panoptoResponse === false) {
    fail("Sorry, there was an error talking to Panopto. :(");
  }
});


// --------- Start!

window.onload = function () {
  // get current tab, and send the request to get video URLs
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs[0].url.indexOf("Panopto") !== -1) {
      chrome.tabs.sendMessage(tabs[0].id, {
        "parseURL": tabs[0].url
      });
    } else {
      fail("This doesn't look like a Panopto page. :(");
    }
  });
};
