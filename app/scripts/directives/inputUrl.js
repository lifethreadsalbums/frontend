'use strict';

angular.module('paceApp')
.directive('inputUrl', function () {
	return {
		require: "ngModel",
		link: function(scope, elm, attrs, ctrl){
			var regex=/^((https?|ftp):\/\/|(www|ftp)\.)[a-z0-9-]+(\.[a-z0-9-]+)+([\/?].*)?$/;
			var protRegex = /^http(?:s)?\:\/\/.?/i;
			var wwwRegex = /^http(?:s)?\:\/\/www\..?/i;
			ctrl.$parsers.unshift(function(viewValue) {
				if (!protRegex.test(viewValue))
					viewValue = "http://" + viewValue;
				
				if(regex.test(viewValue)){
					ctrl.$setValidity('url',true);
				} else{
					ctrl.$setValidity('url',false);
				}
				
				return viewValue;
			});
			elm.bind('blur', function() {

				if (ctrl.$viewValue && !wwwRegex.test(ctrl.$viewValue) && !protRegex.test(ctrl.$viewValue))
					elm.val("http://www." + ctrl.$viewValue);
				else if (ctrl.$viewValue && !protRegex.test(ctrl.$viewValue))
					elm.val("http://" + ctrl.$viewValue);
			});
			
		}
	};
});
