let port_number = 8888

chrome.storage.sync.get({ port_number: 8888 }, response => {
  port_number = response.port_number
});

const ws = new WebSocket(`ws://localhost:${port_number}`)

ws.onopen = _ => {
  console.log(`Connected to the bluprntr server!`)
  chrome.notifications.create(
    'id1',
    {
      type: 'basic',
      title: 'BluPrntr Connected',
      message:'Happy BluPrinting!',
      iconUrl: chrome.extension.getURL("images/icon128.png"),
      priority:1
    },
    id => {
      console.log(id)
      console.log(chrome.runtime.lastError);
    }
  )
}

function isOpen(socket) { return socket.readyState === socket.OPEN; }

chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true}, tabs => {
      // Check for debug mode.
      chrome.storage.sync.get({ debug_mode: false }, response => {
        if (response.debug_mode)
          console.log(tabs)
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "bluprint" }, response => {
          if (!isOpen(ws)) {
            console.log("[bluprnt] Couldn't connect to server.");
            return;
          }

          let data = {
            series: response.data.series,
            episode: response.data.episode.replace(/: $ |:$/,''),
            track: response.data.track,
            url: request.request.url,
            resources: response.data.resources
          };
          ws.send(JSON.stringify({
            data: data
          }));
        });
      } else {
        console.log("Couldn't find any Bluprint tabs. A Bluprint video must be playing in an active tab.")
      }
    });
  }
});