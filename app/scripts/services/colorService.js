'use strict';

angular.module('paceApp')
.service('ColorService', [ function ColorService() {


    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    this.rgbToHex = function(red, green, blue) {
        return "#" + componentToHex(red) + componentToHex(green) + componentToHex(blue);
    }

    this.hexToRgb = function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    this.isNeighborColor = function(color1, color2, tolerance) {
        tolerance = tolerance || 16;
        return Math.abs(color1.r - color2.r) <= tolerance
            && Math.abs(color1.g - color2.g) <= tolerance
            && Math.abs(color1.b - color2.b) <= tolerance;
    };
           
}]);
