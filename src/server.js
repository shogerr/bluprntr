const axios = require('axios');
const Entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const youtubedl = require('youtube-dl');
const entities = new Entities();
const { green, underline, dim, lightGray, darkGray, white } = require ('ansicolor');
const log = require('ololog').configure({
  locate: false,
  time: true,
  stringify: { maxStringLength: 80 }
});
require('dotenv').config();

bluprntrPort = process.env.BLUPRNTR_PORT ? process.env.BLUPRNTR_PORT : 8888;
const wss = new WebSocket.Server({ port: bluprntrPort });

let downloadPath = '.';
if (process.env.BLUPRNTR_DOWNLOAD_PATH)
  downloadPath = process.env.BLUPRNTR_DOWNLOAD_PATH;
else if (process.env.HomeDrive)
  downloadPath = `${process.env.HomeDrive}${process.env.HomePath}/Downloads/Bluprint`;
else if (process.env.HOME)
  downloadPath = `${process.env.HOME}/Downloads/Bluprint`;

if (!fs.existsSync(downloadPath)) {
  fs.mkdir(downloadPath, { recursive: true }, err => {
    if (err) console.error(err);
  });
}

const dataFile = `${path.resolve(__dirname)}/../data/data.json`;
const collectionFile = `${path.resolve(__dirname)}/../data/collection.json`;
let titles = fs.existsSync(dataFile) ? new Map(JSON.parse(fs.readFileSync(dataFile, 'utf8'))) : new Map();
let collection = fs.existsSync(collectionFile) ? JSON.parse(fs.readFileSync(collectionFile, 'utf8')) : {};

let settings = {
  data_file: dataFile,
  collection_file: collectionFile,
  replace_spaces: false,
  character_map: new Map([
    [':', "\uA789"],
    [' ', "."]
  ])
};

log(underline (`BluPrntr`));
log(`Running on port ${bluprntrPort}.`);
log(`Downloading to, "${downloadPath}".`);
log.darkGray ({settings: settings});

function downloadResources(resources, path) {
  if (resources.length > 0 && fs.existsSync(path)) {
    let resourcesPath = `${path}/resources`;
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, { recursive: true }, err => {
        if (err) console.error(err);
      });
    }

    fs.readdir(resourcesPath, (err, items) => {
      if (err) console.error(err);
      if (items.length < resources.length) {
        resources.forEach(resource => {
          axios.get(resource.url, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
              'encoding': null,
              'Content-Type': 'application/pdf',
              'Accept': 'application/pdf'
              }
            })
            .then((response) => {
              resource.title = entities.decode(resource.title);
              let filetype = response.headers['content-type'].match(/\/(.*)$/)[1];
              resource.title = resource.title.replace(/: |:/g, '꞉ ');
              let filename = `${path}/resources/${resource.title}.${filetype}`;
              filename = filename.replace(/"/g, '');
              log(green ('[downloaded]'), '(resource)', filename);
              try {
                fs.writeFileSync(filename, new Buffer.from(response.data, 'binary'), 'binary');
              } catch (err) {
                console.error(err);
              }
            })
            .catch(err => {
              console.error(err);
            });
        });
      }
    });
  }

  return true;
}

function formatTitleString(s) {
  s = s.replace(/: |:/g, `${settings.character_map.get(':')} `)
       .replace(/\/|\\/g, '-')
  return s
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let title = JSON.parse(message);
    log.maxDepth(3).darkGray ('[caught]', title);
    title.episode = entities.decode(title.episode);
    title.series = entities.decode(title.series);
    let id = title.series + "#" + title.episode;
    title.episode = formatTitleString(title.episode);
    title.series = formatTitleString(title.series);
    let filename = `${title.series} - ${title.track.toString().padStart(2, '0')} - ${title.episode}`;
    if (settings.replace_spaces)
      filename = filename.replace(/ /g, settings.character_map.get('.'));
    const seriesPath = `${downloadPath}/${title.series}`;

    if (titles.has(id) && !titles.get(id).resources_downloaded) {
      titles.set(id, {
        url: title.url,
        resources_downloaded: downloadResources(title.resources, seriesPath)
      });
      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8');
    } else if (!titles.has(id)) {
      log(green ('[downloading]'), '(video)', { filename: filename, url: title.url });
      collection[title.series] = collection[title.series] || {};
      collection[title.series][title.episode] = {url: title.url};

      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {
          if (err)
            log.error(err);
        });
      }
      youtubedl.exec(title.url, ['--output', filename + '.%(ext)s'], { cwd: seriesPath }, (err, output) => {
        if (err) console.error(err);
        log(green ('[finished]'), filename, '(' + output[output.length-1].replace(/\[download\] /, '').trim() + ')');
      });

      titles.set(id, {
        url: title.url,
        resources_downloaded: downloadResources(title.resources, seriesPath)
      });

      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8');
      fs.writeFileSync(collectionFile, JSON.stringify(collection, null, 2), 'utf-8');
    }
  });
});