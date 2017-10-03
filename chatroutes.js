var fs = require('fs');
var Guid = require('./guid');
var Users = require("./models/users.js");
var Channels = require("./models/channels.js");
var gf = require("./generalFunctions.js")


module.exports = function(app) {
  app.get("/addFriendToChannel", function(req, res) {
    console.log(req.query);
    var requestid = req.cookies.id;
    var targetid = req.query.friendid;
    var channelid = req.query.channelid
    if (requestid!=targetid){
      Users.findById(requestid, (err, requestUser)=>{
        if (err)
          throw err;
        if (requestUser){
          Users.findById(targetid, (err, targetUser) =>{
            if (err)
              throw err;
            if (targetUser){
              Channels.findById(channelid, (err, channel)=>{
                if(err){
                  res.writeHead(400, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Channel not found.");
                  return res.end();
                }
                if(channel.owner==requestid){
                  var request = Users.newRequest(Users.RequestTypes.JoinMyChannelRequest, requestid, channelid);
                  targetUser.requests[request.id] = request;
                  targetUser.save();
                  //channel.users.push(targetUser.id);
                  //channel.save();
                  //targetUser.otherChannels.push(channel.id);
                  res.writeHead(200, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Friend added to channel request sent.");
                  return res.end();
                } else {
                  res.writeHead(401, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Access denied.");
                  return res.end();
                }
              });
            }
          });
        }
      });
    } else {
      res.writeHead(400, {
        'Content-Type': 'text/html'
      });
      res.write("You can't friend your self.");
      return res.end();
    }
  });
  app.get("/addFriend", function(req, res) {
    var requestid = req.cookies.id;
    var targetid = req.query.id;
    if (requestid!=targetid){
      Users.findById(requestid, (err, requestUser)=>{
        if (err)
          throw err;
        if (requestUser){
          Users.findById(targetid, (err, targetUser) =>{
            if (err)
              throw err;
            if (targetUser){
              if(requestUser.friends.indexOf(targetUser.id) == -1){
                targetUser.friends.push(requestUser.id);
                targetUser.save();
                requestUser.friends.push(targetUser.id);
                requestUser.save();
                console.log("Friends added");
                res.writeHead(200, {
                  'Content-Type': 'text/html'
                });
                res.write("Friend requested");
                return res.end();
              } else {
                res.writeHead(400, {
                  'Content-Type': 'text/html'
                });
                res.write("You are already friends.");
                return res.end();
              }
            }
          });
        }
      });
    } else {
      res.writeHead(400, {
        'Content-Type': 'text/html'
      });
      res.write("You can't friend your self.");
      return res.end();
    }
  });
  app.get("/userSearch", function(req, res) {
    var searchText = req.query.searchText;
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    var resultData = {};
    resultData.result = Users.searchByText(searchText);
    res.write(JSON.stringify(resultData));
    return res.end();
  });
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
    Users.findById(userID, function(err, user) {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured");
        return res.end();
      } else {
        var ticket = req.cookies.ticket;
        if (user.checkTicket(ticket)){
          user = gf.cloneUser(user, true);
          res.writeHead(200, {
            'Content-Type': 'application/json'
          });
          res.write(JSON.stringify(user));
          return res.end();
        } else {
          res.writeHead(401, {
            'Content-Type': 'html/text'
          });
          res.write("Permision denied");
          return res.end();
        }
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
    Channels.findById(channelID, (err, channel) => {
      if (err) {
        console.log("channel not found");
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured: " + err);
        return res.end();
      }
      var channelMessages = channel.getMessages(userID, maxCount, timeStamp);
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify(channelMessages));
      return res.end();
    });
  });
  app.get("/createChannel", function(req, res) {
    var userID = req.query.userid;
    var newChannelName = req.query.name;
    var publicChannel = req.query.public;
    gf.createChannel(userID, newChannelName, publicChannel, function(err, channelData) {
      if (err) {
        res.writeHead(400, {
          'Content-Type': 'application/json'
        });
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify(channelData));
      return res.end();
    });
  });
};
