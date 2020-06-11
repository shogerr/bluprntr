BluPrntr
========

A Chrome extension (and local server) that saves your Bluprint classes to disk.
Works on a Windows, Linux or Mac machine.

Requirements
------------

Install [FFmpeg](https://ffmpeg.org/)* and ensure `ffmpeg`, `ffplay` and `ffprobe` can be found from the system path.

Ensure both **Node** and **npm** (or yarn) are installed and that their installation location is in your system path.

### Windows

Use the Windows installers from the Node.js [website](https://nodejs.org/en/).

_-or-_

Install `node` and `npm`/`yarn` using [Chocolatey](https://chocolatey.org/)**\***:

```powershell
# Install FFmpeg
choco install ffmpeg

# Install Node.js
choco install nodejs

# Optionally install yarn.
choco install yarn
```

**\*** `choco` is the preferred installation method.

### Linux

Install `node` and `npm`/`yarn` using a package manager or comparable method.

### Mac

For Mac, follow the instructions in the guide: [Installing Node.js® and NPM on Mac](https://treehouse.github.io/installation-guides/mac/node-mac.html),
or use the Mac installer from [Node.js](https://nodejs.org/en/).

Instructions
------------

The `start-bluprntr.sh`/`ps1` scripts can be used to start the server.

Linux and Mac require you provide execute permissions to a file before it can be ran as a script. Instructions for running scripts in each OS:

- [Linux](https://www.cyberciti.biz/faq/howto-run-a-script-in-linux/)
- [Mac](https://support.apple.com/guide/terminal/make-a-file-executable-apdd100908f-06b3-4e63-8a87-32e71241bab4/mac)
- [Windows](https://ss64.com/ps/syntax-run.html)

If you are not familiar with the command line, please see this [codedemy article](https://www.codecademy.com/articles/command-line-setup).

The explicit commands needed to run the application's server are provided below.

Please note that all of the `npm`/`yarn` commands are to be run from the folder where BluPrntr was extracted or cloned.

```bash
# Navigate to the bluprntr folder.
cd ./bluprntr

# Install the dependencies (only needed once),
yarn install

# and start the server.
yarn start

# Instead of yarn, npm can be used.
npm install
npm start
```

Now as you browse Bluprint classes, the videos you watch will be downloaded to your home directory or what has been set with `BLUPRNTR_DOWNLOAD_PATH`.

### Set Download Path

The environment variable `BLUPRNTR_DOWNLOAD_PATH` will be used as the download location.
A `.env` file can also be used.

### Detailed Instructions for Downloading Classes

The following steps will download a class video to disk.

1. Install the Chrome Extension (instructions in next section).
2. Start the Server (run `yarn start` from the git project folder).
3. Navigate to a class in Chrome.
4. Open Chrome's _Developer Tools_ and select the network tab.
5. Click a class video.
6. Watch the output in the server that was started.

### Loading the Chrome Extension

1. Navigate to chrome://extensions in your browser. You can also access this page by clicking on the Chrome menu on the top right side of the Omnibox, hovering over **More Tools** and selecting **Extensions**.
2. Check the box next to Developer Mode.
3. Click **Load Unpacked Extension** and select the directory, `bluprntr-chrome-extension/`.

More information: [What are Extensions? - Google Chrome](https://developer.chrome.com/extensions).

Contributing
------------

If you have a nice line or two of code to contribute, please create a [pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)!

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
