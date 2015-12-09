var createNotification = function (message) {
  chrome.notifications.create(null, {
    "iconUrl": "../../res/img/icon_64.png",
    "message": message,
    "title": "Panopticlone",
    "type": "basic"
  });
};

var videos = [];

chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 255]});
chrome.runtime.onMessage.addListener(
  function(message, sender, respond) {
    videos = message.videos;
    var date, filename;
    var title = videos.length.toString() + " videos available on this page";

    // set properties of the badge icon
    chrome.browserAction.setTitle({title: title, tabId: sender.tab.id});
    chrome.browserAction.setBadgeText({text: videos.length.toString(), tabId: sender.tab.id});

    // send a notification
    createNotification("Found " + videos.length + " videos on this page. Click the eye icon to download them.");
  }
);

chrome.browserAction.onClicked.addListener(function (sourceTab) {
  if (videos && videos.length > 0) {
    // download videos
    for (var i = 0; i < videos.length; i += 1) {
      sessionName = videos[i].sessionName.replace(/[ ,;:\.]/g, "-").replace(/-+/g, "-");
      filename = [videos[i].date, sessionName].join("--") + ".mp4";

      chrome.downloads.download({
        "conflictAction": "prompt",
        "filename": filename,
        "method": "GET",
        "url": videos[i].videoURL
      })

      createNotification("Downloading \"" + videos[i].sessionName + "\"...");
    }
  } else {
    createNotification("Couldn't find the Panopto folder ID. Try refreshing the page!");
  }
});
