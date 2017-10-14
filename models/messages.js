var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MessageSchema = Schema({
  text: String,
  timestamp: {type: Date, required: true},
  sender: {type: ObjectId, ref: 'User'}
});

mongoose.model('Message', MessageSchema);

module.exports = mongoose.model('Message');