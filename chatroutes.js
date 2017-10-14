var fs = require('fs');
var Guid = require('./guid');
var Users = require("./models/users.js");
var Channels = require("./models/channels.js");
var gf = require("./generalFunctions.js")
var Requests = require("./models/request.js");

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
                  var request = new Requests({type: Requests.RequestType().JoinMyChannelRequest, sender: requestid, targetChannel: channelid});
                  request.save();
                  targetUser.requests.push(request._id);
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
                var request = new Requests({type: Requests.RequestType().FriendRequest, sender: requestid, targetUser: targetid});
                request.save();
                targetUser.requests.push(request._id);
                //targetUser.friends.push(requestUser.id);
                targetUser.save();
                //requestUser.friends.push(targetUser.id);
                //requestUser.save();
                console.log("Friend request added");
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
            } else {
              res.writeHead(400, {
                'Content-Type': 'text/html'
              });
              res.write("target user not found." + targetid);
              return res.end();
            }
          });
        } else {
          res.writeHead(400, {
            'Content-Type': 'text/html'
          });
          res.write("request user not found." + requestid);
          return res.end();
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

    var resultData = {};
    Users.searchByText(searchText, (err, users)=>{
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured");
        return res.end();
      } else {
        resultData.result = users;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resultData));
        return res.end();
      }
    });
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
    var userID = req.cookies.id;
    Users.findById(userID).
        populate("myChannels").
        populate("otherChannels").
        populate({
          path: "requests",
          populate: [
            {
              path: "sender",
              select: "name"
            },
            {
              path: "targetChannel",
              select: "name"
            }
          ]
        }).
        populate("friends").exec( (err, user) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured");
        return res.end();
      } else if(user==null) {
        res.writeHead(400, {
          'Content-Type': 'text/html'
        });
        res.write("User not found " + userID);
        return res.end();
      } else {
        var ticketGUID = req.cookies.ticket;
        if (user.checkTicket(ticketGUID)){
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(user));
          return res.end();

        } else {
          res.writeHead(401, {'Content-Type': 'html/text'});
          res.write("Permision denied");
          return res.end();
        }
      }
    });
  });
  app.get("/channelData", function(req, res) {
    var userID = req.query.userid;
    var channelID = req.query.channelid;
    var channelData = gf.getChannelData(channelID, false, (err, channelData) => {
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
        res.write("Error on server occured: " + err);
        return res.end();
      }
    });
  });
  app.get("/channelMessages", function(req, res) {
    var userID = req.query.userid;
    var channelID = req.query.channelid;
    var timeStamp = req.query.timeStamp;
    var maxCount = req.query.maxCount;
    //console.log("channelid: " + channelID);
    Channels.findById(channelID, (err, channel) => {
      if (err || channel==null) {
        console.log("channel not found");
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured: " + err);
        return res.end();
      }

      var channelMessages = channel.getMessages(userID, maxCount, timeStamp, (err, messages)=>{
        if(err){
          console.log("Error");
          res.writeHead(500, {
            'Content-Type': 'text/html'
          });
          return res.end();
        } else if(messages==null){
          console.log("Error");
          res.writeHead(500, {
            'Content-Type': 'text/html'
          });
          return res.end();
        } else {
          messagesData = {
            "timeStamp": Date.now(),
            "channelMessages": messages
          };
          res.writeHead(200, {
            'Content-Type': 'application/json'
          });
          res.write(JSON.stringify(messagesData));
          return res.end();
        }
      });
    });
  });
  app.get("/createChannel", function(req, res) {
    var userID = req.cookies.id;
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
  app.get("/acceptRequest", function(req, res) {
    var userID = req.cookies.id;
    var requestdata = JSON.parse(req.query.request);
    //console.log(req.query.request);
    Users.findById(userID, (err, user) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.write("Error on server occured: " + err);
        return res.end();
      } else if (user == null){
        res.writeHead(400, {
          'Content-Type': 'text/html'
        });
        res.write("User not found: " + userID);
        return res.end();
      } else {
        Requests.findById(requestdata._id, (err, request) => {
          if (err) {
            res.writeHead(500, {
              'Content-Type': 'text/html'
            });
            res.write("Error on server occured: " + err);
            return res.end();
          } else if(request==null) {
            res.writeHead(400, {
              'Content-Type': 'text/html'
            });
            res.write("Request not found: " + requestdata._id);
            return res.end();
          } else {
            if (request.type == Requests.RequestType().JoinMyChannelRequest){
              Channels.findById(request.targetChannel, (err, channel) => {
                if (err) {
                  res.writeHead(500, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Error on server occured: " + err);
                  return res.end();
                } else if(request==null) {
                  res.writeHead(400, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Channel not found: " + request.targetChannel);
                  return res.end();
                } else {
                  channel.users.push(user._id);
                  channel.save();
                  var index = user.requests.indexOf(request._id);
                  user.requests.splice(index, 1);
                  user.otherChannels.push(channel._id);
                  user.save();
                  res.writeHead(200, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Success");
                  return res.end();
                }
              });
            } else if (request.type == Requests.RequestType().FriendRequest){
              Users.findById(request.sender, (err, senderUser) => {
                if (err) {
                  res.writeHead(500, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Error on server occured: " + err);
                  return res.end();
                } else if(senderUser==null) {
                  res.writeHead(400, {
                    'Content-Type': 'text/html'
                  });
                  res.write("User not found: " + request.sender);
                  return res.end();
                } else {
                  senderUser.friends.push(user._id);
                  senderUser.save();
                  var index = user.requests.indexOf(request._id);
                  user.requests.splice(index, 1);
                  user.friends.push(senderUser._id);
                  user.save();
                  res.writeHead(200, {
                    'Content-Type': 'text/html'
                  });
                  res.write("Success");
                  return res.end();
                }
              });
            }
          }
        });
      }
    });
  });
};
