// jshint esversion:6
const WebSocket = require('ws');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const Entities = require('html-entities').XmlEntities;
const http = require('http');
const axios = require('axios');
const FileDownload = require('js-file-download');


const entities = new Entities();

const wss = new WebSocket.Server({ port: 8888 });

require('dotenv').config();

let downloadLocation = process.env.BLUPRNTR_DOWNLOAD_PATH ?
  process.env.BLUPRNTR_DOWNLOAD_PATH : process.env.HomeDrive + process.env.HomePath + "/Downloads/Bluprint";

if (!fs.existsSync(downloadLocation)) {
  fs.mkdir(downloadLocation, err => {if (err) throw err;});
}
console.log('Downloading to, "' + downloadLocation + '".');

let dataFile = 'data/data.json';
let collectionFile = 'data/collection.json';
let titles = fs.existsSync(dataFile) ? new Map(JSON.parse(fs.readFileSync(dataFile, 'utf8'))) : new Map();
let collection = fs.existsSync(collectionFile) ? JSON.parse(fs.readFileSync(collectionFile, 'utf8')) : {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    let title = JSON.parse(message);
    // Ensure the highest quality is always downloaded.
    //title.url = title.url.replace(/\d\d\d\dk.m3u8$/, '4100k.m3u8');
    title.episode = entities.decode(title.episode);
    title.series = entities.decode(title.series);
    let id = title.series + "#" + title.episode;
    if (!titles.has(id)) {
      titles.set(id, title.url);
      collection[title.series] = collection[title.series] || {};
      collection[title.series][title.episode] = {url: title.url};

      const video = youtubedl(title.url, [], { cwd: __dirname });

      let filename = title.series + ' - ' + title.track.toString().padStart(2, '0') + ' - ' + title.episode;

      // Will be called when the download starts.
      video.on('info', function(info) {
        console.log('Download started');
        console.log('filename: ' + filename);
        //console.log(JSON.stringify(info));
      });
      // Replace colons -> _
      filename = filename.replace(/: |:/g, '꞉');
      // Replace spaces -> .
      //filename = filename.replace(/ /g, '.');
      console.log("filename: " + filename);

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
      console.log(metadataString);
      let seriesPath = downloadLocation + '/' + title.series.replace(/: |:/g, '꞉');
      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {if (err) throw err;});
      }
      /*
      youtubedl.exec(title.url, ['--output', seriesPath + '/' + filename + '.%(ext)s',
                                 '--add-metadata', '--postprocessor-args', '"' + metadataString + '"'
                                ], {}, function(err, output) {
        if (err) throw err;
        console.log(output.join('\n'));
      });
      */

      // Download resources
      title.resources.forEach(resource => {
        if (!fs.existsSync(seriesPath+'/resources')) {
          fs.mkdir(seriesPath+'/resources', err => {if (err) throw err;});
        }
        axios.get(resource.url)
          .then((response) => {
            //fs.writeFileSync('./response.log', JSON.stringify(response.keys), 'utf-8');
            resource.title = entities.decode(resource.title);
            let filetype = response.headers['content-type'].match(/\/(.*)$/)[1];
            let filename = seriesPath + '/resources/' + resource.title + '.' + filetype;
            console.log(filetype);
            console.log(filename);
            fs.writeFileSync(filename, response.data);
          })
          .catch(err => {
            console.error(err);
          });
      });

      //console.log(JSON.stringify(title.resources));
      /*
      console.log(titles);
      console.log(collection);
      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8');
      fs.writeFileSync(collectionFile, JSON.stringify(collection, null, 2), 'utf-8');
      */
    }
  });
});