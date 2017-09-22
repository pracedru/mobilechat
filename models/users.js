var fs = require('fs');
var Guid = require('../guid');
var bcrypt = require('bcrypt');

usersById = null
usersByEmail = null

User = function(name, email, password){
  this.name = name;
  if (email) this.email = email.toLowerCase();
  if (password){
    this.password = bcrypt.hashSync(password, 10);
  }
  this.id = Guid.new();
  this.myChannels = [];
  this.otherChannels = [];
  this.friends = [];
  this.save = function() {
    var dir = "./data/users/" + this.id;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    var filename = dir + "/config.json";
    fs.writeFile(filename, JSON.stringify(this), function(err) {
      if (err) {
        return console.log(err);
      }
    });
    usersByEmail[this.email] = this;
    usersById[this.id] = this;
  }
  this.public = function(){
    return {
      "name": this.name,
      "myChannels": this.myChannels
    }
  }
  this.deserialize = function(data){
     userData = JSON.parse(data);
     this.name = userData.name;
     this.email = userData.email;
     this.password = userData.password;
     this.id = userData.id;
     this.myChannels = userData.myChannels;
     this.otherChannels = userData.otherChannels;
     this.friends = userData.friends;
  }
  this.authenticate = function (pw){
    if (bcrypt.compareSync(pw, this.password)){
      return true;
    }
    return false;
  }
}


function readAllUsers() {
  console.log("read users");
  usersById = {};
  usersByEmail = {};
  var folder = "./data/users/";
  var files = fs.readdirSync(folder);
  for (var i = 0; i < files.length; i++){
    var userID = files[i];
    var filename = folder + userID + "/config.json";
    fs.readFile(filename, "utf8", function(err, data){
       if(err){
          console.log(err)
       }
       //console.log(data);
       user = new User();
       user.deserialize(data);
       usersById[user.id] = user;
       usersByEmail[user.email] = user;
    })
  }
}

readAllUsers();

module.exports = {
  findByEmail: function(email, done) {
    var user = null;
    var error = null;
    if (email in usersByEmail) {
      user = usersByEmail[email];
    }
    if (user == null){
      error = "user not found";
    }
    done(error, user);
  },
  findById: function(id, done) {
    user = null;
    var error = null;
    if (id in usersById) {
      user = usersById[id];
    }
    if (user == null){
      error = "user not found";
    }
    done(error, user)
  },
  User: User
}
