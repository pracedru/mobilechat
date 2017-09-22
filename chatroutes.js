var fs = require('fs');
var Guid = require('./guid');
var Users = require("./models/users.js");
var gf = require("./generalFunctions.js")

module.exports = function(app, passport) {
  app.get("/sendMessage", function(req, res) {
    var userID = req.query.userid;
    var channelID = req.query.channelid;
    var message = req.query.message;
    gf.addMessage(userID, channelID, message);
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    return res.end();
  });
  app.get("/userdata", function(req, res) {
    var userID = req.query.userid;
    var userData = gf.getPublicUserData(userID, false, function(err, user){
        if (err){
          res.writeHead(500, {
            'Content-Type': 'text/html'
          });
          res.write("Error on server occured");
          return res.end();
        } else {
          res.writeHead(200, {
            'Content-Type': 'application/json'
          });
          res.write(JSON.stringify(user));
          return res.end();
        }
    });
  });
  app.get("/channelData", function(req, res) {
    var userID = req.query.userid;
    var channelID = req.query.channelid;
    var channelData = gf.getChannelData(channelID, false);
    if (channelData != null) {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify(channelData));
      return res.end();
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/html'
      });
      res.write("Error on server occured");
      return res.end();
    }
  });
  app.get("/channelMessages", function(req, res) {
    var userID = req.query.userid;
    var channelID = req.query.channelid;
    var timeStamp = req.query.timeStamp;
    var maxCount = req.query.maxCount;
    var channelMessages = gf.getChannelMessages(userID, channelID, maxCount, timeStamp);
    //console.log(channelMessages);
    if (channelMessages != null) {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify(channelMessages));
      return res.end();
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/html'
      });
      res.write("Error on server occured");
      return res.end();
    }
  });
  app.get("/createChannel", function(req, res) {
    var userID = req.query.userid;
    var newChannelName = req.query.name;
    var publicChannel = req.query.public;
    gf.createChannel(userID, newChannelName, publicChannel, function(err, channelData){
      if (err){
        res.writeHead(400, {
          'Content-Type': 'application/json'
        });
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(channelData));
      return res.end();
    });
  });
};
