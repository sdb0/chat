const WebSocket = require('ws');
const Connection = require('./connection.js');
const UI = require('./gui.js');

const ws = new WebSocket('ws://localhost:8080/');
const net = new Connection(ws, 'testUser', 1);
const ui = new UI(net);
setTimeout(() => { net.setErrorCallback(ui.error); }, 1000);

net.on('sMessage', (data) => {
    ui.message(data);
});

net.on('sChannelList', (data) => {
    data.channels.forEach(c => ui.addChannel(c.name, c.uuid));
});

net.on('sChannelMessages', (data) => {
    data.messages.forEach(c => ui.message(c));
});

ui.error('Initializing...');
