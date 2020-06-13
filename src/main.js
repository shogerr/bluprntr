const { app, BrowserWindow } = require('electron')

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('views/index.html')
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

var ytdl = require('youtube-dl')
var url = 'https://www.youtube.com/watch?v=fmIGnd98DX4'
var path = require('path')
var ffmpeg = {}.path = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
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