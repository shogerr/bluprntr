const WebSocket = require('ws');
const log = require('ololog').configure({
  locate: false,
  time: true
});
require('dotenv').config();

bluprntrPort = process.env.BLUPRNTR_PORT ? process.env.BLUPRNTR_PORT : 8888;
const wss = new WebSocket.Server({ port: bluprntrPort });

log("Test server started.")
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
    log(JSON.parse(msg))
  });
});