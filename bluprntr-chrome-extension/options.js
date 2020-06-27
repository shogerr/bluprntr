// Saves options to chrome.storage.
function save_options() {
  var hostname = document.getElementById('hostname').value;
  var portNumber = document.getElementById('port-number').value;
  var debugMode = document.getElementById('debug-mode').checked;
  chrome.storage.sync.set({
    hostname: hostname,
    port_number: portNumber,
    debug_mode: debugMode
  }, () => {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    hostname: 'localhost',
    port_number: 8888,
    debug_mode: false
  }, (items) => {
    document.getElementById('hostname').value = items.hostname;
    document.getElementById('port-number').value = items.port_number;
    document.getElementById('debug-mode').checked = items.debug_mode;
  });
}

// Update filter-text from user selection.
let filterList = document.getElementById('filter-list')
document.getElementById('filter-text').value = filterList.options[filterList.selectedIndex].value;

// Add listeners
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save-options').addEventListener('click', save_options);