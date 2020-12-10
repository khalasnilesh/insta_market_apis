

var app = angular.module('listingApp', ["ngRoute"]);
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "speedcreateform.html",
        controller  : "listingCtrl"
    })
    .when("/result", {
        templateUrl : "speedcreateresult.html",
        controller  : "listingCtrl"
    });
});
app.controller('listingCtrl', function($scope,$http) {
    $scope.parks = [
    {park : "001", name: "South Congress"},
    {park : "002", name: "East 7th Street"},
    {park : "003", name: "Convention Center"}
    ];

    $scope.sendData = function () {
        var data = {
          companyName: $scope.companyName,
          description: $scope.description,
          avatar: $scope.avatar,
          featuredDish: $scope.featuredDish,
          hours: $scope.hours,
          schedule: $scope.schedule,
          foodPark: $scope.foodPark
        };
        $http.post('http://45.55.180.220:3000/vendors', data)
        .then(function (data, status, headers, config) {
            $scope.PostDataResponse = data;
        }
        , function (data, status, header, config) {
            $scope.ResponseDetails = "Data: " + data +
                "<hr />status: " + status +
                "<hr />headers: " + header +
                "<hr />config: " + config;
          }
        );
    };
  });
