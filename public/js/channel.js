app.controller('ChannelController', ['$location', '$http', '$scope', '$websocket', '$cookies', function($location, $http, $scope, $websocket, $cookies) {
  ws = $websocket("ws://" + location.host);
  ws.onError( (e) => {
    console.log("ws error");
  });
  ws.onOpen(function(){
    var authenticateRequest = {
      'userid': $cookies.get("id"),
      'ticketguid': $cookies.get("ticket"),
      'type': "authenticateRequest",
      'channelID': currentChannelID
    }
    this.send(JSON.stringify(authenticateRequest));
  });
  ws.onMessage (function(msg){
    //console.log(msg.data);
    var messageData = JSON.parse(msg.data);
    switch (messageData.type)
    {
      case "messageRelay":
        //console.log("Pushing message");
        var data = {
          sender : { name: messageData.name },
          text: messageData.message,
          timeStamp: messageData.timestamp
        }
        $scope.channelMessages.push(data);
        $location.hash('msg' + messageData.timestamp);
        break;
    }
  });
  ws.onClose ( function(){
    if (ws != null){
      ws = null;
      $location.path("");
    }
  });

  $scope.channelMessages = [];
  if (currentChannelID == "") return;

  $scope.gotoBottom = function() {
    if ($scope.channelMessages.length > 0){
      var timeStamp = $scope.channelMessages[$scope.channelMessages.length - 1].timestamp;
      $location.hash('msg' + timeStamp);
    }
  }
  $http({
    url: "channelData",
    method: "GET",
    params: {
      "userid": user.id,
      "channelid": currentChannelID
    }
  }).then(function success(response) {
    $scope.channel = response.data;
  }, (response) => {
    console.log(response.data);
    console.log(response.statusText);
    $location.path("login");
  });
  $http({
    url: "channelMessages",
    method: "GET",
    params: {
      "userid": user.id,
      "channelid": currentChannelID,
      "maxCount": 10,
      "timeStamp": 0
    }
  }).then(function success(response) {
    //console.log(response.data);
    $scope.channelMessages = response.data.channelMessages;
    $scope.channel.timeStamp = response.data.timestamp;
    $scope.gotoBottom();
  }, (response) => {
    console.log(response.data);
    console.log(response.statusText);
    $location.path("login");

  });
  // Update messages
  //var promise = $interval($scope.updateChannel, 2000);
  //$scope.stop = function() {
  //  $interval.cancel(promise);
  //};
  $scope.$on("$destroy", function() {
    if (ws){
      var webSocket = ws;
      ws = null;
      webSocket.close();
    }
  });
}]);


