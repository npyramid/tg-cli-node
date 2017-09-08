'use strict';
const events = require('events');
const Parser = require('../utils/line-parser');
const Peer = require('./Peer');

class APIConnection extends events.EventEmitter {
  constructor(socket, isQuiet) {
    super();
    this.socket = socket;
    this.lineParser = new Parser(this);
    this._registerEvents();
    this.open = true;
    this.isQuiet = isQuiet;
    this._cb_receiver = null;
  }

  // tg methods wrappers
  sendTyping(peer_id) {
    this._executeCommand('send_typing', peer_id);
  }

  userInfo(peer_id) {
    return new Promise((resolve, reject) => {
      this._executeCommand('user_info', peer_id);
      this._cb_receiver = data => {
        resolve(new Peer(this, data));
      };
    });
  }

  forward(peer, msg_id) {
    this._executeCommand('fwd', peer, msg_id);
  }

  contactList() {
    return new Promise((resolve, reject) => {
      this._executeCommand('contact_list');
      this._cb_receiver = data => {
        const contactArr = [];
        for (let i = 0; i < data.length; ++i) {
          contactArr.push(new Peer(this, data[i]));
        }
        resolve(contactArr);
      };
    });
  }

  dialogList() {
    return new Promise((resolve, reject) => {
      this._executeCommand('dialog_list');
      this._cb_receiver = data => {
        const dialogArr = [];
        for (let i = 0; i < data.length; ++i) {
          dialogArr.push(new Peer(this, data[i]));
        }
        resolve(dialogArr);
      };
    });
  }

  send(peer, message) {
    this._executeCommand('msg', peer, `"${message}"`);
  }

  reply(id, message) {
    this._executeCommand('reply', id, `"${message}"`);
  }

  deleteMsg(id) {
    this._executeCommand('delete_msg', id);
  }

  sendImage(peer, path) {
    this._executeCommand('send_photo', peer, '"' + path + '"');
  }

  sendDocument(peer, path) {
    this._executeCommand('send_document', peer, '"' + path + '"');
  }

  getHistory(peer, limit) {
    return new Promise((resolve, reject) => {
      this._executeCommand('history', this.convertPeer(peer), limit);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  getChannelInfo(peer) {
    return new Promise((resolve, reject) => {
      this._executeCommand('channel_info', peer);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  loadPhoto(messageId) {
    return new Promise((resolve, reject) => {
      this._executeCommand('load_photo', messageId);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  loadDocument(messageId) {
    return new Promise((resolve, reject) => {
      this._executeCommand('load_document', messageId);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  loadVideo(messageId) {
    return new Promise((resolve, reject) => {
      this._executeCommand('load_video', messageId);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  getMessage(messageId) {
    return new Promise((resolve, reject) => {
      this._executeCommand('get_message', messageId);

      this._cb_receiver = (data) => {
        if (data.error) {
          reject(data);
        }

        resolve(data);
      };
    });
  }

  // core methods
  _executeCommand() {
    if(this.open){
      var args = Array.prototype.slice.call(arguments);
      var cmd = args.join(' ');
      !this.isQuiet && console.log('executing command:', cmd);
      this.socket.writeLine(cmd);
    }else{
      throw new Error('Api connection closed');
    }
  }

  close() {
    if(this.open){
      this.open = false;
      this.socket.end();
    }
  }

  convertPeer(peer) {
    if (typeof peer !== 'string') {
      console.error('peer must be string');
    }

    return 	peer.replace(/ /g, '_');
  }

  _registerEvents() {
    this.socket.on('line', line => {
      const parsedLine = this.lineParser.parse(line);
      if (parsedLine) {
        if (parsedLine.type === 'callback' && this._cb_receiver !== null) {
          this._cb_receiver(parsedLine.data);
          this._cb_receiver = null;
        } else {
          this.emit(parsedLine.type, parsedLine.data);
        }
      }
    });

    this.socket.on('error', e => {
      this.emit('error', e);
    });

    this.socket.on('close', () => {
      this.emit('disconnect');
    });
  };
}


module.exports = APIConnection;