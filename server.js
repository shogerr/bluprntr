// jshint esversion:6
const WebSocket = require('ws');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const Entities = require('html-entities').XmlEntities;
const axios = require('axios');

const entities = new Entities();
const wss = new WebSocket.Server({ port: 8888 });

require('dotenv').config();

let downloadPath = '.';
if (process.env.BLUPRNTR_DOWNLOAD_PATH) {
  downloadPath = process.env.BLUPRNTR_DOWNLOAD_PATH;
} else if (process.env.HomeDrive) {
  downloadPath = process.env.HomeDrive + process.env.HomePath + "/Downloads/Bluprint";
} else if (process.env.HOME) {
  downloadPath = process.env.HOME + "/Downloads/Bluprint";
}
if (!fs.existsSync(downloadPath)) {
  fs.mkdir(downloadPath, err => { if (err) throw err; });
}
console.log('Downloading to: "' + downloadPath + '".');

let dataFile = 'data/data.json';
let collectionFile = 'data/collection.json';
let titles = fs.existsSync(dataFile) ? new Map(JSON.parse(fs.readFileSync(dataFile, 'utf8'))) : new Map();
let collection = fs.existsSync(collectionFile) ? JSON.parse(fs.readFileSync(collectionFile, 'utf8')) : {};

function downloadResources(resources, path) {
  if (resources.length > 0 && fs.existsSync(path)) {
    let resourcesPath = path + '/resources';
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, err => {
        if (err) throw err;
      });
    }

    fs.readdir(resourcesPath, (err, items) => {
      if (items.length < resources.length) {
        resources.forEach(resource => {
          axios.get(resource.url, {headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'}} )
            .then((response) => {
              resource.title = entities.decode(resource.title);
              let filetype = response.headers['content-type'].match(/\/(.*)$/)[1];
              resource.title = resource.title.replace(/: |:/g, '꞉ ');
              let filename = path + '/resources/' + resource.title + '.' + filetype;
              filename = filename.replace(/"/g, '');
              console.log("Downloading: " + filename);
              fs.writeFileSync(filename, response.data);
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

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let title = JSON.parse(message);
    title.episode = entities.decode(title.episode);
    title.series = entities.decode(title.series);
    let filename = title.series + ' - ' + title.track.toString().padStart(2, '0') + ' - ' + title.episode;
    filename = filename.replace(/: |:/g, '꞉ ');
    filename = filename.replace(/\/|\\/g, '-');
    //filename = filename.replace(/ /g, '.');
    const seriesPath = downloadPath + '/' + title.series.replace(/: |:/g, '꞉ ');
    let id = title.series + "#" + title.episode;
    console.log("saw: " + filename);

    if (titles.has(id) && !titles.get(id).resources_downloaded) {
      titles.set(id, {
        url: title.url,
        resources_downloaded: downloadResources(title.resources, seriesPath)
      });
      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8');
    } else if (!titles.has(id)) {
      console.log("grabbing: " + filename);
      collection[title.series] = collection[title.series] || {};
      collection[title.series][title.episode] = {url: title.url};

      const video = youtubedl(title.url, [], { cwd: __dirname });
      video.on('info', function(info) {
        console.log('Starting download: ' + filename);
      });

      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {
          if (err)
            throw err;
        });
      }
      youtubedl.exec(title.url, ['--output', filename + '.%(ext)s'], { cwd: seriesPath }, function(err, output) {
        if (err)
          console.error(err);
        console.log(output.join('\n'));
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