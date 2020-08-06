'use strict';

angular.module('paceApp')
    .filter('truncate', function () {
        return function (text, length, end) {
            length = length || 10;
            end = end || "…";

            if (text.length <= length || text.length - end.length <= length || !angular.isString(text)) {
                return text;
            }
            else {
                return String(text).substring(0, length-end.length) + end;
            }
 
        };
    });