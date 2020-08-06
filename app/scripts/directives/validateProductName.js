'use strict';

angular.module('paceApp')
.directive('validateProductName', ['Product', function(Product) { 

	return {
		require: 'ngModel', 
		link: function(scope, elm, attrs, ngModelCtrl) {

			var original; 

			ngModelCtrl.$formatters.unshift(function(modelValue) {
				original = modelValue;
				return modelValue; 
			});

			ngModelCtrl.$parsers.push(function(value) {
				if (value && value!==original) {
					Product.getMyProducts({name:value}, function(products) {
						ngModelCtrl.$setValidity('unique', products.length===0);
					});
				}
				return value;
			}); 

		}
	};
	
}]);