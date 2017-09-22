#!/usr/bin/env node

var express = require('express');
var passport = require("passport");
var flash = require("connect-flash");
var bodyParser = require('body-parser');
var chatHandler = require('./mobilechathandler.js');

var app = express();
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require("./config/passport.js")(passport);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static('./public'));

require("./chatroutes.js") (app, passport);
require("./authroutes.js") (app, passport);
//app.get('/chat', function(req, res) {
//    chatHandler.handleChat(req, res);
//});
var i = 20;

app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})
