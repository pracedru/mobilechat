#!/usr/bin/env node

var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var chatHandler = require('./mobilechathandler.js');
var app = express();
var server = app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})
var wss = require("./wsserver").webSocketServer(server);

var channels = require("./models/channels.js");
var users = require("./models/users.js");
channels.setUsers(users);
users.setChannels(channels);

app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static('./public'));
require("./authroutes.js") (app);
require("./bouncer.js") (app, users);
require("./chatroutes.js") (app);

//app.get('/chat', function(req, res) {
//    chatHandler.handleChat(req, res);
//});

