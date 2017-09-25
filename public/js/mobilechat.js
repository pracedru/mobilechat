/* eslint no-alert: 0 */

'use strict';
var currentChannelID = "";
var ws = null;
var user = null;
try{
  user = JSON.parse(localStorage.getItem('user'));
} catch (e){
  console.log(e);
}
//console.log("user id: " + userID);

var app = angular.module('mobileChat', [
  'ngRoute',
  'mobile-angular-ui',
  'mobile-angular-ui.gestures',
  'ngAnimate',
  'ngWebSocket'
]);

app.run(function($transform) {
  window.$transform = $transform;
});

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/options', {
    templateUrl: 'options.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/channel', {
    templateUrl: 'channel.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/createchannel', {
    templateUrl: 'createchannel.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/login', {
    templateUrl: 'login.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/signup', {
    templateUrl: 'signup.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/friends', {
    templateUrl: 'friends.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/user', {
    templateUrl: 'user.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/friends', {
    templateUrl: 'friends.html',
    reloadOnSearch: false
  });
});

app.controller('MainController', ['$location', '$http', '$scope', '$interval', function($location, $http, $scope, $interval) {
  $scope.userShown = true;
  $scope.loginShown = true;
  $scope.signupShown = true;
  $scope.newmessage = "";
  $scope.inputEnabled = false;
  $scope.newchannelname = "";
  $scope.publicChannel = false;
  $scope.createChannelEnabled = true;
  $scope.searchEnabled = false;
  $scope.optionsEnabled = false;

  $scope.goChannel = function($event, channel) {
    currentChannelID = channel.id;
    $location.path("channel");
  };

  $scope.sendMessage = function($event) {
    if ($event instanceof KeyboardEvent) {
      if (!($event.keyCode == 13)) return;
    }
    var sc = this;

    if (this.newmessage != "") {
      var msgData = {
        "userid": user.id,
        "message": this.newmessage,
        "channelid": currentChannelID,
        "type": "addMessage"
      };
      /*$http({
        url: "sendMessage",
        method: "GET",
        params: msgData
      }).then(function success(response) {
        sc.newmessage = "";
      });*/
      if(ws){
        ws.send(JSON.stringify(msgData));
        sc.newmessage = "";
      }
    }
  }
  $scope.createChannel = function() {
    if (this.newchannelname != "") {
      $http({
        url: "createChannel",
        method: "GET",
        params: {
          "userid": user.id,
          "name": this.newchannelname,
          "public": this.publicChannel
        }
      }).then(function success(response) {
        //console.log(response);
        $scope.user.myChannels.push(response.data)
        localStorage.setItem('user', JSON.stringify(user));
        $location.path("");
      });
    }
  };
  $scope.updateUserData = function() {
    $http({
      url: "userdata",
      method: "GET",
      params: {
        "userid": user.id
      }
    }).then(function success(response) {
      $scope.user = response.data;
    });
  }

  if (user==null){
    $location.path("login");
    $scope.userShown = false;
  } else {
    $scope.user = user;
    $scope.loginShown = false;
    $scope.signupShown = false;
  }

  $scope.$on("$routeChangeStart", function(event, next, current) {
    if (next) {
      $scope.createChannelEnabled = false;
      $scope.optionsEnabled = false;
      $scope.searchEnabled = false;
      $scope.inputEnabled = false;
      var body = document.getElementsByTagName('body')[0];
      body.classList.remove("has-extended-navbar-bottom");
      if (user==null){
        if (next.originalPath != "/signup") {
          $location.path("login");
        }
        $scope.userShown = false;
        $scope.loginShown = true;
        $scope.signupShown = true;
      } else {
        $scope.user = user;
        $scope.userShown = true;
        $scope.loginShown = false;
        $scope.signupShown = false;
      }
      if (next.originalPath == "/channel") {
        $scope.optionsEnabled = true;
        $scope.inputEnabled = true;
        body.classList.add("has-extended-navbar-bottom");
      } else if(next.originalPath == "/") {
        $scope.createChannelEnabled = true;
      } else if(next.originalPath == "/friends") {
        $scope.searchEnabled = true;
      } else {
        $scope.inputEnabled = false;
      }
    }
  });
}]);
