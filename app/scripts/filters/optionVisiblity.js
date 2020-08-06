'use strict';

angular.module('paceApp')
.filter('optionVisibility', ['$parse', 'ProductService', function ($parse, ProductService) {
    return function (items, product, currentOptionCode) {
        var out = [];
        
        if (items && product) {
            var context = {
                currentOptionCode: currentOptionCode
            };

            for (var i = 0; i < items.length; i++) {
                var item = items[i],
                    visible = true;

                if (item.visibilityExpression) {
                    visible = ProductService.evalExpression(item.visibilityExpression, product, context);                    
                } 
                if (visible && item.children && item.children.length>0) {
                    var children = _.filter(item.children, function(child) {
                        var childVisible = true;
                        if (child.visibilityExpression) 
                            childVisible = ProductService.evalExpression(child.visibilityExpression, product, context);
                        return childVisible;
                    });
                    visible = (children.length>0);
                }
                if (visible) out.push(item);
            }
        }

        return out;
    };
}]);
