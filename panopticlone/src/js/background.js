// sanitise file names/directory names
var sanitise = function (str) {
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


// -------- Main logic
var sessions = []; // holds the video list

chrome.tabs.onUpdated.addListener(
  // when a tab changes, look it for sessions
  function (id, changeInfo, tab) {
    if (changeInfo.url) {
      chrome.tabs.sendMessage(id, {
        "parseURL": changeInfo.url
      });
    }
  }
);

chrome.runtime.onMessage.addListener(
  // when a message is received from the content filter...
  function(message, sender, respond) {
    if (message.sessions && message.sessions !== undefined) {
      sessions = message.sessions;

      // pluralise "session"/"sessions"
      var plural = "session";
      if (sessions.length > 1) {
        plural += "s";
      }

      // set properties of the badge icon
      chrome.browserAction.setBadgeText({text: sessions.length.toString(), tabId: sender.tab.id});

      // send a notification
      createNotification([
          "Found",
          sessions.length.toString(),
          plural, "in this folder.",
          "\nClick the Panopticlone icon in the menu bar to begin downloading."
      ].join(" "), sessions[0].folderName);
    }
  }
);

chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 255]});
chrome.browserAction.onClicked.addListener(function (sourceTab) {
  // when the icon is clicked...
  if (sessions && sessions.length > 0) {
    // download each video
    for (var i = 0; i < sessions.length; i += 1) {
      folderName = sanitise(sessions[i].folderName);
      sessionName = sanitise(sessions[i].sessionName);
      filename = [Math.round(sessions[i].date / 1000), sessionName].join("-") + ".mp4";

      chrome.downloads.download({
        "conflictAction": "prompt",
        "filename": folderName + "/" + filename,
        "method": "GET",
        "url": sessions[i].videoURL
      })

      // send a notification
      createNotification("Downloading \"" + sessions[i].sessionName + "\"...");
    }
  } else {
    createNotification("Couldn't find any sessions on this page. Try refreshing!");
  }
});
