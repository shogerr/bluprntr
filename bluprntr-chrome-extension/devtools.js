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

// Create the WebSocket client.
const ws = new WebSocket(`ws://${settings.hostname}:${settings.port_number}`);

// Handle events
ws.onopen = event => {
  console.info(settings.log_prefix, `Connected to server!`, event)
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
        console.warn(settings.log_prefix, "Notification Error:", id, chrome.runtime.lastError);
    }
  );
};
ws.onclose = event => {
  console.log(settings.log_prefix, 'Connection closed.', event);
  if (!event.wasClean)
    console.warn(settings.log_prefix, 'Start or restart the server, and re-open the Developer Tools.');
};
ws.onevent = event => {
  if (ws.readyState == 1)
    console.info(settings.log_prefix, 'WebSocket Error:', event);
  else
    console.warn(settings.log_prefix, 'WebSocket Error:', event);
};

// Active tab listener filtering on url substrings.
chrome.devtools.network.onRequestFinished.addListener(request => {
  if (request.request.url.includes('k.m3u8')) {
    chrome.tabs.query({active:true}, tabs => {
      // Check for debug mode.
      chrome.storage.sync.get({ debug_mode: false }, response => {
        if (response.debug_mode) console.debug(tabs);
      });

      if (tabs.length > 0) {
        // Parse the DOM of the page.
        chrome.tabs.sendMessage(tabs[0].id, { action: "bluprint" }, response => {
          if (ws.readyState !== ws.OPEN)
            console.info(settings.log_prefix, "Server was not ready.");
          else {
            ws.send(JSON.stringify({
              data: {
                series: response.data.series,
                episode: response.data.episode,
                track: response.data.track,
                url: request.request.url,
                resources: response.data.resources
              }
            }));
          }
        });
      } else {
        console.warn(settings.log_prefix, "Couldn't find any Bluprint tabs. A Bluprint video must be playing in an active tab.")
      }
    });
  }
});