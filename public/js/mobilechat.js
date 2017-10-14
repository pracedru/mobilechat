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
  $scope.formTitle = "Accept invitation";
  $scope.formCaption = "Hello";
  $scope.requestObject = null;

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
    currentChannelID = channel._id;
    $location.path("channel");
  };
  $scope.addFriend = (user) => {
    $http({
      url: "addFriend",
      method: "GET",
      params: {
        "id": user._id
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
        "friendid": user._id,
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
        "userid": user._id,
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
    }).then(function success(response) {
      $scope.user = response.data;
      user = $scope.user;
    }, (responce)=>{
      //$cookies.put("ticket",null);
      //$cookies.put("id",null);
      $location.path("login");
    });
  }

  $scope.acceptRequest = function(){
    $http({
      url: "acceptRequest",
      method: "GET",
      params: {
        "request": this.requestObject
      }
    }).then(function success(response) {
      var index = $scope.user.requests.indexOf($scope.requestObject);
      $scope.user.requests.splice(index, 1);
    }, function (response){
      console.log(response);
    });
  }

  $scope.dismissRequest = function(request) {
    var index = $scope.user.requests.indexOf(request);
    //console.log("request dismissed " + index + request.sender.name);
    $scope.user.requests.splice(index, 1);
  }

  $scope.setRequestObject = function(request){
    $scope.requestObject = request;
    if (request.type == 1){
      $scope.formCaption = "Your frind " + request.sender.name + " invites you to his channel " + request.targetChannel.name;
    } else if (request.type == 0){
      $scope.formCaption = request.sender.name + " wants to be your friend.";
    }
  }

  if ($cookies.get("id") == null || $cookies.get("ticket") == null ) {
    $location.path("login");
    $scope.userShown = false;
  } else {
    $scope.user = user;
    $scope.loginShown = false;
    $scope.signupShown = false;
    $scope.updateUserData();
    try {
      //console.log("id: " + user._id);

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
      if ($cookies.get("id") == null || $cookies.get("ticket") == null) {
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

app.directive('dragToDismiss', function($drag, $parse, $timeout) {
  return {
    restrict: 'A',
    compile: function(elem, attrs) {
      var dismissFn = $parse(attrs.dragToDismiss);
      return function(scope, elem) {
        var dismiss = false;

        $drag.bind(elem, {
          transform: $drag.TRANSLATE_RIGHT,
          move: function(drag) {
            if (drag.distanceX >= drag.rect.width / 4) {
              dismiss = true;
              elem.addClass('dismiss');
            } else {
              dismiss = false;
              elem.removeClass('dismiss');
            }
          },
          cancel: function() {
            elem.removeClass('dismiss');
          },
          end: function(drag) {
            if (dismiss) {
              elem.addClass('dismitted');
              $timeout(function() {
                scope.$apply(function() {
                  dismissFn(scope);
                });
              }, 30);
            } else {
              drag.reset();
            }
          }
        });
      };
    }
  };
});