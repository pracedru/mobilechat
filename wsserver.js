var WebSocketServer = require('ws').Server;
var Guid = require('./guid');
var gf = require("./generalFunctions.js");
var Users = require("./models/users.js");
var Channels = require("./models/channels.js");

var wss = null;
exports.webSocketServer = function(server) {
  if (wss == null) {
    wss = new WebSocketServer({
      server: server
    });
    wss.on("connection", function(webSocket) {
      webSocket.on("message", onMessage);
    });
  }
  return wss;
}

function onMessage(data) {
  //console.log("onmsg " + data);
  var dataObject = JSON.parse(data);

  if (dataObject.type == "authenticateRequest"){
    Users.findById(dataObject.userid, (err, user) => {
      if (err)
        throw err;
      if (user==null){
        console.log("user not found");
      }
      try {
        //console.log(dataObject.ticketguid);
        if (user.checkTicket(dataObject.ticketguid)){
          this.removeListener("message", onMessage);
          Channels.findById(dataObject.channelID, (err, channel) => {
            if (channel){
              //console.log("adding socket to channel");
              channel.addWebSocket(this);
            } else {
              console.log("channel not found");
              this.close();
            }
          });

        } else {
          console.log("Ticket rejected: " + dataObject.ticketguid);
        }
      } catch (e){
        console.log("guid or ticket missing " + data );
        this.close();
      }
    });
  }
}
