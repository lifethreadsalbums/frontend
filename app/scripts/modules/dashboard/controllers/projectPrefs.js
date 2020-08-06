'use strict';

angular.module('pace.dashboard')
    .controller('ProjectPrefsCtrl', ['$scope', '$state', '_', 'productSettings', 'product', 'userSettings', '$q', 'theme',
        function ($scope, $state, _, productSettings, product, userSettings, $q, theme) {
            $scope.theme = theme;

            var products = [product].concat(product.children);
            $scope.titles = _.map(products, function(p) {
                return p.options._name;
            });

        	_.each(_.zip(products, productSettings), function(val) {
                val[1].product = val[0];
                var settings = angular.copy(userSettings.settings);
                val[1].settings = _.extend(settings, val[1].settings);
            });
        	var master = angular.copy( _.pluck(productSettings, 'settings') );
        	$scope.productSettings = productSettings;
        
	        $scope.reset = function() {
                _.each( _.zip(master, productSettings), function(val) {
                    val[1].settings = angular.copy(val[0]);
                });
	        };

	        $scope.isChanged = function() {
	            return !angular.equals(_.pluck(productSettings, 'settings'), master);
	        };

	        $scope.save = function() {
                //TODO: optimize to one call
	            var done = function(value) {
	                master = angular.copy( _.pluck(productSettings, 'settings') );
	                $scope.saving = false;
	            };
	            $scope.$saving = true;
	            var promises = _.map(productSettings, function(settings) {
                    return settings.$save();
                });
                $q.all(promises, done);
	        };

            $scope.bgColor = {
                color: '#65a9de'
            }

            $scope.stroke = {
                color: '#65a9de',
                stroke: '5pt'
            }
        }
    ]);