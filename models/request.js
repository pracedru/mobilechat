var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var RequestSchema = new Schema({
  type: Number,
  sender: {type: ObjectId, ref: 'User'},
  targetUser: {type: ObjectId, ref: 'User'},
  targetChannel: {type: ObjectId, ref: 'Channel'}
});


var RequestType = {
  FriendRequest: 0,
  JoinMyChannelRequest: 1,
  JoinYourChannelRequest: 2
}

RequestSchema.statics.RequestType = function () {
  return RequestType;
}

mongoose.model('Request', RequestSchema);

module.exports = mongoose.model('Request');