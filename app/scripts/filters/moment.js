'use strict';

angular.module('paceApp')
    .filter('moment', function () {
        return function (input, format) {
            /* global moment */
            var date = moment(input);

            if (format) {
                return date.format(format);
            }

            return date.calendar(null);
        };
    });
