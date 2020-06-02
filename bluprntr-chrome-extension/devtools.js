// jshint esversion:6
const ws = new WebSocket('ws://localhost:8888');

function isOpen(socket) { return socket.readyState === socket.OPEN; }

chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true, audible: true}, tab => {
      // Check if the debugging mode is enabled.
      var port = chrome.runtime.connect({name: "debugging"});
      port.postMessage({debug: true});
      port.onMessage.addListener(msg => {
        if (msg.debug)
          console.log(tab);
      });
      if (tab != undefined) {
        chrome.tabs.sendMessage(tab[0].id, {action: "getDOM"}, response => {
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
        console.log("Couldn't find any Bluprint tabs. Try unmuting and selecting the tab.");
      }
    });
  }
});