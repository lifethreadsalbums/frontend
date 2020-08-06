'use strict';

angular.module('pace.layout')
.directive('autoArrangeState', ['MutationObserver', function(MutationObserver) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var childButton = element.find('> .auto-fill');
            var childDropdown = element.find('> .icon-auto-arrange');
            var childDropdownId = childDropdown.data('dropdown-main-button-id');

            var observer = new MutationObserver(function(mutations) {
                observeHandler();
            });

            var observerConfig = {attributes: true, childList: false, characterData: false, subtree: false};

            setTimeout(function() {
                observeHandler();
            });

            element.on('mouseenter', function(e) {
                observeHandler(true);

                $('[data-dropdown-button-id="' + childDropdownId + '"]').off('mouseenter').on('mouseenter', function(e) {
                    observeHandler(true);
                });

                $('[data-dropdown-button-id="' + childDropdownId + '"]').off('mouseleave').on('mouseleave', function(e) {
                    observeHandler(false);
                });
            });

            element.on('mouseleave', function(e) {
                observeHandler(false);
            });

            childButton.on('click', btnClickHandler);

            element.on('$destroy', function() {
                observer.disconnect();
                element.unbind('mouseenter');
                element.unbind('mouseleave');
                childButton.unbind('click', btnClickHandler);
                $('[data-dropdown-button-id="' + childDropdownId + '"]').unbind('mouseenter');
                $('[data-dropdown-button-id="' + childDropdownId + '"]').unbind('mouseleave');
            });

            function btnClickHandler() {
                //Bug 1746 - Turn off Dynamic Auto Fill for now
                //Temporarily disable opening the dropdown on click
                //childDropdown.trigger('click');
            }

            function observeHandler(enableActive) {
                if (childDropdown.hasClass('active')) {
                    setTimeout(observeHandler, 200);
                    return;
                }

                observer.disconnect();

                if (element.hasClass('active')) {
                    childButton.addClass('active2');
                    childDropdown.addClass('active2');
                } else if (enableActive) {
                    childButton.addClass('active2');
                    childDropdown.addClass('active2');
                } else if (!enableActive) {
                    childButton.removeClass('active2');
                    childDropdown.removeClass('active2');
                } else {
                    childButton.removeClass('active2');
                    childDropdown.removeClass('active2');
                }

                observer.observe(element[0], observerConfig);
            }
        }
    };
}]);