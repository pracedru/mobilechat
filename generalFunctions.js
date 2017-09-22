var fs = require('fs');
var Guid = require('./guid');
var Users = require("./models/users.js");

module.exports = {
  createChannel: function(userID, newChannelName, publicChannel, done) {
    var newChannelID = Guid.new();
    var gf = this;
    var userData = Users.findById(userID, function(err, user){
      if (err)
        done(err, null);
      var channelData = {
        "users": [],
        "owner": userID,
        "name": newChannelName,
        "id": newChannelID,
        "public": publicChannel
      };
      user.myChannels.push(newChannelID);
      var dir = "./data/channels/" + newChannelID;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        fs.mkdirSync(dir + "/messages");
      }
      gf.saveChannelData(newChannelID, channelData);
      user.save();
      done(err, channelData);
    });
  },
  saveUserData: function(userID, userData) {
    var filename = "./data/users/" + userID + "/config.json";
    fs.writeFile(filename, JSON.stringify(userData), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  },
  getPublicUserData: function(userID, flat, done) {
    Users.findById(userID, function(err, user) {
      if (err)
        done(err, null);
      userData = user.public();
      if (flat == true) {
        done(null, userData);
      } else {
        for (var i = 0; i < userData.myChannels.length; i++) {
          var id = userData.myChannels[i];
          userData.myChannels[i] = this.getChannelData(userData.myChannels[i]);
          userData.myChannels[i].id = id;
        }
        done(null, userData);
      }
    });
  },
  saveChannelData: function(channelID, channelData) {
    var filename = "./data/channels/" + channelID + "/config.json";
    fs.writeFile(filename, JSON.stringify(channelData), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  },
  getChannelData: function(channelID, flat) {
    var filename = "./data/channels/" + channelID + "/config.json";
    var channelData = null;
    var data = null;
    try {
      data = fs.readFileSync(filename);
    } catch (err) {
      return null;
    }
    channelData = JSON.parse(data);
    return channelData;
  },

  getChannelMessages: function(userID, channelID, maxCount, limitTimeStamp) {
    var folder = "./data/channels/" + channelID + "/messages";
    var messages = [];
    var files = fs.readdirSync(folder);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var timestamp = parseInt(file.split(".")[0]);
      if (timestamp > limitTimeStamp) {
        var message = this.getMessage(channelID, timestamp);
        Users.findById(message.sender, function(err, user){
          if (!err)
            message.name = user.name;
        });
        messages.push(message);
      }
    }
    messagesData = {
      "timeStamp": Date.now(),
      "channelMessages": messages
    };
    return messagesData;
  },
  getMessage: function(channelID, timestamp) {
    var filename = "./data/channels/" + channelID + "/messages/" + timestamp + ".json";
    var message = null;
    var data = null;
    try {
      data = fs.readFileSync(filename);
    } catch (err) {
      return null;
    }
    message = JSON.parse(data);
    message.timeStamp = timestamp;
    return message;
  },
  addMessage: function(userID, channelID, message) {
    var timestamp = Date.now();
    var filename = "./data/channels/" + channelID + "/messages/" + timestamp + ".json";
    var messageData = {
      "sender": userID,
      "text": message
    }
    fs.writeFile(filename, JSON.stringify(messageData), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  },
  cloneUser: function(user, deep){
    user = JSON.parse(JSON.stringify(user));
    if (deep){
      for (var i = 0; i < user.myChannels.length; i++) {
        var id = user.myChannels[i];
        user.myChannels[i] = this.getChannelData(user.myChannels[i]);
      }
      for (var i = 0; i < user.otherChannels.length; i++) {
        var id = user.otherChannels[i];
        user.otherChannels[i] = this.getChannelData(user.otherChannels[i]);
      }
    }
    return user;
  }
}
