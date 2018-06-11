class Channel {
    constructor(name, uuid, db) {
        this.name = name;
        this.uuid = uuid;
        this.db = db;
        this.clients = [];
        this.users = [];

        this.registerClient = function(client) {
            this.clients.push(client);
            client.send('sChannelList', { channels: [{ name: this.name, uuid: this.uuid }] });
            this.getLastMessages(client);
        };

        this.removeClient = function(client) {
            const index = this.clients.findIndex(c => c.uuid === client.uuid);
            this.clients.splice(index, 1);
        };

        this.handleMessage = function(user, message) {
            this.broadcast('sMessage', {
                authorName: user.name,
                message,
                timestamp: Date.now(),
                channel: this.uuid,
            });
            this.db.saveMessage(this.uuid, user.uuid, message);
        };

        this.broadcast = function(packetName, packetData) {
            this.clients.forEach(c => c.send(packetName, packetData));
        };

        this.addUser = function(user) {
            this.users.push(user);
        };

        this.getLastMessages = function(client) {
            return this.db.getLastNMessages(this.uuid, 25, (err, messages) => {
                if (err) {
                    console.error(err);
                    return;
                }
                client.send('sChannelMessages', { messages });
            });
        };
    }
}

module.exports = Channel;
