BluPrntr
========

A Chrome extension (and local server) to save your Bluprint classes while you watch!

Requirements
------------

Ensure both **Node** and **npm** (or yarn) are installed and their installation location in your system path.

#### Windows

Install `node` and `npm`/`yarn` using [Chocolatey](https://chocolatey.org/) or with the Windows installers from the [Node.js](https://nodejs.org/en/) website.

```powershell
choco install nodejs
# Optionally install yarn.
choco install yarn
```

#### Linux

Install `node` and `npm`/`yarn` using a package manager or comparable method.

Instructions
------------

Run `yarn` or `npm` to install the node dependencies and start the server.

```bash
# Install the dependencies (only needed once),
yarn install

# and start the server.
yarn start

# Instead of yarn, npm can be used.
npm install
npm start
```

Now as your brose Bluprnt classes, the videos you watch will be downloaded to your home directory or what has been set with `BLUPRNTR_DOWNLOAD_PATH`.

### Set Download Path

The environment variable `BLUPRNTR_DOWNLOAD_PATH` will be used as the download location.
A `.env` file can also be used.

### Detailed Instructions for Downloading Classes

The following steps will download a class video to disk.

1. Install the Chrome Extension (instructions in next section).
2. Start the Server (`yarn start`).
3. Navigate to a class in Chrome.
4. Open Chrome's _Developer Tools_ and select the network tab.
5. Click a class video.
6. Watch the output in the server that was started.

### Loading the Chrome Extension

1. Navigate to chrome://extensions in your browser. You can also access this page by clicking on the Chrome menu on the top right side of the Omnibox, hovering over **More Tools** and selecting **Extensions**.
2. Check the box next to Developer Mode.
3. Click **Load Unpacked Extension** and select the directory, `bluprntr-chrome-extension/`.

More information: [What are Extensions? - Google Chrome](https://developer.chrome.com/extensions).

Conrtibuting
------------

If you have a nice line or two of code to contribue, please create a [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)!

A tip jar that bears ridiculous transaction fees!
- BTC: 3KYBuFMpu9bfXpT1dm75cDuKkayHxwZyPP
- ETH: 0x075051F7B7264fd6A2a1F2E53E50297b8D731136

Debugging
---------

A minimal test server is provided. It will only catch clicks sent from the Chrome extension and log the details to your terminal.

```bash
# Start the test server.
yarn test-server
```

_To be continued..._