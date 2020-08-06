'use strict';

angular.module('paceApp')
	.directive('spinner', [function () {
		return {
			restrict: 'E',
			replace: true,
			template:'<span class="spinner-container"></span>',
			link: function postLink(scope, element, attrs) {
				var defaults = {
                    lines: 12,
                    length: 14,
                    width: 6,
                    radius: 12,
                    top: 'auto', 
    				left: 'auto',
                    color: '#4d4d4d'
                };
                var props = {};
                _.each(attrs, function(v,k) { 
                    var val = parseInt(v);
                    props[k] = isNaN(val) ? v : val;
                });
                element.spin(_.defaults(props, defaults));
			}
		};

	}]);
