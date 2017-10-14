var Guid = require('./guid');
var bcrypt = require('bcrypt');
var gf = require("./generalFunctions.js");
var Users = require("./models/users.js");

module.exports = function(app) {
  app.post("/signup", function(req, res) {
    var body = req.body;

    if (body.password && body.email){
      Users.findOne({email: body.email}, function (error, user){ //Users.findByEmail(body.email, function(error, user){
        if (!user){
          console.log(bcrypt.hashSync(body.password, 10));
          var newUser = new Users({name: body.name, email: body.email, passHash: bcrypt.hashSync(body.password, 10)});
          newUser.save();
          newUser.authenticate(body.password, (error, ticket)=>{
            if (error){
              res.writeHead(500, {'Content-Type': 'text/html'});
              res.write("Error on server occured: " + error);
              return res.end();
            } else {
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({ticket: ticket, id: newUser._id}));
            }
          });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          console.log(error);
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
      Users.findOne({email: body.email.toLowerCase()}, function(error, user){
        if (error){
          res.writeHead(500, { 'Content-Type': 'text/html' });
          return res.end("server error: " + error);
        }
        if (user){
          user.authenticate(body.password, (error, ticket) => {
            if (ticket != null){
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(JSON.stringify({ticket: ticket, id: user._id}));
            } else {
              res.writeHead(401, { 'Content-Type': 'text/html' });
              res.end("Username or password is wrong");
            }
          });
        } else {
          res.writeHead(401, { 'Content-Type': 'text/html' });
          res.end("Username or password is wrong");
        }
      });
    }
  });
};
