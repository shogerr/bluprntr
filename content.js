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

    let tracks = document.querySelector('#episodes > div[data-playlistitemactive="true"] > div.PlaylistItem-lead > div > div.PlaylistItem-title > span').innerText.trim();
    tracks = parseInt(tracks);
    // > div.PlaylistItem-lead > div > div.PlaylistItem-title > span");
    //div[data-playlistitemplaying=true]
    //tracks = tracks.querySelector("div.PlaylistItem-title");
    //.getElementsByTagName('span')[0].innerText;
    console.log(tracks);
    let track = 4;

    sendResponse({
      series: document.querySelector("h2[data-identifier='VideoPage-headline']").innerHTML.trim(),
      episode: document.querySelector("h2[data-identifier='data-video-page-episode-name']").innerHTML.trim(),
      track: tracks.toString(),
      resources: resources.length > 0 ? resources : {},
      debug: JSON.stringify(tracks)
    });
 }
 else
  sendResponse({}); // Send nothing..
});