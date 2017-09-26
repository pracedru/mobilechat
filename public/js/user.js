app.controller('UserController', ['$location', '$http', '$scope', '$cookies', function($location, $http, $scope, $cookies) {
  $scope.name = "";
  $scope.email = "";
  $scope.password = "";
  $scope.rememberMe = true;
  $scope.error = "";
  $scope.signup = function (){
    console.log("before signup");
    $http({
      url: "signup",
      method: "POST",
      data: {
        "name": this.name,
        "email": this.email,
        "password": this.password
      }
    }).then(function success(response) {
      console.log("Success");
      console.log(response);
      user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      $cookies.put("id", user.id);
      $cookies.put("ticket", user.ticket.id);
      $location.path("");
    }, function error(response) {
      console.log("Error");
      console.log(response);
      $scope.error = response.data;
    });
  }

  $scope.login = function() {
    console.log("before login");
    $http({
      url: "login",
      method: "POST",
      data: {
        "email": this.email,
        "password": this.password
      }
    }).then(function success(response) {
      //console.log("Success");
      //console.log(response);
      user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      $cookies.put("id", user.id);
      $cookies.put("ticket", user.ticket.id);
      $location.path("");
    }, function error(response) {
      console.log("Error");
      console.log(response);
      $scope.error = response.data;
    });
  }
  $scope.logout = function(){
    user = null;
    localStorage.setItem('user', null);
    $location.path("login");
  }
}]);
