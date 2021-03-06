#!/usr/bin/env node

var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var chatHandler = require('./mobilechathandler.js');
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/mc", { useMongoClient: true });
var app = express();

var server = app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})
var wss = require("./wsserver").webSocketServer(server);


app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static('./public'));
require("./authroutes.js") (app);
require("./bouncer.js") (app);
require("./chatroutes.js") (app);


//app.get('/chat', function(req, res) {
//    chatHandler.handleChat(req, res);
//});

