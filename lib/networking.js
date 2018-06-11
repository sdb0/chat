class Networking {
    constructor(ws, onOpen, errCallback = console.error) {
        this.ws = ws;
        this.map = new Map();
        this.closeFuncs = [];
        this.errCallback = errCallback;

        this.setErrorCallback = function(callback) {
            this.errCallback = callback;
        };

        this.on = function(name, callback) {
            this.map.set(name, callback);
        };

        this.handle = function(name, data) {
            const cb = this.map.get(name);
            if (!cb) {
                errCallback(`Received packet with no callback: ${name})`);
                return;
            }
            cb(data);
        };

        this.send = function(name, data) {
            if (data) {
                data.packetId = name;
            } else {
                data = { packetId: name };
            }
            errCallback(data);
            ws.send(JSON.stringify(data));
        };

        this.ws.on('open', () => {
            if (onOpen) onOpen();
        });

        this.ws.on('error', (error) => {
            errCallback(`Error: ${error}`);
            errCallback('Closing connection.');
            ws.close();
        });

        this.onClose = function(fn) {
            this.closeFuncs.push(fn);
        };

        this.ws.on('close', (reason) => {
            this.closeFuncs.forEach(fn => fn(reason));
            errCallback(`WebSocket Closed: ${reason}`);
        });

        this.ws.on('message', (data) => {
            try {
                errCallback(data);
                const parse = JSON.parse(data);
                const name = parse.packetId;
                if (!name) {
                    errCallback(`No callback registered for packet of type: ${name}`);
                    return;
                }
                delete parse.packetName;
                this.handle(name, parse);
            } catch (err) {
                errCallback('Failed to parse packet');
                errCallback(err);
            }
        });
    }
}

module.exports = Networking;
