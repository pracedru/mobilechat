var fs = require('fs');
var Guid = require('../guid');
var bcrypt = require('bcrypt');

Channels = null;
usersById = null
usersByEmail = null

var Ticket = function(){
  this.timestamp = Date.now;
  this.id = Guid.new();
}

var User = function(name, email, password){
  this.name = name;
  if (email) this.email = email.toLowerCase();
  if (password){
    this.password = bcrypt.hashSync(password, 10);
  }
  this.id = Guid.new();
  this.myChannels = [];
  this.otherChannels = [];
  this.friends = [];
  this.tickets = {};
  this.webSockets = [];
  this.save = function() {
    var dir = "./data/users/" + this.id;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    var filename = dir + "/config.json";
    fs.writeFile(filename, JSON.stringify(this.serialize()), function(err) {
      if (err) {
        return console.log(err);
      }
    });
    usersByEmail[this.email] = this;
    usersById[this.id] = this;
  }
  this.public = function(){
    return {
      "name": this.name,
      "myChannels": this.myChannels
    }
  }
  this.deserialize = function(data){
     userData = JSON.parse(data);
     this.name = userData.name;
     this.email = userData.email;
     this.password = userData.password;
     this.id = userData.id;
     this.myChannels = userData.myChannels;
     this.otherChannels = userData.otherChannels;
     this.friends = userData.friends;
     this.tickets = userData.tickets;
  }
  this.serialize = () =>{
    userData = {};
    userData.name = this.name;
    userData.email = this.email;
    userData.password = this.password;
    userData.id = this.id;
    userData.myChannels = this.myChannels;
    userData.otherChannels = this.otherChannels;
    userData.friends = this.friends;
    userData.tickets = this.tickets;
    return userData;
  }
  this.authenticate = (pw) => {
    if (bcrypt.compareSync(pw, this.password)){
      var ticket = new Ticket();
      this.tickets[ticket.id] = ticket;
      this.save();
      return ticket;
    }
    return null;
  }
  this.checkTicket = (ticketid) => {
    if (ticketid in this.tickets){
      ticket = this.tickets[ticketid];
      // Todo: Check timestamp age
      return true;
    }
    return false;
  }
  this.addWebSocket = (webSocket) => {
    var usr = this;
    this.webSockets.push(webSocket);
    webSocket.on("message", this.onMessage);
    webSocket.on("close", function() {
      var index = usr.webSockets.indexOf(this);
      usr.webSockets.splice(index, 1);
    })
  }
  this.onMessage = (data) => {
    var currentUser = this;
    var dataObject = JSON.parse(data);
    switch (dataObject.type) {
      case "addMessage":
        var channelID = dataObject.channelid;
        Channels.findById(channelID, (err, channel) => {
          if (err)
            throw err;
          channel.addMessage(dataObject, currentUser);
        });
        break;
      default:
        console.log("wierd message recieved!");
    }
  }
  this.relayMessage = (messageData) => {
    this.webSockets.forEach((ws => {
      ws.send(JSON.stringify(messageData));
    }));
  }
}


function readAllUsers() {
  console.log("read users");
  usersById = {};
  usersByEmail = {};
  var folder = "./data/users/";
  var files = fs.readdirSync(folder);
  for (var i = 0; i < files.length; i++){
    var userID = files[i];
    var filename = folder + userID + "/config.json";
    fs.readFile(filename, "utf8", function(err, data){
       if(err){
          console.log(err)
       }
       //console.log(data);
       user = new User();
       user.deserialize(data);
       usersById[user.id] = user;
       usersByEmail[user.email] = user;
    })
  }
}

readAllUsers();

module.exports = {
  setChannels: (channels) => {
    Channels = channels;
  },
  findByEmail: function(email, done) {
    var user = null;
    var error = null;
    if (email in usersByEmail) {
      user = usersByEmail[email];
    }
    if (user == null){
      error = "user not found";
    }
    done(error, user);
  },
  findById: function(id, done) {
    user = null;
    var error = null;
    if (id in usersById) {
      user = usersById[id];
    }
    if (user == null){
      error = "user not found";
    }
    done(error, user)
  },
  User: User
}
