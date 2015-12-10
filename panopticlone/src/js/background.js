var createNotification = function (message) {
  // lazy way of sending lots of similar notifications
  chrome.notifications.create(null, {
    "iconUrl": "../../res/img/icon_64.png",
    "message": message,
    "title": "Panopticlone",
    "type": "basic"
  });
};

// -------- Main logic
var videos = [];

chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 255]});
chrome.runtime.onMessage.addListener(
  // when a message is received from the content filter...
  function(message, sender, respond) {
    videos = message.videos;
    var date, filename;
    var title = videos.length.toString() + " videos available on this page";

    // set properties of the badge icon
    chrome.browserAction.setTitle({title: title, tabId: sender.tab.id});
    chrome.browserAction.setBadgeText({text: videos.length.toString(), tabId: sender.tab.id});

    // send a notification
    createNotification([
        "Found",
        videos.length.toString(),
        "videos in \"" + videos[0].folderName + "\".",
        "Click the eye icon to download them."
    ].join(" "));
  }
);

chrome.browserAction.onClicked.addListener(function (sourceTab) {
  // when the icon is clicked...
  if (videos && videos.length > 0) {
    // download each video
    for (var i = 0; i < videos.length; i += 1) {
      sessionName = videos[i].sessionName.replace(/[ ,;:\.]/g, "_").replace(/-+/g, "-");
      filename = [Math.round(videos[i].date / 1000), sessionName].join("--") + ".mp4";

      chrome.downloads.download({
        "conflictAction": "prompt",
        "filename": filename,
        "method": "GET",
        "url": videos[i].videoURL
      })

      // send a notification
      createNotification("Downloading \"" + videos[i].sessionName + "\"...");
    }
  } else {
    createNotification("Couldn't find any videos on this page. Try refreshing!");
  }
});
