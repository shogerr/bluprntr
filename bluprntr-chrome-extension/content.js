chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "bluprint") {
    let resources = [];
    Array.from(document.querySelector("ul.VideoPage-materialLinks").getElementsByTagName("a")).forEach(el => {
      if (el.className === 'FileLink download-link') {
        resources.push({
          title: el.innerHTML.trim(),
          url: el.href
        });
      }
    });

    let trackQuery = '#episodes > div[data-playlistitemactive="true"] > div.PlaylistItem-lead > div > div.PlaylistItem-title > span';
    let track = document.querySelector(trackQuery).innerText.trim();
    track = track ? parseInt(track) : -1;

    let data = {
      series: document.querySelector("h2[data-identifier='VideoPage-headline']").innerHTML.trim(),
      episode: document.querySelector("h2[data-identifier='data-video-page-episode-name']").innerHTML.trim(),
      track: track,
      resources: resources.length > 0 ? resources : {},
    };
    sendResponse({
      data: data
    });
 }
 else
  sendResponse({});
});