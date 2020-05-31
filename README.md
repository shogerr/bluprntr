BluPrntr
========

Requirements
------------

### Install Node.js and npm

Make sure Node and npm are installed and in your system path. General instructions for Windows and Linux are provided.

#### Windows

Using [Chocolatey](https://chocolatey.org/):

```powershell
choco install nodejs
```

#### Linux

Install Node.js using a package manager, or comparable method.

Install Dependencies
--------------------

Run Yarn or `npm` to install the node dependencies.

```bash
yarn install
# or
npm install
```

Instructions to Run
-------------------

The environment variable `BLUPRNTR_DOWNLOAD_PATH` will be used as the download location.
A `.env` file can also be used.

The following steps will download a class video to disk.

1. Install the Chrome Extension (instructions in next section).
2. Start the Server: `node server.js`.
3. Navigate to a class in Chrome.
4. Open Chrome's _Developer Tools_ and select the network tab.
5. Click a class video.
6. Watch the output in the server that was started.

### Loading the Chrome Extension

1. Navigate to chrome://extensions in your browser. You can also access this page by clicking on the Chrome menu on the top right side of the Omnibox, hovering over **More Tools** and selecting **Extensions**.
2. Check the box next to Developer Mode.
3. Click **Load Unpacked Extension** and select the directory, `bluprntr-chrome-extension/`.

More information: [What are Extensions? - Google Chrome](https://developer.chrome.com/extensions).