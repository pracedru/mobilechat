var fs = require('fs');
var Guid = require('./guid');
var Users = require("./models/users.js");
var Channels = require("./models/channels.js");

module.exports = {
  createChannel: function(userID, newChannelName, publicChannel, done) {
    var newChannelID = Guid.new();
    var gf = this;
    console.log(userID);
    var userData = Users.findById(userID, function(err, user){
      if (err)
        return done(err, null);
      var channelData = {
        "users": [userID],
        "owner": userID,
        "name": newChannelName,
        "public": publicChannel
      };
      var channel = new Channels(channelData);
      channel.save();
      user.myChannels.push(channel._id);
      user.save();
      done(err, channelData);
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
  getChannelData: function(channelID, flat, done) {
    //console.log("channelID: " + channelID);
    channelData = Channels.findById(channelID, (err, channel)=>{
      if (err) return done(err, null);
      if (channel == null) return done("channel not found", null);
      return done(null, channel);
    });
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
  }
}
