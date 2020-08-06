'use strict';

angular.module('paceApp')
    .directive('initFoundation', ['MutationObserver', function (MutationObserver) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var observerConfig = {attributes: true, childList: false, characterData: false, subtree: false};
                var observers = [];

                init();

                element.on('$destroy', function() {
                    for (var i = 0; i < observers.length; i++) {
                        observers[i].disconnect();
                    }
                });

                function init() {
                    var options = attrs.initFoundation ? attrs.initFoundation : undefined;

                    setTimeout(function() {
                        element.foundation(options);
                        observeDynamicTitles();
                    });
                }

                function observeDynamicTitles() {
                    element.find('[dynamic-title]').each(function(index, el) {
                        var observer = new MutationObserver(function(mutations) {
                            for (var i = 0; i < mutations.length; i++) {
                                if (mutations[i].attributeName === 'title') {
                                    var newTitle = mutations[i].target.title;

                                    if (newTitle) {
                                        var selector = $(el).data('selector');
                                        var tooltip = $('[data-selector="' + selector + '"]');

                                        Foundation.libs.tooltip.getTip(tooltip).html(newTitle + '<span class="nub"></span>');
                                        $(el).removeAttr('title').attr('title', '');
                                    }
                                }
                            }
                        });

                        observer.observe($(el)[0], observerConfig);
                        observers.push(observer);
                    });
                }
            }
        };
    }]);
