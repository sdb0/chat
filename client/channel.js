class Channel {
    constructor(ui, ids, name, isWhisper, target = '', isFocused = false) {
        this.ui = ui;
        this.ids = ids;
        this.name = name;
        this.isWhisper = isWhisper;
        this.target = target;
        this.isFocused = isFocused;

        // Only alert for channel we're not focused on
        this.unreadMessages = !isFocused;

        this.messages = [];

        this.timestamp = () => {
            const d = new Date(Date.now());
            return d.toLocaleTimeString('en-US', { hour12: false });
        };

        this.unixToTimestamp = (unix) => {
            const d = new Date(unix);
            return d.toLocaleTimeString('en-US', { hour12: false });
        };
    }

    receiveMessage(channel, author, unixtime, text) {
        if (this.ids.indexOf('*') < 0) {
            if (this.ids.indexOf(channel) < 0) return;
        }

        const colors = {
            0: '#FFFFFF-fg',
            1: '#0064FF-fg',
            2: '#13FF00-fg',
            9: '#E9C636-fg',
        };

        const color = colors[channel] || (this.isWhisper && '#F300FF-fg');
        let outputStr;
        if (color) {
            outputStr = (`{${color}}[${this.timestamp(unixtime)}][${author}]: ${text}{/}`);
        } else {
            outputStr = (`[${this.unixToTimestamp(unixtime)}][${author}]: ${text}`);
        }
        this.messages.push(outputStr);

        if (this.isFocused) {
            this.ui.addMessage(outputStr);
        } else {
            this.unreadMessages = true;
        }
    }

    receiveFocus() {
        this.ui.changeChannel(this.messages);
        this.unreadMessages = false;
        this.isFocused = true;
    }

    loseFocus() {
        this.isFocused = false;
    }
}

module.exports = Channel;
