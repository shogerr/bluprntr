'use strict'

const axios = require('axios')
const fs = require('fs')
const {green} = require('ansicolor')
const log = require('ololog').configure({
  locate: false,
  time: true,
  stringify: { maxStringLength: 80 },
  tag: true
})
const Entities = require('html-entities').XmlEntities
const entities = new Entities()

exports.downloadResources = (resources, path, settings) => {
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
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
              'encoding': null,
              'Content-Type': 'application/pdf',
              'Accept': 'application/pdf'
              }
            })
            .then(response => {
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

  return true;
}