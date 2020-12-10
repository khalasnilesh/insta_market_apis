angular.module('companies').controller('CompaniesController', ['$scope', '$routeParams', '$location', 'Authentication', 'Companies',
    function($scope, $routeParams, $location, Authentication, Companies) {
        $scope.authentication = Authentication;

      /*  Company created durng user account creation
      $scope.create = function() {
            var company = new Companies({
                title: this.title,
                comment: this.comment
            });

            company.$save(function(response) {
                $location.path('companies/' + response._id);
            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        }; */

        $scope.addTag = function() {
          $http.post('companies/' +$scope.company._id+ '/tags', $scope.tag)
          .then( function(response) {
              $scope.company=response.data;
            }, 
            function(errorResponse) {
              $scope.error = errorResponse.data.message;
          });
        }

        $scope.find = function() {
            $scope.companies = Companies.query();
        };

        $scope.findOne = function() {
            $scope.company = Companies.get({
                companyId: $routeParams.companyId
            });
        };

        $scope.update = function() {
            $scope.company.$update(function() {
                $location.path('companies/' + $scope.company._id);
            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        $scope.delete = function(company) {
            if (company) {
                company.$remove(function() {
                    for (var i in $scope.companies) {
                        if ($scope.companies[i] === company) {
                            $scope.companies.splice(i, 1);
                        }
                    }
                });
            } else {
                $scope.company.$remove(function() {
                    $location.path('companies');
                });
            }
        };
    }
]);
