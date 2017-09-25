var Users = require("./models/users.js");
var Guid = require('./guid');
var gf = require("./generalFunctions.js")

module.exports = function(app, passport) {
  app.post("/signup", function(req, res) {
    var body = req.body;
    if (body.password && body.email){
      Users.findByEmail(body.email, function(error, user){
        if (error){
          var newUser = new Users.User(body.name, body.email, body.password);
          newUser.save();
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(newUser));
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end("User with that email already exists");
        }
      });
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end("email or password missing.");
    }
  });
  app.post("/login", function(req, res) {
    var body = req.body;
    if (body.password && body.email){
      Users.findByEmail(body.email.toLowerCase(), function(error, user){
        if (error)
          throw error;
        var ticket = user.authenticate(body.password);
        if (ticket != null){
          user = gf.cloneUser(user,true);
          user.ticket = ticket;
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(JSON.stringify(user));
        }
      });
    }
  });
};
