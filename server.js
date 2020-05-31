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
  fs.mkdir(downloadPath, err => {if (err) throw err;});
}
console.log('Downloading to: "' + downloadPath + '".');

let dataFile = 'data/data.json';
let collectionFile = 'data/collection.json';
let titles = fs.existsSync(dataFile) ? new Map(JSON.parse(fs.readFileSync(dataFile, 'utf8'))) : new Map();
let collection = fs.existsSync(collectionFile) ? JSON.parse(fs.readFileSync(collectionFile, 'utf8')) : {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
    let title = JSON.parse(message);
    // Ensure the highest quality is always downloaded.
    //title.url = title.url.replace(/\d\d\d\dk.m3u8$/, '4100k.m3u8');
    title.episode = entities.decode(title.episode);
    title.series = entities.decode(title.series);
    console.log("saw: " + title);
    let id = title.series + "#" + title.episode;
    if (!titles.has(id)) {
      titles.set(id, title.url);
      collection[title.series] = collection[title.series] || {};
      collection[title.series][title.episode] = {url: title.url};

      const video = youtubedl(title.url, [], { cwd: __dirname });

      let filename = title.series + ' - ' + title.track.toString().padStart(2, '0') + ' - ' + title.episode;
      console.log("grabbing: " + filename);

      // Will be called when the download starts.
      video.on('info', function(info) {
        console.log('Starting download: ' + filename);
        //console.log(JSON.stringify(info));
      });

      // Replace ':' with unicode character.
      filename = filename.replace(/: |:/g, '꞉ ');
      filename = filename.replace(/\/|\\/g, '-');
      // Replace spaces -> .
      //filename = filename.replace(/ /g, '.');

      let metadata = {
        show_title: 'Bluprint',
        season_name: title.series.replace(/ /g, "\\ "),
        title: title.episode.replace(/ /g, "\\ "),
        episode: title.track,
      };
      let metadataString = "";
      Object.keys(metadata).forEach(key => {
        if (metadataString.length != 0)
          metadataString += ' ';
        metadataString += '-metadata ' + key + '=' + metadata[key];
      });

      let seriesPath = downloadPath + '/' + title.series.replace(/: |:/g, '꞉ ');
      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {if (err) throw err;});
      }
      const options = {
        cwd: seriesPath
      };
      filename = filename.replace(/: |:/g, '꞉ ');
      youtubedl.exec(title.url, ['--output', filename + '.%(ext)s'
                                 //'--add-metadata', '--postprocessor-args', '"' + metadataString + '"'
                                ], options, function(err, output) {
        if (err) console.error(err);
        console.log(output.join('\n'));
      });

      if (title.resources.length > 0) {
        let resourcesPath = seriesPath+'/resources';
        if (!fs.existsSync(resourcesPath)) {
          fs.mkdirSync(resourcesPath, err => {if (err) throw err;});
        }

        // Download resources
        fs.readdir(resourcesPath, (err, items) => {
          if (items.length < title.resources.length) {
            title.resources.forEach(resource => {
              axios.get(resource.url, {headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'}} )
                .then((response) => {
                  //fs.writeFileSync('./response.log', JSON.stringify(response.keys), 'utf-8');
                  resource.title = entities.decode(resource.title);
                  let filetype = response.headers['content-type'].match(/\/(.*)$/)[1];
                  let filename = seriesPath + '/resources/' + resource.title + '.' + filetype;
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

      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8');
      fs.writeFileSync(collectionFile, JSON.stringify(collection, null, 2), 'utf-8');
    }
  });
});