'use strict';
const TelegramCliWrapper = require('./telegram-cli-wrapper.js');
const APIConnection = require('./models/APIConnection.js');

class TelegramAPI {
  constructor(config) {
    this.socket = null;
    this.connection = null;
    this.config = config;
    this.isQuiet = this.config.isQuiet;
    this.tgcli = new TelegramCliWrapper(this.config);
  }
  
  connect(callback) {
    if(this.tgcli.isRunning()){
      throw new Error('TelegramAPI is already running');
    }
    
    this.tgcli.start(socket => {
      this.connection = new APIConnection(socket, this.isQuiet);
      this.socket = socket;

      callback(this.connection);
    });
  }
  
  disconnect() {
    this.tgcli.stop();
    if(this.connection){
      this.connection.close();
      this.connection = null;
    }
  }
}

module.exports = TelegramAPI;