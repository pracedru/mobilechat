var fs = require('fs');
var Guid = require('../guid');

var Users = null;
var channelsByID = {};

var Channel = function(){
  this.users = [];
  this.owner = "";
  this.name = "";
  this.id =  "";
  this.public = false
  this.serialize = function(){
    var data = {
      'users': this.users,
      'owner': this.owner,
      'name': this.name,
      'id': this.id,
      'public': this.public
    }
    return data;
  }
  this.deserialize = function(data){
    this.users = data.users;
    this.owner = data.owner;
    this.name = data.name;
    this.id =  data.id;
    this.public = data.public;
  }
  this.save = function(){
    var dir = "./data/channels/" + this.id;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    var filename = dir + "/config.json";
    fs.writeFile(filename, JSON.stringify(this.serialize()), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }
  this.getMessages = (userID, maxCount, limitTimeStamp) => {
    var folder = "./data/channels/" + this.id + "/messages";
    var messages = [];
    var files = fs.readdirSync(folder);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var timestamp = parseInt(file.split(".")[0]);
      if (timestamp > limitTimeStamp) {
        var message = this.getMessage(timestamp);
        if (message!=null){
          Users.findById(message.sender, function(err, user){
            if (!err)
              message.name = user.name;
          });
          messages.push(message);
        }
      }
    }
    messagesData = {
      "timeStamp": Date.now(),
      "channelMessages": messages
    };
    return messagesData;
  }

  this.getMessage = function(timestamp) {
    var filename = "./data/channels/" + this.id + "/messages/" + timestamp + ".json";
    var message = null;
    var data = null;
    try {
      data = fs.readFileSync(filename);
    } catch (err) {
      return null;
    }
    try {
      message = JSON.parse(data);
      message.timeStamp = timestamp;
    } catch (e){
      console.log("message undreadable");
    }
    return message;
  }
  this.addMessage = (messageData, fromUser) => {
    if (this.users.indexOf(messageData.userid) != -1 || this.public == true){
      var timestamp = Date.now();
      var filename = "./data/channels/" + this.id + "/messages/" + timestamp + ".json";
      var md = {
        "sender": messageData.userid,
        "text": messageData.message
      }
      fs.writeFile(filename, JSON.stringify(md), function(err) {
        if (err) {
          return console.log(err);
        }
      });
      messageData.timestamp = timestamp;
      messageData.name = fromUser.name;
      messageData.type = "messageRelay";
      this.users.forEach((userid)=>{
        Users.findById(userid, (err, user) => {
          if (err){
            throw "User not found."
          }

          user.relayMessage(messageData);
        });
      });
    } else {
      console.log("User not in channel");
    }
  }
}

module.exports = {
  setUsers: (users) =>{
    Users = users;
  },
  Channel: Channel,
  findById: (id, done) =>{
    var channel = null;
    if (id in channelsByID){
      channel = channelsByID[id];
      done(null, channel);
      return;
    } else {
      var dir =  "./data/channels/" + id;
      if (!fs.existsSync(dir)) {
        done("channel does not exist. " + id, null);
        return;
      }
      var filename = dir + "/config.json";
      var channelData = null;
      var data = null;
      try {
        data = fs.readFileSync(filename);
      } catch (err) {
        done("Cant read channel data from disk", null);
        return;
      }
      channelData = JSON.parse(data);
      channelData;
      channel = new Channel();
      channel.deserialize(channelData);
      channelsByID[channel.id] = channel;
      done(null, channel);
    }
  }
}
