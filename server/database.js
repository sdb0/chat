const { MongoClient } = require('mongodb');
const User = require('./user.js');
const Channel = require('./channel.js');
const uuidv1 = require('uuid/v1');

class Database {
    constructor(loc) {
        this.db = null;
        this.users = new Map();
        this.username2UUID = new Map();
        this.channelname2UUID = new Map();
        this.channels = new Map();

        MongoClient.connect(loc, (err, con) => {
            console.log(`Connected to database`);
            this.db = con;

            this.db.collection('channels').find().forEach((doc) => {
                this.channels.set(doc.uuid, new Channel(doc.name, doc.uuid, this));
                this.channelname2UUID.set(doc.name, doc.uuid);
            });

            this.db.collection('users').find().forEach((doc) => {
                const user = new User(doc);
                doc.channels.forEach((uuid) => {
                    const channel = this.channels.get(uuid);
                    if (channel) {
                        channel.addUser(user);
                        user.addChannel(channel);
                    }
                });
                this.users.set(doc.uuid, user);
                this.username2UUID.set(doc.name, doc.uuid);
            });
        });

        this.getUser = function(uuid) {
            return this.users.get(uuid);
        };

        this.getUserByName = function(name) {
            return this.username2UUID.get(name);
        };

        this.getChannel = function(uuid) {
            return this.channels.get(uuid);
        };

        this.getChannelByName = function(name) {
            return this.channelname2UUID.get(name);
        };

        this.createChannel = function(name) {
            const uuid = uuidv1();
            this.db.collection('channels').insertOne({ name, uuid });
            const channel = new Channel(name, uuid, this);
            this.channels.set(uuid.channel);
            return channel;
        };

        this.saveUserChannel = function(uuid, channeluuid) {
            this.db.collection('users').updateOne({ uuid }, { $push: { channels: channeluuid } });
        };

        this.addClientToChannel = function(channel, client) {
            channel.addUser(client.user);
            channel.registerClient(client);
            client.user.addChannel(channel);
            this.saveUserChannel(client.user.uuid, channel.uuid);
        };

        this.addUserToChannel = function(channel, user) {
            channel.addUser(user);
            user.addChannel(channel);
            this.saveUserChannel(user.uuid, channel.uuid);
        };

        this.requestNewChannel = function(name, client) {
            const channel = this.createChannel(name);
            this.addClientToChannel(channel, client);
        };

        this.requestDMChannel = function(name, client) {
            const target = this.getUserByName(name);
            if (!target) {
                console.log(`User ${name} does not exist`);
                return;
            }
            let channel = this.getChannelByName(`DM - ${name} + ${client.user.name}`);
            if (!channel) {
                console.log(`Making DM channel for ${client.user.name} with ${name}`);
                channel = this.createChannel(`DM - ${name} + ${client.user.name}`);
            }
            this.addClientToChannel(channel, client);
        };

        this.requestChannel = function(name, client) {
            let channel = this.getChannelByName(name);
            if (!channel) {
                console.error(`No channel of name ${name}, making one.`);
                channel = this.createChannel(name);
            }
            this.addClientToChannel(channel, client);
        };

        this.saveMessage = function(channel, userid, message) {
            this.db.collection('messages').insertOne({
                channel,
                timestamp: Date.now(),
                authorName: this.users.get(userid).name,
                message,
            }, {}, (err) => { if (err) console.log(err); });
        };

        this.getLastNMessages = function(channel, n, callback) {
            console.log(`Getting last ${n} messages of channel ${channel}`);
            this.db.collection('messages').find({ channel }, { limit: n, sort: 'timestamp' }).toArray(callback);
        };
    }
}

module.exports = Database;
