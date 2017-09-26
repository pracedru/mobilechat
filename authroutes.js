var Users = require("./models/users.js");
var Guid = require('./guid');
var gf = require("./generalFunctions.js")

module.exports = function(app) {
  app.post("/signup", function(req, res) {
    var body = req.body;
    if (body.password && body.email){
      Users.findByEmail(body.email, function(error, user){
        if (error){
          var newUser = new Users.User(body.name, body.email, body.password);
          var ticket = newUser.authenticate(body.password);
          newUser = gf.cloneUser(newUser,true);
          newUser.ticket = ticket;          
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
        if (error){
          res.writeHead(401, { 'Content-Type': 'text/html' });
          return res.end(error);
        }
        if (user){
          var ticket = user.authenticate(body.password);
          if (ticket != null){
            user = gf.cloneUser(user,true);
            user.ticket = ticket;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(JSON.stringify(user));
          } else {
            res.writeHead(401, { 'Content-Type': 'text/html' });
            res.end("Username or password is wrong");
          }
        } else {
          res.writeHead(401, { 'Content-Type': 'text/html' });
          res.end("Username or password is wrong");
        }
      });
    }
  });
};
