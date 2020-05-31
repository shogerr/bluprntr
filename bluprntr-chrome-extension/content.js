// jshint esversion:6

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "getDOM") {
    let resources = [];
    Array.from(document.querySelector("ul.VideoPage-materialLinks").getElementsByTagName("a")).forEach(el => {
      if (el.className === 'FileLink download-link') {
        resources.push({
          title: el.innerHTML.trim(),
          url: el.href
        });
      }
    });

    let track = document.querySelector('#episodes > div[data-playlistitemactive="true"] > div.PlaylistItem-lead > div > div.PlaylistItem-title > span').innerText.trim();
    track = parseInt(track);

    sendResponse({
      series: document.querySelector("h2[data-identifier='VideoPage-headline']").innerHTML.trim(),
      episode: document.querySelector("h2[data-identifier='data-video-page-episode-name']").innerHTML.trim(),
      track: track,
      resources: resources.length > 0 ? resources : {},
      debug: {}
    });
 }
 else
  sendResponse({}); // Send nothing..
});