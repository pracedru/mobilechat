var Users = require("./models/users.js");

module.exports = function(app) {
  app.use((req, res, next) => {
    try {
      var userid = req.cookies.id;
      var ticketguid = req.cookies.ticket;
      user = Users.findById(userid, (err, user) => {
        if (err){
          res.writeHead(401, {
            'Content-Type': 'text/html'
          });
          res.write("User not authorized");
          return res.end();
        } else {
          if (user){
            if (user.checkTicket(ticketguid)){
              next();
            } else {
              res.writeHead(401, {
                'Content-Type': 'text/html'
              });
              res.write("Ticket not accepted: " + ticketguid);
              return res.end();
            }
          }else{
            res.writeHead(401, {
              'Content-Type': 'text/html'
            });
            res.write("User not found");
            return res.end();
          }
        }
      })
    } catch (e){
      res.writeHead(401, {
        'Content-Type': 'text/html'
      });
      res.write("user credentials missing");
      return res.end();
    }
  });
}
