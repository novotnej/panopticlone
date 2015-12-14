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

var createDownloadFunction = function (session) {
  return function () {
    // make download parameters
    folderName = sanitise(session.folderName);
    sessionName = sanitise(session.sessionName);
    filename = Math.round(session.date / 1000) + "-" + sessionName + ".mp4";

    // send the download request
    chrome.downloads.download({
      "conflictAction": "prompt",
      "filename": folderName + "/" + filename,
      "method": "GET",
      "url": session.videoURL
    });

    // send a notification
    createNotification("Downloading \"" + session.sessionName + "\"...");

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

var sanitise = function (str) {
  // sanitise file names/directory names
  return str.replace(/[ ,;:\/\\\.]/g, "_").replace(/(-|_)+/g, "$1");
};

var createNotification = function (message, title) {
  // lazy way of sending lots of similar notifications
  if (! title) {
    title = "Panopticlone";
  }

  chrome.notifications.create(null, {
    "iconUrl": "../../res/img/icon_64.png",
    "message": message,
    "title": title,
    "type": "basic"
  });
};

var fail = function (message) {
  document.getElementById("session_list").innerHTML = "<h3>" + message + "</h3>";
};


// --------- Render popup

var renderPage = function (sessions) {
  var sessionList = document.getElementById("session_list");

  if (sessions.length > 0) {
    var downloadFunction, downloadFunctions = [];

    createHeadingHTML(sessions[0].folderName); // add heading

    for (var i = 0; i < sessions.length; i += 1) {
      sessionList.appendChild(document.createElement("hr")); // add horizontal rule

      // make the download function and append to list
      downloadFunction = createDownloadFunction(sessions[i]);
      downloadFunctions.push(downloadFunction);

      // add session name and download button
      sessionList.appendChild(createSessionHTML(sessions[i], downloadFunction));
    }

    // add function to download all lectures
    document.getElementById("download_all").onclick = function () {
      for (var i = 0; i < downloadFunctions.length; i += 1) {
        downloadFunctions[i]();
      }
    };
  } else {
    fail("Sorry, I couldn't find any sessions on this page. :(");
  }
};

// --------- Parse response from Panopto

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
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  return sessions;
};


// --------- Message handling

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.success) {
    renderPage(getSessions(message.panoptoResponse));
  } else {
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
