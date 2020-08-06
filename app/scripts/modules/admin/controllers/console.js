'use strict';

angular.module('pace.admin')
    .controller('ConsoleCtrl', ['$scope', '$http',
        function($scope, $http) {

        	$scope.script = '';
            $scope.runScript = function() {
            	var script = $scope.script.replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\"/g, '\\"');

            	$http.post(apiUrl + 'api/admin/script', {script:$scope.script})
                    .success(function() {

                    })
                    .error(function(err) {

                    });
            };

        }
    ])