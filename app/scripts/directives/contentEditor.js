'use strict';

angular.module('paceApp')
.directive('contenteditor', ['$parse', function ($parse) {
    return {
        templateUrl: 'views/components/contentEditor.html',
        replace: true,
        restrict: 'E',
        scope: true,
        transclude:true,
        link: function postLink(scope, element, attrs) {
            var $toolLink = $('.tool-link'),
                $toolLinkOnInput = $('input[name="switch-x"][value="on"]'),
                $toolLinkOffInput = $('input[name="switch-x"][value="off"]'),
                $toolLinkStateDesctiption = $toolLink.find('.state-description');

            scope.fonts = $parse(attrs.fonts)(scope);
            
            function onToolLinkInputChange() {
                if ($toolLinkOnInput.is(':checked')) {
                    if (attrs.onText)
                        $toolLinkStateDesctiption.text(attrs.onText);
                } else {
                    if (attrs.offText)
                        $toolLinkStateDesctiption.text(attrs.offText);
                }
            }
            $toolLinkOnInput.on('change', onToolLinkInputChange);
            $toolLinkOffInput.on('change', onToolLinkInputChange);
            onToolLinkInputChange();

            element.on('$destroy', function() {
                $toolLinkOnInput.unbind('change', onToolLinkInputChange);
                $toolLinkOffInput.unbind('change', onToolLinkInputChange);
            });
        }
    };
}]);
