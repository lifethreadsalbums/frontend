'use strict';

angular.module('paceApp')
.factory('MessageService', ['$document', '$compile', '$rootScope', '$timeout', function ($document, $compile, $rootScope, $timeout) {

    var body = $document.find('body');
    var popup = null;

    return {

        inline: function(message, type, target, classes) {
            var className = 'inline ';

            if (classes) {
                className += classes;
            }

            this.ask(message, type, null, false, null, target, className);
        },

        warn: function(message, classes) {
            this.show(message, 'warning', null, false, null, null, classes);
        },

        error: function(message, classes) {
            this.show(message, 'alert', null, false, null, null, classes);
        },

        /*
        type: info, warning, alert
        */
        show: function(message, type, classes) {
            type = type || 'info';
            this.ask(message, type, null, false, 5000, null, classes);
        },

        clear: function() {
            $('.pop-up').removeClass('open');
        },

        confirm: function(message, yesCallback, noCallback, classes) {
            this.ask(message, 'alert', [
                {
                    label: 'Yes',
                    callback: yesCallback
                },
                {
                    label: 'No',
                    callback: noCallback
                }
            ], true, null, null, classes);
        },

        ok: function(message, okCallback, classes) {
            this.ask(message, 'alert', [
                {
                    label: 'Ok',
                    callback: okCallback
                },
            ], false, null, null, classes);
        },

        ask: function(message, type, buttons, modal, autoclose, target, classes) {
            var inContent = '';

            if (target) {
                var targetEl = $(target),
                    initialPadding = parseInt(targetEl.css('padding-top').replace('px', ''));
                inContent = 'in-content';
            }

            buttons = buttons || [];

            if (popup)
                popup.remove();

            var buttonsElem = '<div class="buttons">';
            $.each(buttons, function(index, value) {
                buttonsElem += '<a tabindex="' + index + '" class="button small ' + type + '" ng-click="$handleCallback(' + index + ')">' + this.label + '</a>';
            });
            buttonsElem += '</div>';

            var html = '';

            if (modal !== false)
                html += '<div class="pop-up-overlay ' + classes + '"></div>';

            message = '<div class="pop-up-message">' + message + '</div>';

            html += '<div class="pop-up ' + type + ' ' + inContent + ' ' + classes + '">'+
                    '<div class="pop-up-inner-container">' + message + buttonsElem + '</div>'+
                '</div>';
            var el = angular.element(html);
            popup = el;

            var scope = $rootScope.$new(),
                activeElement = document.activeElement;

            var closeFn = function () {
                if (!popup) {
                    return;
                }

                popup.removeClass("open");
                if (targetEl && (!classes || classes !== 'inline'))
                    targetEl.css({paddingTop: initialPadding + 'px'});
                
                if (modal !== false) {
                    $(el[0]).css({ opacity: 0 });
                    if (activeElement) {
                        setTimeout(function() {
                            activeElement.focus();
                        });
                    }
                }

                var popupEl = popup;
                $timeout(function() {
                    if (popupEl)
                        popupEl.remove();
                    if (targetEl)
                        targetEl.removeClass('pop-up-in-content-container');
                }, 300);
                popup = null;
            };
            scope.$modalClose = closeFn;

            scope.$handleCallback = function(index) {
                if (buttons[index].callback) {
                    buttons[index].callback();
                }
                scope.$modalClose();
            }

            $compile(el)(scope);
            if (target) {
                targetEl.prepend(el);
                targetEl.addClass('pop-up-in-content-container');
                if (!classes || classes !== 'inline') {
                    // targetEl.css({paddingTop: (initialPadding + 50) + 'px'});
                    targetEl.css({paddingTop: initialPadding + 'px'});
                }
            } else {
                body.append(el);
            }

            $timeout(function() {
                el.addClass('open');
                if (modal !== false) {
                    $(el[0]).css({ opacity: 1 });
                    el.find('.button').first().focus();
                }
            });

            if (autoclose) {
                $timeout(closeFn, autoclose);
            }
        }
    }
}]);
