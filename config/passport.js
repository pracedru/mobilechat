var LocalStrategy = require("passport-local").Strategy;

var Users = require("../models/users.js")

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use("local-signup", new LocalStrategy({
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    function(req, name, email, password, done) {
      process.nextTick(function() {
        User.findOne({
          "local.email": email
        }, function(err, user) {
          if (err)
            return done(err);
          if (user) {
            return done(null, false, req.flash("signupMessage", "That email already taken"));
          } else {
            var newUser = new Users.User(name, email, password);
            newUser.save(function(err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }
        })
      });
    }
  ));
}
