'use strict';

angular.module('pace.build')
	.filter('searchTemplate', function() {
		return function(arr, searchTemplateString) {

			if ( ! searchTemplateString) {
				return arr;
			}

			var result = [];

			searchTemplateString = searchTemplateString.toLowerCase();

			angular.forEach(arr, function(product) {

				if (product.options._name.toLowerCase().indexOf(searchTemplateString) !== -1) {
					result.push(product);
				}
				
			});

			return result;
		};

	});