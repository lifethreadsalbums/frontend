'use strict';

angular.module('paceApp')
.directive('paceSearch', ['$timeout', function ($timeout) {
	return {
		link: function(scope, element) {
            var input = element.find('input');
            var clearBtn = element.find('.sidebar-search__clear');

            scope.paceSearchInputChanged = inputChanged;

            input.on('keyUp', inputChanged);
            clearBtn.on('click', clearInput);
            $timeout(inputChanged);

            function inputChanged() {
                if (input.val() !== '') {
                    element.addClass('sidebar-search--mode-clear');
                } else {
                    element.removeClass('sidebar-search--mode-clear');
                }
            }

            function clearInput(e) {
                e && e.preventDefault();
                input.val('');
                input.trigger('change');
                element.removeClass('sidebar-search--mode-clear');
            }
		}
	};
}]);
