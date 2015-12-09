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
    chrome.notifications.create(null, {
      "iconUrl": "../../res/img/icon.png",
      "message": "Found " + videos.length.toString() + " videos on this page. Click the eye icon to download them.",
      "title": "Panopticlone",
      "type": "basic"
    });
  }
);

chrome.browserAction.onClicked.addListener(function (sourceTab) {
  if (videos.length > 0) {
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

      chrome.notifications.create(null, {
        "iconUrl": "../../res/img/icon.png",
        "message": "Downloading \"" + videos[i].sessionName + "\"...",
        "title": "Panopticlone",
        "type": "basic"
      });
    }
  } else {
    chrome.notifications.create(null, {
      "iconUrl": "../../res/img/icon.png",
      "message": "Couldn't find the Panopto folder ID. Try refreshing the page!",
      "title": "Panopticlone",
      "type": "basic"
    });
  }
});
