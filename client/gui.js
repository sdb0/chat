const blessed = require('blessed');
const Channel = require('./channel');
const Command = require('./command');

const timestamp = () => {
    const d = new Date(Date.now());
    return d.toLocaleTimeString('en-US', { hour12: false });
};

class StateBar {
    constructor(screen, ui) {
        this.screen = screen;
        this.ui = ui;
        this.element = blessed.Text({
            content: ` [${timestamp()}]`,
            width: '100%',
            height: 1,
            bottom: 1,
            style: {
                fg: 'white',
                bg: 'blue',
            },
        });

        this.screen.append(this.element);

        setInterval(() => {
            this.element.setContent(` [${timestamp()}] ${this.ui.currentChannelIndex}`);
            this.screen.render();
        }, 100);
    }
}

class TopBar {
    constructor(screen) {
        this.screen = screen;
        this.element = blessed.Text({
            content: 'Channel Info',
            width: '100%',
            height: 1,
            top: 0,
            style: {
                fg: 'white',
                bg: 'blue',
            },
        });

        this.screen.append(this.element);

        this.setText = function(text) {
            this.element.content = text;
        };
    }
}

class InputBox {
    constructor(screen, textOutput, ui) {
        this.screen = screen;
        this.textOutput = textOutput;
        this.ui = ui;
        this.element = blessed.Textbox({
            content: 'testing123',
            inputOnFocus: true,
            bottom: 0,
            width: '100%',
            height: 1,
            scrollable: true,
            scrollbar: {
                bg: 'blue',
            },
        });

        this.element.key(['C-c'], () => process.exit(0));

        this.element.key(['right'], () => {
            this.ui.nextChannel();
        });

        this.element.key(['left'], () => {
            this.ui.previousChannel();
        });

        this.element.on('submit', (event) => {
            this.ui.sendMessage(ui.currentChannel.ids[0], event);
            this.element.clearValue();
            this.element.focus();
            this.screen.render();
        });

        this.screen.append(this.element);
        this.element.focus();
    }
}

class MainText {
    constructor(screen) {
        this.screen = screen;
        this.element = blessed.box({
            title: 'chat',
            width: '100%',
            height: '92%',
            content: '',
            tags: true,
            top: 1,
            style: {
                fg: 'white',
                bg: 'black',
            },
            scrollbar: {
                bg: 'blue',
            },
            scrollable: true,
        });
        this.screen.append(this.element);
    }

    addLine(text) {
        this.element.pushLine(`${text}`);
        this.element.scroll(1);
    }

    changeChannel(messages) {
        this.element.hide();
        this.element.setContent('');
        messages.forEach(message => this.addLine(message));
        this.element.setScrollPerc(100);
        this.element.show();
        this.screen.render();
    }
}

class UI {
    constructor(net) {
        this.net = net;
        this.command = new Command(this.error);
        this.screen = blessed.screen({
            smartCSR: true,
            terminal: 'windows-ansi',
        });

        this.bottom = new StateBar(this.screen, this);
        this.top = new TopBar(this.screen);
        this.mainText = new MainText(this.screen);
        this.inputText = new InputBox(this.screen, this.mainText, this);

        this.screen.key(['C-c'], () => process.exit(0));

        this.channels = [
            new Channel(this, [0], 'Console', false), // Error channel
        ];
        this.totalChannels = 1;
        this.currentChannelIndex = 0;
        this.currentChannel = this.channels[this.currentChannelIndex];
        this.channels[this.currentChannelIndex].receiveFocus();

        this.screen.render();
        this.error = function(message) {
            this.currentChannel.receiveMessage(0, 'Debug', Date.now(), message);
        };

        this.command.on('test', (args) => { this.error(args); });
        this.command.on('join', (args) => {
            const name = args[0];
            if (!name) {
                this.error('Please provide a channel name');
                return;
            }
            this.net.send('cRequestChannel', { name });
        });
        this.command.on('dm', (args) => {
            const name = args[0];
            if (!name) {
                this.error('Please provide a user name');
                return;
            }
            this.net.send('cRequestDMChannel', { name });
        });
    }


    addMessage(str) {
        this.mainText.addLine(str);
    }

    changeChannel(messages) {
        this.mainText.changeChannel(messages);
    }

    swapChannels() {
        this.currentChannel.loseFocus();
        this.currentChannel = this.channels[this.currentChannelIndex];
        this.currentChannel.receiveFocus();
        this.top.setText(this.currentChannel.name);
        this.screen.render();
    }

    nextChannel() {
        this.currentChannelIndex += 1;
        this.currentChannelIndex %= this.totalChannels;
        this.swapChannels();
    }

    previousChannel() {
        this.currentChannelIndex -= 1;
        if (this.currentChannelIndex < 0) this.currentChannelIndex = this.totalChannels - 1;
        this.swapChannels();
    }

    addChannel(name, id) {
        this.channels.push(new Channel(this, [id], name, false));
        this.totalChannels += 1;
        this.error(`Added new channel: ${name}`);
    }

    sendMessage(channel, content) {
        if (content[0] === '/') {
            this.command.process(content);
            return;
        }
        if (channel === 0) return; // Debug channel isn't real
        this.net.send('cMessage', { channel, content });
    }

    message(event) {
        this.channels.forEach((channel) => {
            channel.receiveMessage(event.channel, event.authorName, event.timestamp, event.message);
        });
    }
}

module.exports = UI;
