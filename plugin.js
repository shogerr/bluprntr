//var socket = io.connect('ws://localhost:8888'); // your url for the request
const ws = new WebSocket('ws://localhost:8888');

function isOpen(socket) { return socket.readyState === socket.OPEN }

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true, audible: true}, function(tab) {
      chrome.tabs.sendMessage(tab[0].id, {action: "getDOM"}, function(response) {
        console.log(response);
        if (!isOpen(ws)) return;
        ws.send(JSON.stringify({
          series: response.series,
          episode: response.episode.replace(/: $ |:$/,''),
          track: response.track,
          url: request.request.url,
          resources: response.resources
        }));
      });
    });
  }

  /*
  var data = {};

  // get request data
  data.url = request.request.url;
  data.size = request.response.content.size;
  data.type = request.response.content.mimeType;
  data.time = request.time;
  data.start = request.startedDateTime;

  console.log(data);
  */
  // send data to server
    //socket.emit('data', data);
});