/* 
 * Attributes:
 *
 * type - edit | click
 * name - move | rotate | font-size | kerning | tracking | leading | lowercase | capitalize | uppercase | justify-left | justify-middle | justify-right
 * init-value - (int) [optional]
 * min - (int) [optional]
 * max - (int) [optional]
 * interval - (int) [optional]
 * postfix - (string) [optional]
 *
 */

'use strict';

angular.module('pace.build')
    .directive('debossingTool', ['$parse', '$timeout', function ($parse, $timeout) {
        var addon = '<div id="tool-addon-{{addonId}}"  class="f-dropdown tool-addon" data-dropdown-content dropdown-top data-offset-top="2" data-offset-left="30">' +
            '<span class="minus"><span></span></span>' +
            '<span class="value">' +
                '<input type="text" value="">' +
                '<span>{{postfix}}</span>' +
            '</span>' +
            '<span class="plus"><span></span></span>' +
        '</div>';

        return {
            replace: true,
            restrict: 'E',
            scope: true,
            transclude: true,
            link: function postLink(scope, element, attrs) {
                var changeFn = $parse(attrs.change);

                scope.toolName = attrs.name;
                scope.addonId = getRandomString(6);


                function getRandomString(length) {
                    var text = "";
                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                    for (var i = 0; i < length; i++)
                        text += possible.charAt(Math.floor(Math.random() * possible.length));

                    return text;
                }

                function validateInputValue() {
                    if ( ! $.isNumeric($addonInput.val()))
                        $addonInput.val(0);

                    if ($.isNumeric(attrs.min) && Number($addonInput.val()) < Number(attrs.min))
                        $addonInput.val(attrs.min);

                    if ($.isNumeric(attrs.max) && Number($addonInput.val()) > Number(attrs.max))
                        $addonInput.val(attrs.max);

                    $addonInput.val(Math.round($addonInput.val()));
                }

                function updateInputValue(operation) {
                    validateInputValue();

                    if (operation == 'plus')
                        $addonInput.val(parseInt($addonInput.val()) + interval);
                    else if (operation == 'minus')
                        $addonInput.val(parseInt($addonInput.val()) - interval);

                    validateInputValue();
                    $addonInput.trigger('change');
                }

                if (attrs.type == 'edit') {
                    var $addonInput = element.find('.tool-addon input'),
                        $minus = element.find('.tool-addon .minus'),
                        $plus = element.find('.tool-addon .plus'),
                        interval = (attrs.interval) ? parseInt(attrs.interval) : 1;
                        
                    var timer = $timeout(function() {
                        scope.postfix = attrs.postfix;
                        if ( ! attrs.postfix)
                            $addonInput.find('.value span').remove();

                        $addonInput.val((attrs.initValue) ? attrs.initValue : 0);
                        validateInputValue();
                    });

                    $minus.on('click', function() {
                        updateInputValue('minus');
                    });

                    $plus.on('click', function(e) {
                        e.preventDefault();
                        updateInputValue('plus');
                    });
                    
                    $plus.on('dblclick', function(e) {
                        e.preventDefault();
                    });

                    $addonInput.on('change', function() {
                        validateInputValue();

                        changeFn(scope, {value: $addonInput.val()});

                    });
                } 
                // else if (attrs.type == "click") {
                //     var $link = element.find('a');

                //     $link.on('click', function() {
                //         //
                //         // TODO: handle button click event on canvas
                //         //
                //     });
                // }

                element.on('$destroy', function() {
                    if (attrs.type == "edit") {
                        $timeout.cancel(timer);
                        $addonInput.unbind('change');
                    }

                    // if (attrs.type == "click") {
                    //     $link.unbind('click');
                    // }
                })
            },
            template: function(element, attrs) {
                return '<li class="tool tool-{{toolName}}" style="font-size: 14px;">' +
                    ((attrs.type == 'edit') ? addon : '') +
                    '<a data-dropdown="tool-addon-{{addonId}}"></a>' +
                '</li>';
            }
        };
    }]);