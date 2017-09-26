var WebSocketServer = require('ws').Server;
var Guid = require('./guid');
var gf = require("./generalFunctions.js");
var Users = require("./models/users.js");

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
  var dataObject = JSON.parse(data);
  if (dataObject.type == "authenticateRequest"){
    user = Users.findById(dataObject.user.id, (err, user) => {
      if (err)
        throw err;
      try {
        if (user.checkTicket(dataObject.user.ticket.id)){
          user.addWebSocket(this);
        } else {
          console.log("Ticket rejected: " + dataObject.user.ticket.id);
        }
      } catch (e){
        console.log("Id or ticket missing");
        this.close();
      }
    });
  }
}
