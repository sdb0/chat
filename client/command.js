class Command {
    constructor(errorcb, prefix = '/') {
        this.prefix = prefix;
        this.errCallback = errorcb;
        this.map = new Map();

        this.on = function(name, callback) {
            this.map.set(name, callback);
        };

        this.handle = function(name, data) {
            const cb = this.map.get(name);
            if (!cb) {
                console.log(`No such command: ${name}`);
                return;
            }
            cb(data);
        };

        this.process = function(message) {
            if (message[0] !== prefix) return;

            const split = message.split(' ');
            const command = split[0].substring(1);
            this.handle(command, split.slice(1));
        };
    }
}

module.exports = Command;
