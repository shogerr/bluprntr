'use strict'

const fs = require('fs')
const WebSocket = require('ws')
const youtubedl = require('youtube-dl')
const {bright, underline, blue, green} = require('ansicolor')
const log = require('ololog').configure({
  locate: false,
  time: true,
  stringify: { maxStringLength: 80 },
  tag: true
})
const helpers = require('./helpers')
const Entities = require('html-entities').XmlEntities
const entities = new Entities()

// Use a .env if present
require('dotenv').config()

// Clean the ytdl binary path for asar
youtubedl.setYtdlBinary(
  youtubedl.getYtdlBinary().replace("app.asar", "app.asar.unpacked")
)

// Set the download path to the user's homedir, unless manually set.
let downloadPath = '.'
if (process.env.BLUPRNTR_DOWNLOAD_PATH)
  downloadPath = process.env.BLUPRNTR_DOWNLOAD_PATH
else
  downloadPath = `${require('os').homedir()}/Downloads/Bluprint`

// Application Settings
let settings = {
  port: process.env.BLUPRNTR_PORT ? process.env.BLUPRNTR_PORT : 8888,
  download_path: downloadPath,
  get data_path() { return `${this.download_path}/data` },
  get data_file() { return `${this.data_path}/data.json` },
  get collection_file() { return `${this.data_path}/collection.json` },
  save_data_file: true,
  save_collection_file: false,
  replace_spaces: false,
  character_map: new Map([
    [':', "\uA789"],
    [' ', "."]
  ])
};

// Performs the application setup
function performSetup(settings) {
  const LoadOrCreateData = (filepath, data) => {
    if (fs.existsSync(filepath)) {
      try {
        let contents = fs.readFileSync(filepath, 'utf8');
        return contents;
      } catch (e) {
        log.red (`There was a problem loading ${filepath}. Please check the integrity of its contents.`);
        log.warn (`Disabling saving`);
        log.error (e);
        return undefined;
      }
    } else {
      try {
        log.yellow.info (`Creating "${filepath}".`)
        fs.writeFileSync(filepath, data)
        return true
      } catch (e) {
        log.error (`Couldn't create "${filepath}".`, e)
        return undefined
      }
    }
  };
  const loadFileData = (filepath, data) => {
    let loaded = LoadOrCreateData(filepath, JSON.stringify(data));
    if (loaded === undefined) return [false, JSON.parse(data)];
    if (loaded === true) return [true, data];
    return [true, JSON.parse(loaded)];
  };
  const findFolderOrCreate = folderPath => {
    if (!fs.existsSync(folderPath)) {
      log.warn (`The path "${folderPath}" was not found.`);
      log.info ('Bluprntr has', bright ('created'), `the folder, "${folderPath}".`);
      fs.mkdirSync(folderPath, { recursive: true }, err => {
        if (err) log.red.error (err);
      })
    }
  };

  findFolderOrCreate(settings.download_path);
  findFolderOrCreate(settings.data_path);
  let titles_ = loadFileData(settings.data_file, [...new Map()]);
  let collection_ = loadFileData(settings.collection_file, {});
  if (!titles_[0]) settings.save_data_file = false;
  if (!collection_[0]) settings.save_collection_file = false;

  return {titles: new Map(titles_[1]), collection: collection_[1]}
}

// Print the header message.
log (underline (`BluPrntr`))
log.info (`Running on port ${settings.port}.`)
log.info (`Downloading to: "${settings.download_path}".`)
log.yellow.info (`Application data can be found in, '${settings.data_path}'.`)
log.darkGray.info ({settings: settings})

// TODO refactor to fix this short-circuiting.
let data = performSetup(settings)

var wss = new WebSocket.Server({ port: settings.port })
// Handle WebSocket errors.
wss.on('error', async (event) => {
  log.error (event)
});
// Manage a WebSocket connection.
wss.on('connection', ws => {
  log ('The', blue ('Bluprint'), 'Chrome extension has connected!')
  // Log that the connection has closed
  ws.on('close', (closeReason, description) => {
    log.darkGray.debug (closeReason, description)
    log ('The', blue ('Bluprint'), 'Chrome extension has closed.')
  });
  // Handle the incoming client message.
  ws.on('message', message => {
    const formatTitleString = s => {
      return s.replace(/: |:/g, `${settings.character_map.get(':')} `)
              .replace(/\/|\\/g, '-');
    };
    const formatString = s => {
      return formatTitleString(entities.decode(s));
    };

    // Parse the message.
    let title = JSON.parse(message).data
    log.maxDepth(3).darkGray.info ('[caught]', title)

    // TODO Is this formatting really necessary?
    title.episode = title.episode.replace(/: $ |:$/,'')

    // Create an ID for logging
    let id = entities.decode(title.series) + "#" + entities.decode(title.episode)
    // Perform formatting on strings for title
    title.episode = formatString(title.episode)
    title.series = formatString(title.series)

    // Set a filename
    let filename = `${title.series} - ${title.track.toString().padStart(2, '0')} - ${title.episode}`
    // Remove spaces if necessary
    if (settings.replace_spaces)
      filename = filename.replace(/ /g, settings.character_map.get('.'))

    // Set a folder for the download
    const seriesPath = `${downloadPath}/${title.series}`

    // If the title has been downloaded, but not the resources, then download the resources only.
    if (data.titles.has(id) && !data.titles.get(id).resources_downloaded) {
      data.titles.set(id, {
        url: title.url,
        resources_downloaded: helpers.downloadResources(title.resources, seriesPath, settings)
      });
      if (settings.save_data_file)
        fs.writeFileSync(settings.data_file, JSON.stringify([...data.titles], null, 2), 'utf-8');
    }
    // Otherwise, download if it's a new title.
    else if (!data.titles.has(id)) {
      const logToCollection = (title, collection) => {
        collection[title.series] = collection[title.series] || {};
        collection[title.series][title.episode] = {url: title.url};
        collection[title.series].resources = title.resources;
      };

      log(green ('[downloading]'), '(video)', { filename: filename, url: title.url })

      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {
          if (err) log.red.error (err);
        });
      }

      const ffmpeg = { path: require('ffmpeg-static') };
      youtubedl.exec(title.url,
        ['--output', filename + '.%(ext)s', '--ffmpeg-location', ffmpeg.path],
        { cwd: seriesPath },
        (err, output) => {
        if (err) {
          log.red (err.message);
          log.red.error (err);
        }
        else
          log (green ('[finished]'), filename, '(' + output[output.length-1].replace(/\[download\] /, '').trim() + ')');
      });

      data.titles.set(id, {
        url: title.url,
        resources_downloaded: helpers.downloadResources(title.resources, seriesPath, settings)
      });

      if (settings.save_data_file) {
        fs.writeFileSync(settings.data_file, JSON.stringify([...data.titles], null, 2), 'utf-8', err => {
          if (err) log.error (err);
        });
      }
      if (settings.save_collection_file) {
        logToCollection(title, data.collection)
        fs.writeFileSync(settings.collection_file, JSON.stringify(data.collection, null, 2), 'utf-8', err => {
          if (err) log.error (err);
        });
      }
    }
  });
});


module.exports = { downloadPath,  data: data }