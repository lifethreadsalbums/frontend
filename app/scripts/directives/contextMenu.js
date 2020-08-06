'use strict';

angular.module('paceApp')
.directive('contextMenu', ['$parse', '$q', function ($parse, $q) {
    return {
        restrict: 'A',
        priority: 1000,
        link: function(scope, element, attrs) {
            
            var theme = attrs.contextMenuTheme,
                menuItemsFn = $parse(attrs.contextMenu),
                callback = $parse(attrs.contextMenuClick).bind(null, scope),
                trigger = (attrs.trigger) ? attrs.trigger : 'right';
          
            element.attr('data-context-menu-id', _.uniqueId('context-menu-'));

            $.contextMenu({
                selector: '[data-context-menu-id="' + element.data('context-menu-id') + '"]',
                trigger: trigger,
                zIndex: 1000,
                className: theme,
                callback: function(key, opt) {
                    callback({key:key});
                },
                build: function($triggerElement, e) {
                    menuItemsFn = $parse(attrs.contextMenu);
                
                    var items = menuItemsFn(scope);
                    //console.log('items', items);
                    return { items: items }
                },
            });
            
        }
    };
}]);

$.contextMenu.types.header = function(item, opt, root) {
    $('<span>' + item.name + '</span>').appendTo(this);
    this.addClass('context-menu-header not-selectable');
};
