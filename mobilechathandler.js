/*var fs = require('fs');

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function handleChat(req, res){
  switch (req.query.queryName){
    case "sendMessage":
      var userID = req.query.userid;
      var channelID = req.query.channelid;
      var message = req.query.message;
      addMessage(userID, channelID, message);
      res.writeHead(200, {'Content-Type': 'application/json'});
      return res.end();
      break;
    case "userdata":
      var userID = req.query.userid;
      var userData =  getPublicUserData(userID, false);
      if (userData!=null){
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(userData));
        return res.end();
      } else {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.write("Error on server occured");
        return res.end();
      }
      break;
    case "channelData":
      var userID = req.query.userid;
      var channelID = req.query.channelid;
      var channelData =  getChannelData(channelID, false);
      if (channelData!=null){
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(channelData));
        return res.end();
      } else {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.write("Error on server occured");
        return res.end();
      }
      break;
    case "channelMessages":
      var userID = req.query.userid;
      var channelID = req.query.channelid;
      var timeStamp = req.query.timeStamp;
      var maxCount = req.query.maxCount;
      var channelMessages =  getChannelMessages(userID, channelID, maxCount, timeStamp);
      //console.log(channelMessages);
      if (channelMessages!=null){
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(channelMessages));
        return res.end();
      } else {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.write("Error on server occured");
        return res.end();
      }
      break;
    case "createChannel":
      var userID = req.query.userid;
      var newChannelName = req.query.name;
      var channelData = createChannel(userID, newChannelName);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify(channelData));
      return res.end();
      break;
    default:
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.write("Bad request");
      return res.end();
  }
}

exports.handleChat = handleChat;
 client function createchannel:
  based on userID and newChannelName this function adds a new channel to the
  service.

function createChannel(userID, newChannelName){
  var newChannelID = guid();
  var userData =  getUserData(userID, true);
  var channelData = {
    "users": [],
    "owner": userID,
    "name": newChannelName
  };
  userData.public.myChannels.push(newChannelID);
  var dir = "./data/channels/" + newChannelID;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.mkdirSync(dir + "/messages");
  }

  saveChannelData(newChannelID, channelData);
  saveUserData(userID, userData);
  return channelData;
}

function saveUserData(userID, userData){
  var filename = "./data/users/" + userID + "/config.json";
  fs.writeFile(filename, JSON.stringify(userData), function(err) {
    if(err) {
      return console.log(err);
    }
  });
}

function getPublicUserData(userID, flat){
  var filename = "./data/users/" + userID + "/config.json";
  var userData = null;
  var data = null;
  try{
    data = fs.readFileSync(filename);
  } catch (err){
    return null;
  }
  userData = JSON.parse(data).public;
  if (flat==true) return userData;
  for (var i = 0; i < userData.myChannels.length; i++){
    var id = userData.myChannels[i];
    userData.myChannels[i] = getChannelData(userData.myChannels[i]);
    userData.myChannels[i].id = id;
  }
  for (var i = 0; i < userData.otherChannels.length; i++){
    var id = userData.otherChannels[i];
    userData.otherChannels[i] = getChannelData(userData.otherChannels[i]);
    userData.otherChannels[i].id = id;
  }
  return userData;
}

function getUserData(userID){
  var filename = "./data/users/" + userID + "/config.json";
  var userData = null;
  var data = null;
  try{
    data = fs.readFileSync(filename);
  } catch (err){
    return null;
  }
  userData = JSON.parse(data);
  return userData;
}

function saveChannelData(channelID, channelData){
  var filename = "./data/channels/" + channelID + "/config.json";
  fs.writeFile(filename, JSON.stringify(channelData), function(err) {
    if(err) {
      return console.log(err);
    }
  });
}

function getChannelData(channelID, flat){
  var filename = "./data/channels/" + channelID + "/config.json";
  var channelData = null;
  var data = null;
  try{
    data = fs.readFileSync(filename);
  } catch (err){
    return null;
  }
  channelData = JSON.parse(data);
  return channelData;
}

function getChannelMessages(userID, channelID, maxCount, limitTimeStamp){
  var folder = "./data/channels/" + channelID + "/messages";
  var messages = [];
  var files = fs.readdirSync(folder);
  var users = {};
  for (var i = 0; i < files.length; i++){
    var file = files[i];
    var timestamp = parseInt(file.split(".")[0]);
    if (timestamp > limitTimeStamp){
      var message = getMessage(channelID, timestamp);
      if (message.sender in users){
        message.name = users[message.sender].name;
      } else {
        user = getPublicUserData(message.sender);
        users[message.sender] = user;
        message.name = user.name;
      }
      messages.push(message);
    }
  }
  messagesData = { "timeStamp" : Date.now(), "channelMessages": messages};
  return messagesData;
}

function getMessage(channelID, timestamp){
  var filename = "./data/channels/" + channelID + "/messages/" + timestamp + ".json";
  var message = null;
  var data = null;
  try{
    data = fs.readFileSync(filename);
  } catch (err){
    return null;
  }
  message = JSON.parse(data);
  message.timeStamp = timestamp;
  return message;
}

function addMessage(userID, channelID, message){
  var timestamp = Date.now();
  var filename = "./data/channels/" + channelID + "/messages/" + timestamp + ".json";
  var messageData = {
    "sender": userID,
    "text": message
  }
  fs.writeFile(filename, JSON.stringify(messageData), function(err) {
    if(err) {
      return console.log(err);
    }
  });
}*/
