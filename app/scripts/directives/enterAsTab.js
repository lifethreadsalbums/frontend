'use strict';

angular.module('paceApp').directive('enterAsTab', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                element.emulateTab();
                event.preventDefault();
            }
        });
    };
});