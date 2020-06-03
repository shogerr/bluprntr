const ws = new WebSocket('ws://localhost:8888');

function isOpen(socket) { return socket.readyState === socket.OPEN; }

chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true, audible: true}, tabs => {
      //TODO: Ensure the following routine isn't the cause of page slow down.
      // Check if the debugging mode is enabled.
      /*
      var port = chrome.runtime.connect({name: "debugging"});
      port.postMessage({debug: true});
      port.onMessage.addListener(msg => {
        if (msg.debug)
          console.log(tabs);
      });
      */
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getDOM"}, response => {
          if (!isOpen(ws))
            return;

          ws.send(JSON.stringify({
            series: response.series,
            episode: response.episode.replace(/: $ |:$/,''),
            track: response.track,
            url: request.request.url,
            resources: response.resources
          }));
        });
      } else {
        //console.log("Couldn't find any Bluprint tabs. Try unmuting and selecting the tab.");
      }
    });
  }
});