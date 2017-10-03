/* eslint no-alert: 0 */

'use strict';
var currentChannelID = "";
var ws = null;
var user = null;
try {
  user = JSON.parse(localStorage.getItem('user'));
} catch (e) {
  console.log(e);
}
//console.log("user id: " + userID);

var app = angular.module('mobileChat', [
  'ngRoute',
  'mobile-angular-ui',
  'mobile-angular-ui.gestures',
  'ngAnimate',
  'ngWebSocket',
  'ngCookies'
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
  $routeProvider.when('/usersearch', {
    templateUrl: 'usersearch.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/requests', {
    templateUrl: 'requests.html',
    reloadOnSearch: false
  });
});

app.controller('MainController', ['$location', '$http', '$scope', '$cookies', function($location, $http, $scope, $cookies) {
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
  $scope.invitefriendEnabled = false;
  $scope.usersearchtext = "";
  $scope.userSearchList = [];

  $scope.userSearch = ($event) => {
    if ($event instanceof KeyboardEvent) {
      if (!($event.keyCode == 13)) return;
    }
    var usersearchtext = this.usersearchtext;
    $http({
      url: "userSearch",
      method: "GET",
      params: {
        "searchText": usersearchtext
      }
    }).then(function success(response) {
      $scope.userSearchList = response.data.result;
    });
  };

  $scope.goChannel = function($event, channel) {
    currentChannelID = channel.id;
    $location.path("channel");
  };
  $scope.addFriend = (user) => {
    $http({
      url: "addFriend",
      method: "GET",
      params: {
        "id": user.id
      }
    }).then(function success(response) {
      console.log(response.data);
      $scope.updateUserData();
    }, (response)=> {
      console.log(response.data);
    });
  };
  $scope.addFriendToChannel = (user) => {
    $http({
      url: "addFriendToChannel",
      method: "GET",
      params: {
        "friendid": user.id,
        "channelid": currentChannelID
      }
    }).then(function success(response) {
      console.log(response.data);
      $scope.updateUserData();
    }, (response)=> {
      console.log(response.data);
    });
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
      if (ws) {
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
      //console.log(response.data);
      var ticket = $scope.user.ticket;
      $scope.user = response.data;
      user = $scope.user;
      user.ticket = ticket;
    }, (responce)=>{
      $location.path("login");
    });
  }


  if (user == null) {
    $location.path("login");
    $scope.userShown = false;
  } else {
    $scope.user = user;
    $scope.loginShown = false;
    $scope.signupShown = false;
    $scope.updateUserData();
    try {
      $cookies.put("id", user.id);
      $cookies.put("ticket", user.ticket.id);
    } catch (e) {
    }
  }


  $scope.$on("$routeChangeStart", function(event, next, current) {
    if (next) {
      $scope.createChannelEnabled = false;
      $scope.optionsEnabled = false;
      $scope.searchEnabled = false;
      $scope.inputEnabled = false;
      $scope.invitefriendEnabled = false;
      var body = document.getElementsByTagName('body')[0];
      body.classList.remove("has-extended-navbar-bottom");
      if (user == null) {
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
        $scope.invitefriendEnabled = true;
        body.classList.add("has-extended-navbar-bottom");
      } else if (next.originalPath == "/" || next.originalPath == "/home") {
        $scope.createChannelEnabled = true;
        $scope.updateUserData();
      } else if (next.originalPath == "/friends") {
        $scope.searchEnabled = true;
      } else {
        $scope.inputEnabled = false;
      }
    }
  });
}]);
