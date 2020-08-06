'use strict';

angular.module('paceApp')
.filter('parentOption', function () {
    return function (items, parentItemCode, parentOptionCode) {
        var out = [];
        //TODO: check against parentOptionCode too
        if (parentItemCode && items) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.parent && item.parent.code===parentItemCode) {
                    out.push(item);
                }
            }
        }
        return out;
    };
});
