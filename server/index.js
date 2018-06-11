const WebSocket = require('ws');
const Database = require('./database.js');
const Client = require('./client.js');

const dbLoc = 'mongodb://localhost:27017/chat';
const server = new WebSocket.Server({ port: 8080 });

const db = new Database(dbLoc);

server.on('connection', (ws) => {
    const client = new Client(ws, db);
});

