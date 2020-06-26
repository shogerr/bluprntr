'use strict'

const axios = require('axios')
const Entities = require('html-entities').XmlEntities
const fs = require('fs')
const WebSocket = require('ws')
const youtubedl = require('youtube-dl')
const entities = new Entities()
const {underline, blue, green} = require('ansicolor')
const log = require('ololog').configure({
  locate: false,
  time: true,
  stringify: { maxStringLength: 80 },
  tag: true
})

youtubedl.setYtdlBinary(
  youtubedl.getYtdlBinary().replace("app.asar", "app.asar.unpacked")
)

require('dotenv').config()
var bluprntrPort = process.env.BLUPRNTR_PORT ? process.env.BLUPRNTR_PORT : 8888;

var wss = new WebSocket.Server({ port: bluprntrPort })
// TODO Straighten out why some events are handled, and some not.
wss.on('open', async (event) => {
  log (event)
})
wss.on('close', async (event) => {
  log (event)
})
wss.onclose = () => {
  log (`Chrome connection closed.`)
}
wss.on('error', async (event) => {
  log.error (event)
})

let downloadPath = '.'
if (process.env.BLUPRNTR_DOWNLOAD_PATH)
  downloadPath = process.env.BLUPRNTR_DOWNLOAD_PATH
else
  downloadPath = `${require('os').homedir()}/Downloads/Bluprint`


let settings = {
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

// Print the header message.
log (underline (`BluPrntr`))
log.yellow.warn (`All data files are now stored under '${settings.data_path}'.`)
log.yellow.bright.warn (`Please move any existing files (./data/data.json & ./data/collection.json) to '${settings.data_path}'.`)
log.info (`Running on port ${bluprntrPort}.`)
log.info (`Downloading to, "${downloadPath}".`)
log.darkGray.info ({settings: settings})


function performSetup(settings) {
  const LoadOrCreateData = (filepath) => {
    if (fs.existsSync(filepath)) {
      try {
        let contents = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        return contents;
      } catch (e) {
        log.red (`There was a problem loading ${filepath}. Please check the integrity of its contents.`);
        log.warn (`Disabling saving`);
        log.error (e);
        return undefined;
      }
    } else {
      return undefined;
    }
  };
  const loadFileData = (filepath, data) => {
    let loaded = LoadOrCreateData(filepath);
    if (loaded === undefined) return [false, data];
    return [true, loaded];
  };
  const findFolderOrCreate = folderPath => {
    if (!fs.existsSync(folderPath)) {
      log.warn (`The path "${folderPath}" was not found.`);
      log.bright.warn (`Bluprntr has created the folder "${folderPath}".`);
      fs.mkdirSync(folderPath, { recursive: true }, err => {
        if (err) log.red.error (err);
      })
    }
  };

  findFolderOrCreate(settings.download_path);
  findFolderOrCreate(settings.data_path);
  let titles_ = loadFileData(settings.data_file, new Map());
  let collection_ = loadFileData(settings.collection_file, {});
  if (!titles_[0]) settings.save_data_file = false;
  if (!collection_[0]) settings.save_collection_file = false;

  return {titles: titles_[1], collection: collection_[1]}
}

function downloadResources(resources, path, settings) {
  if (resources.length > 0 && fs.existsSync(path)) {
    let resourcesPath = `${path}/resources`
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, { recursive: true }, err => {
        if (err) log.error (err);
      })
    }

    fs.readdir(resourcesPath, (err, items) => {
      if (err) log.red.error (err);
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
              resource.title = entities.decode(resource.title)
              let filetype = response.headers['content-type'].match(/\/(.*)$/)[1]
              resource.title = resource.title.replace(/: |:/g, settings.character_map.get(':'))
              let filename = `${path}/resources/${resource.title}.${filetype}`
              filename = filename.replace(/"/g, '')
              log(green ('[downloaded]'), '(resource)', filename)
              try {
                fs.writeFileSync(filename, new Buffer.from(response.data, 'binary'), 'binary');
              } catch (err) {
                log.bright.red (err);
              }
            })
            .catch(err => {
              log.red.error (err);
            });
        });
      }
    });
  }

  return true
}

function formatTitleString(s) {
  s = s.replace(/: |:/g, `${settings.character_map.get(':')} `)
       .replace(/\/|\\/g, '-')
  return s;
}

const data = performSetup(settings)
log (data)
const titles = data.titles
const collection = data.collection

wss.on('connection', function connection(ws) {
  log.info ('The', blue ('Bluprint'), 'Chrome extension has connected!')
  ws.send('Connected to bluprntr server')
  ws.on('message', function incoming(message) {
    let title = JSON.parse(message)
    log.maxDepth(3).darkGray ('[caught]', title)
    title.episode = entities.decode(title.episode)
    title.series = entities.decode(title.series)
    let id = title.series + "#" + title.episode
    title.episode = formatTitleString(title.episode)
    title.series = formatTitleString(title.series)
    let filename = `${title.series} - ${title.track.toString().padStart(2, '0')} - ${title.episode}`
    if (settings.replace_spaces)
      filename = filename.replace(/ /g, settings.character_map.get('.'))
    const seriesPath = `${downloadPath}/${title.series}`

    if (titles.has(id) && !titles.get(id).resources_downloaded) {
      titles.set(id, {
        url: title.url,
        resources_downloaded: downloadResources(title.resources, seriesPath, settings)
      })
      fs.writeFileSync(dataFile, JSON.stringify([...titles], null, 2), 'utf-8')
    } else if (!titles.has(id)) {
      log(green ('[downloading]'), '(video)', { filename: filename, url: title.url })
      collection[title.series] = collection[title.series] || {}
      collection[title.series][title.episode] = {url: title.url}
      collection[title.series].resources = title.resources

      if (!fs.existsSync(seriesPath)) {
        fs.mkdir(seriesPath, err => {
          if (err) log.red.error (err)
        })
      }

      var ffmpeg = { path: require('ffmpeg-static') }
      youtubedl.exec(title.url,
        ['--output', filename + '.%(ext)s', '--ffmpeg-location', ffmpeg.path],
        { cwd: seriesPath },
        (err, output) => {
        if (err) {
          log.red (err.message)
          log.red.error (err)
        }
        else
          log (green ('[finished]'), filename, '(' + output[output.length-1].replace(/\[download\] /, '').trim() + ')')
      })

      titles.set(id, {
        url: title.url,
        resources_downloaded: downloadResources(title.resources, seriesPath, settings)
      })

      fs.writeFileSync(settings.data_file, JSON.stringify([...titles], null, 2), 'utf-8', err => {
        if (err) log.error (err)
      })
      fs.writeFileSync(settings.collection_file, JSON.stringify(collection, null, 2), 'utf-8', err => {
        if (err) log.error (err)
      })
    }
  });
});

module.exports = { downloadPath }