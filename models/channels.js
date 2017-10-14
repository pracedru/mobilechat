var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var Messages = require('./messages.js');

var ChannelSchema = Schema({
  name: String,
  owner: {type: ObjectId, ref: 'User'},
  users: [{type: ObjectId, ref: 'User'}],
  public: Boolean,
  messages: [{type: ObjectId, ref: 'Message'}]
});

ChannelSchema.methods.getMessages = function (userID, maxCount, timeStamp, done){
  Messages.find({"_id":{ $in: this.messages}})
      .populate({path: "sender", select: "name"})
      .exec((err, messages) => {
    if (err) return done(err, null);
    return done(null, messages);
  });
}

ChannelSchema.methods.addMessage = function (dataObject){
  mongoose.model('User').findById(dataObject.userid, (err, user) => {
    var message = new Messages({
      text: dataObject.message,
      timestamp: Date.now(),
      sender: user._id
    });
    message.save();
    this.messages.push(message._id);
    this.save();
    relayMessage(dataObject, user);
  });
}

ChannelSchema.methods.addWebSocket = function (ws){
  var uwsh = new ChannelWebSocketHandler(this, ws);
  var channelWebSocketHandlers = null;
  if (!(this._id in channelsWebSocketHandlers)){
    channelWebSocketHandlers = [];
    channelsWebSocketHandlers[this._id] = channelWebSocketHandlers;
  } else {
    channelWebSocketHandlers = channelsWebSocketHandlers[this._id];
  }
  channelWebSocketHandlers.push(uwsh);
}


mongoose.model('Channel', ChannelSchema);

module.exports = mongoose.model('Channel');

var channelsWebSocketHandlers = {};

var ChannelWebSocketHandler = function (channel, ws){
  this.channel = channel;
  this.ws = ws;
  self = this;
  this.onMessage = function(data){
    //console.log(data);
    var dataObject = JSON.parse(data);
    switch (dataObject.type) {
      case "addMessage":
        self.channel.addMessage(dataObject);
        break;
      default:
        console.log("wierd message recieved! " + data);
    }
  }
  ws.on("message", this.onMessage);
  ws.on("close", () => {
    //console.log("websocket closed");
    var index = channelsWebSocketHandlers[self.channel._id].indexOf(this);
    //console.log("index: " + index);
    channelsWebSocketHandlers[this.channel._id].splice(index, 1);
  });
}


var relayMessage = function(messageData, user){
  msg = {
    type: "messageRelay",
    message: messageData.message,
    name: user.name,
    timestamp: Date.now()
  };
  var wshCount = channelsWebSocketHandlers[messageData.channelid].length;
  for (var i = 0; i < wshCount; i++){
    var wsh = channelsWebSocketHandlers[messageData.channelid][i];
    wsh.ws.send(JSON.stringify(msg));
  }
}

/*
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
*/