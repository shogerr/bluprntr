let settings = {
  port_number: 8888,
  hostname: 'localhost',
  log_prefix: '[bluprntr]'
};

chrome.storage.sync.get(
  {
   hostname: settings.hostname,
   port_number: settings.port_number
  },
  response => {
    settings.hostname = response.hostname
    settings.port_number = response.port_number
  }
);

const ws = new WebSocket(`ws://${settings.hostname}:${settings.port_number}`);

ws.onopen = event => {
  console.info(settings.log_prefix, `Connected to server!`)
  // Notify the user of the connection with a notification.
  chrome.notifications.create(
    'bprnt1',
    {
      type: 'basic',
      title: 'BluPrntr is Connected',
      message:'Happy BluPrinting!',
      iconUrl: chrome.extension.getURL("images/icon128.png"),
      priority: 1
    },
    id => {
      if (chrome.runtime.lastError !== undefined)
        console.error(chrome.runtime.lastError);
    }
  );
};
ws.onclose = event => {
  console.info(settings.log_prefix, event)
  console.log(settings.log_prefix, 'Connection closed.')
};
ws.onerror = error => {
  console.error(settings.log_prefix, 'WebSocket error:', error);
};

// Active tab listener filtering on url substrings.
chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true}, tabs => {
      // Check for debug mode.
      chrome.storage.sync.get({ debug_mode: false }, response => {
        if (response.debug_mode)
          console.debug(tabs);
      });

      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "bluprint" }, response => {
          if (ws.readyState !== ws.OPEN) {
            console.info(settings.log_prefix, "Couldn't connect to the server.");
            return;
          }
          let data = {
            series: response.data.series,
            episode: response.data.episode,
            track: response.data.track,
            url: request.request.url,
            resources: response.data.resources
          };
          // Send data
          ws.send(JSON.stringify({
            data: data
          }));
        });
      } else {
        console.warn(settings.log_prefix, "Couldn't find any Bluprint tabs. A Bluprint video must be playing in an active tab.")
      }
    });
  }
});