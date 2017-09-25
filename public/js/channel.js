app.controller('ChannelController', ['$location', '$http', '$scope', '$websocket', function($location, $http, $scope, $websocket) {

  ws = $websocket("ws://" + location.host);

  ws.onError( (e) => {
    console.log("ws error");
  });
  ws.onOpen(function(){
    var authenticateRequest = {
      'user': user,
      'type': "authenticateRequest"
    }
    this.send(JSON.stringify(authenticateRequest));
  });
  ws.onMessage (function(msg){
    var messageData = JSON.parse(msg.data);
    switch (messageData.type)
    {
      case "messageRelay":
        //console.log("Pushing message");
        $scope.channelMessages.push({name: messageData.name, text: messageData.message, timeStamp: messageData.timestamp});
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
  $scope.updateChannel = function() {
    $http({
      url: "channelMessages",
      method: "GET",
      params: {
        "userid": user.id,
        "channelid": currentChannelID,
        "maxCount": 10,
        "timeStamp": $scope.channel.timeStamp
      }
    }).then(function success(response) {
      $scope.channelMessages.push.apply($scope.channelMessages, response.data.channelMessages);
      $scope.channel.timeStamp = response.data.timeStamp;
      if (response.data.channelMessages.length > 0) $scope.gotoBottom();
    });
  }
  $scope.gotoBottom = function() {
    if ($scope.channelMessages.length > 0){
      var timeStamp = $scope.channelMessages[$scope.channelMessages.length - 1].timeStamp;
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
    $scope.channel.timeStamp = response.data.timeStamp;
    $scope.gotoBottom();
  });
  // Update messages
  //var promise = $interval($scope.updateChannel, 2000);
  //$scope.stop = function() {
  //  $interval.cancel(promise);
  //};
  $scope.$on("$destroy", function() {
    var webSocket = ws;
    ws = null;
    webSocket.close();    
  });
}]);
