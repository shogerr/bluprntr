let DEBUGGING = false;
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "BLUPRNTR_DEBUG",
  title: "Debug Mode",
  contexts: ["browser_action"],
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "BLUPRNTR_DEBUG") {
    // Execute foo using tab id
    DEBUGGING = !DEBUGGING;
    logDebuggingState(tab.id);
  }
});

chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name == "debugging");
  port.onMessage.addListener(msg => {
    if (msg.debug)
      port.postMessage({debug: DEBUGGING});
  });
});

const logDebuggingState = (tabId) => {
  console.log(`BluPrntr debugging is ${DEBUGGING?"enabled":"disabled"}.`);
};