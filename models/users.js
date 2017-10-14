var Guid = require('../guid');
var bcrypt = require('bcrypt');
var Channels = require('./channels.js');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Ticket = function(){
  this.timestamp = Date.now();
  this.guid = Guid.new();
}

var UserSchema = new Schema({
  friends: [{type: ObjectId, ref: 'User'}],
  tickets: [{timestamp: {type: Date, required: true}, guid: String}],
  myChannels: [{type: ObjectId, ref: 'Channel'}],
  otherChannels: [{type: ObjectId, ref: 'Channel'}],
  requests: [{type: ObjectId, ref: 'Request'}],
  email: { type: String, unique: true, required: true, dropDups: true },
  passHash: { type: String, required: true},
  name: { type: String, required: true}
});

UserSchema.methods.authenticate = function (password, callback){
  if (bcrypt.compareSync(password, this.passHash)){
    var ticket = new Ticket();
    this.tickets.push(ticket);
    this.save();
    return callback(null, this.tickets[this.tickets.length-1]);
  }
  return callback("Authentication failed", null);
}

UserSchema.methods.checkTicket = function (ticketguid){
  //console.log(ticketguid);
  for (var i = 0; i < this.tickets.length; i++) {
    if (this.tickets[i].guid == ticketguid) {
      return true;
    }
  }
  return false;
}

UserSchema.statics.searchByText = function (text, done){
  var result = [];
  mongoose.model('User').find( {}, (err, users) => {
    if (err) return done(err, null);
    return done(null, users);
  });

}

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');

