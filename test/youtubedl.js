var ytdl = require('youtube-dl')
var url = 'https://www.youtube.com/watch?v=fmIGnd98DX4'
var path = require('path')
var ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
ytdl.setYtdlBinary(
  ytdl.getYtdlBinary().replace("app.asar", "app.asar.unpacked")
)

var optionsSimple = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]']
var options = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]',
               '--ffmpeg-location', ffmpeg.path]

//ytdl.setYtdlBinary(path.join(__dirname, "../node_modules/youtube-dl/bin/youtube-dl.exe"))
ytdl.exec(
  url,
  options,
  {},
  (err, output) => {
    'use strict'
    if (err) {
      throw err
    }
    console.log(output.join('\n'))
  }
)