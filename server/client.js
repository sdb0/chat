const Networking = require('../lib/networking.js');
const User = require('./user.js');
const uuidv1 = require('uuid/v1');

class Client extends Networking {
    constructor(ws, db) {
        super(ws);
        this.db = db;
        this.user = null;
        this.uuid = uuidv1();

        this.on('cConnect', (data) => {
            this.user = db.getUser(data.uuid);

            // User does not exist
            if (!this.user) {
                console.error('User does not exist');
                ws.close();
            }

            this.user.connect(this);
            this.user.setStatus(User.StatusValue.ONLINE);
            this.onClose(() => {
                this.user.disconnect(this);
            });
        });

        this.on('cMessage', (data) => {
            const channel = this.user.inChannel(data.channel);
            if (!channel) {
                console.error(`Received message to channel user is not in`);
            } else {
                console.log(data);
                channel.handleMessage(this.user, data.content);
            }
        });

        this.on('cRequestChannel', (data) => {
            db.requestChannel(data.name, this);
        });

        this.on('cRequestDMChannel', (data) => {
            db.requestDMChannel(data.name, this);
        });

        /**
         * Attempts to send a DM to user by UUID
         */
        this.on('cRequestDM', (data) => {
            db.requestDM(this, data.to, data.content);
        });

        this.on('cSetStatus', (data) => {
            this.user.setStatus(data.status);
        });
    }
}

module.exports = Client;
