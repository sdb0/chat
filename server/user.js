class User {
    constructor(data) {
        this.name = data.name;
        this.uuid = data.uuid;
        this.icon = data.icon;
        this.status = data.status;
        this.channels = [];

        this.setStatus = function(status) {
            this.status = status;
        };

        this.addChannel = function(channel) {
            this.channels.push(channel);
        };

        this.inChannel = function(channelId) {
            return this.channels.find(c => c.uuid === channelId);
        };

        this.connect = function(client) {
            this.channels.forEach(c => c.registerClient(client));
        };

        this.disconnect = function(client) {
            this.status = User.StatusValue.OFFLINE;
            this.channels.forEach(c => c.removeClient(client));
        };

        this.buildChannelList = function() {
            const ret = [];
            this.channels.forEach(c => ret.push({ name: c.name, uuid: c.uuid }));
            return ret;
        };

        this.getChannelMessages = function(client) {
            this.channels.forEach(c => c.getLastMessages(client));
        };
    }
}

User.StatusValue = { OFFLINE: 0, ONLINE: 1, AWAY: 2 };

module.exports = User;
