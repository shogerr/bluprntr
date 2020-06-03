const ws = new WebSocket('ws://localhost:8888');

function isOpen(socket) { return socket.readyState === socket.OPEN; }

chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true}, tabs => {
      chrome.storage.sync.get({ debug_mode: false }, response => {
        if (response.debug_mode)
          console.log(tabs);
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getDOM" }, response => {
          if (!isOpen(ws)) {
            console.log("[bluprnt] Couldn't connect to server.");
            return;
          }

          ws.send(JSON.stringify({
            series: response.series,
            episode: response.episode.replace(/: $ |:$/,''),
            track: response.track,
            url: request.request.url,
            resources: response.resources
          }));
        });
      } else {
        console.log("Couldn't find any Bluprint tabs. Try unmuting and selecting the tab.");
      }
    });
  }
});