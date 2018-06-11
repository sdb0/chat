const Networking = require('../lib/networking.js');

class Connection extends Networking {
    constructor(ws, username, uuid) {
        super(ws, () => this.send('cConnect', { username, uuid }), () => {});
        this.username = username;

        this.on('sChannelList', () => {
            this.send('cChannelList', { channels: ['Lobby'] });
        });
    }
}

module.exports = Connection;
