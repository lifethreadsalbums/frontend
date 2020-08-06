'use strict';

angular.module('paceApp')
    .directive('sliderButtonWithDropdown', ['$parse', '$timeout', '$window', '$document', 'IconSet', 'GeomService', 'KeyboardService',
    function($parse, $timeout, $window, $document, IconSet, GeomService, KeyboardService) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                dropdownOptions: '=',
                dropdownModel: '='
            },
            require: '?ngModel',
            link: function postLink(scope, element, attrs, ngModelCtrl) {
                //
                // Variables
                //
                var controlsElement = element.find('.dropdown-button-controls').first(),
                    step = parseFloat(attrs.sliderStep || 1),
                    min = parseFloat(attrs.sliderMin || 0),
                    max = parseFloat(attrs.sliderMax || 0),
                    sliderPrecision = angular.isDefined(attrs.sliderPrecision) ? attrs.sliderPrecision : 3,
                    changeFn = $parse(attrs.onChange),
                    inputChangeFn = $parse(attrs.onInputChange),
                    editEndFn = attrs.onEditEnd ? $parse(attrs.onEditEnd) : null,
                    editBeginFn = attrs.onEditBegin ? $parse(attrs.onEditBegin) : null,
                    editMoveFn = attrs.onEditMove ? $parse(attrs.onEditMove) : null,
                    sliderBubbleClickFn = attrs.onSliderBubbleClick ? $parse(attrs.onSliderBubbleClick) : null,
                    openFn = attrs.onOpen ? $parse(attrs.onOpen) : null,
                    closeFn = attrs.onClose ? $parse(attrs.onClose) : null,
                    isSliderMoving = false,
                    sliderMin = attrs.sliderMin || '0',
                    sliderMax = attrs.sliderMax || '100',
                    elHeight,
                    currentValue,
                    activeElement,
                    sliderInput,
                    sliderMinus,
                    sliderPlus,
                    sliderPointer,
                    eventNamespace = '.sliderButtonWithDropdown';

                scope.icon = attrs.icon || '';
                scope.direction = attrs.direction || 'down';
                scope.color = attrs.color || '';
                scope.classes = attrs.classes || '';
                scope.sliderCurrentValue = -1;

                var wrapper = $('<div class="dropdown-button-controls-wrapper dropdown-button active type-slider-dropdown ' + scope.color + ' ' + scope.direction + ' ' + scope.classes + '"></div>');
                wrapper.append(controlsElement);
                controlsElement = wrapper;
                $('body').append(controlsElement);

                sliderInput = controlsElement.find('.slider-dropdown-input');
                sliderMinus = controlsElement.find('.slider-minus');
                sliderPlus = controlsElement.find('.slider-plus');
                sliderPointer = controlsElement.find('.pointer');

                function fixValue(value) {
                    if (!angular.isNumber(value)) return value;

                    if (value < min)
                        value = min;

                    if (value > max)
                        value = max;

                    value = Math.round(value/step) * step;
                    value = GeomService.roundNumber(value, sliderPrecision);

                    return value;
                }

                function checkMarkedValue(value) {
                    var markedValue = parseFloat(attrs.markedValue || 0);
                    
                    if (value===markedValue)
                        sliderPointer.addClass('is-marked');
                    else
                        sliderPointer.removeClass('is-marked');
                }

                // init ngModelController
                if (ngModelCtrl) {
                    ngModelCtrl.$render = function() {
                        var value = ngModelCtrl.$viewValue;
                        scope.sliderCurrentValue = currentValue = fixValue(value);
                        checkMarkedValue(scope.sliderCurrentValue);
                    };

                    scope.$watch('sliderCurrentValue', function(value, oldValue) {
                        if (angular.isDefined(value) && angular.isDefined(oldValue) && value!==oldValue && value!==currentValue) {
                            currentValue = value;
                            ngModelCtrl.$setViewValue(value);
                            changeFn(scope.$parent, {value:value});
                            checkMarkedValue(value);
                        }
                    });

                    scope.sliderValueChanged = function() {
                        if (scope.sliderCurrentValue < sliderMin) {
                            scope.sliderCurrentValue = sliderMin;
                        } else if (scope.sliderCurrentValue > sliderMax) {
                            scope.sliderCurrentValue = sliderMax;
                        }

                        ngModelCtrl.$setViewValue(scope.sliderCurrentValue);

                        if (editBeginFn) {
                            editBeginFn(scope.$parent, {});
                        }

                        if (inputChangeFn) {
                            inputChangeFn(scope.$parent, {value:scope.sliderCurrentValue});
                        }

                        if (editEndFn) {
                            editEndFn(scope.$parent, {});
                        }
                    };

                    scope.sliderEditEnd = function() {
                        if (!isSliderMoving) {
                            //sliderPointer.toggleClass('is-marked');
                            sliderBubbleClickFn && sliderBubbleClickFn();
                        }

                        isSliderMoving = false;
                        element.focus();

                        if (editEndFn) {
                            editEndFn(scope.$parent, {});
                        }
                    };

                    scope.sliderEditBegin = function() {
                        isSliderMoving = false;

                        if (editBeginFn) {
                            editBeginFn(scope.$parent, {});
                        }
                    };

                    scope.sliderEditMove = function() {
                        isSliderMoving = true;

                        if (editMoveFn) {
                            editMoveFn(scope.$parent, {});
                        }
                    };
                }

                scope.dropdownValueChanged = function() {
                    element.focus();
                    $timeout(scope.sliderValueChanged);
                };

                //
                // Functions
                //

                function closePopup() {
                    $document.off('mouseup' + eventNamespace, onMouseUp);
                    element.removeClass('active');
                    element.removeAttr('tabindex');
                    element.off('keydown', onElementKeyDown);

                    sliderInput.off('keydown', onInputKeyDown);
                    sliderInput.off('keyup', onInputKeyUp);
                    sliderMinus.off(eventNamespace);
                    sliderPlus.off(eventNamespace);

                    //controlsElement.hide();
                    controlsElement.fadeOut();
                    disableScrollListening();
                    if (activeElement) activeElement.focus();
                   
                    if (closeFn) {
                        closeFn(scope.$parent, {});
                    }
                }

                function calculateOptionsPosition() {
                    var offset = element.offset();

                    elHeight = elHeight || element.outerHeight();

                    if (scope.direction === 'up') {
                        controlsElement.css({
                            bottom: $window.innerHeight - offset.top + 10,
                            left: offset.left,
                            top: 'auto'
                        });
                    } else {
                        controlsElement.css({
                            top: offset.top + elHeight + 5,
                            left: offset.left,
                            bottom: 'auto'
                        });
                    }
                }

                var scrollableContainer;

                function enableScrollListening() {
                    calculateOptionsPosition();

                    scrollableContainer = element.closest('.scrollable-container');
                    //$(':scrollable').scroll(calculateOptionsPosition);
                    scrollableContainer.on('scroll', calculateOptionsPosition);
                }

                function disableScrollListening() {
                    //$(':scrollable').off('scroll', calculateOptionsPosition);
                    scrollableContainer.off('scroll', calculateOptionsPosition);
                }

                //
                // Events
                //
                function onMouseUp(e) {
                    if (e) {
                        var target = $(e.target),
                        parent = target.parent();

                        if (target[0]===element[0] || (parent.length>0 && parent[0]===element[0])) {
                            return;
                        }

                        if (target.hasClass('controls-triangle') || target.hasClass('dropdown-button-controls') || target.hasClass('dropdown-button-controls-wrapper')) {
                            element.focus();
                            return;
                        }

                        if (target.hasClass('dropdown-button-option') || parent.hasClass('dropdown-button-option')) {
                            return;
                        }

                        if (target.hasClass('.dropdown-button-controls-wrapper.type-slider-dropdown') || target.closest('.dropdown-button-controls-wrapper.type-slider-dropdown').length) {
                            return;
                        }
                    }
                    closePopup();
                }

                var holdTimeoutId, pulseTimeoutId;

                function onElementKeyDown(e) {
                    var shortcut = KeyboardService.getShortcut(e),
                        up = shortcut === '+' || shortcut === '=' || shortcut === 'SHIFT+=',
                        down = shortcut === '-' || shortcut === 'SHIFT+-';

                    if (!shortcut || !(up || down)) return;

                    var value = up ? 1 : -1;
                    
                    incrementDecrementValue(value);

                    var el = up ? sliderPlus : sliderMinus;
                    el.addClass('active');
                    clearTimeout(pulseTimeoutId);
                    pulseTimeoutId = setTimeout(function() { el.removeClass('active'); }, 200);

                    e.stopPropagation();
                }

                function onPlusMinusMousedown(dir, e) {
                    var doStuff = function() {
                        incrementDecrementValue(dir);
                        element.focus();
                    };
                    doStuff();
                    var el = dir===1 ? sliderPlus : sliderMinus;
                    holdTimeoutId = setInterval(function() {
                        doStuff();
                        el.addClass('active');
                    }, 150);
                }

                function onPlusMinusMouseup(e) {
                    clearInterval(holdTimeoutId);
                    sliderPlus.removeClass('active');
                    sliderMinus.removeClass('active');
                }

                // @param {Number} direction (1 for increment, -1 for decrement)
                function incrementDecrementValue(direction) {
                    var value = fixValue(scope.sliderCurrentValue + (step * (direction)));

                    scope.$apply(function() {
                        scope.sliderCurrentValue = currentValue = value;
                        ngModelCtrl.$setViewValue(value);
                        
                        if (editBeginFn) {
                            editBeginFn(scope.$parent, {});
                        }

                        changeFn(scope.$parent, {value:value});

                        if (editEndFn) {
                            editEndFn(scope.$parent, {});
                        }
                    });
                }

                function onInputKeyDown(e) {
                    var shortcut = KeyboardService.getShortcut(e);

                    switch (shortcut) {
                        case 'ESCAPE':
                        case 'ENTER':
                            onMouseUp();
                            e.stopPropagation();
                            break;
                        case 'BACKSPACE':
                        case 'DELETE':
                        case 'LEFT':
                        case 'RIGHT':
                            e.stopPropagation();
                            return;
                            break;
                    }

                    var val = sliderInput.val(),
                        allowedChars = '1234567890.';

                    // accept only numerics or dot (only one)
                    if ( (allowedChars.indexOf(shortcut) === -1)) {
                        e.preventDefault();
                    }

                    e.stopPropagation();
                }

                function onInputKeyUp(e) {
                    var val = sliderInput.val().replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    
                    if (val[0]==='.') val = '0' + val;
                    if (sliderInput.val()!==val) sliderInput.val(val);
                    return true;
                }

                element.on('mousedown', function(e) {
                    e.stopPropagation();

                    if (!element.hasClass('active')) {
                        if (openFn) {
                            openFn(scope.$parent, {});
                        }

                        activeElement = document.activeElement;

                        $document.on('mouseup' + eventNamespace, onMouseUp);
                        sliderInput.on('keydown', onInputKeyDown);
                        sliderInput.on('keyup', onInputKeyUp);

                        sliderMinus
                            .on('mousedown' + eventNamespace, onPlusMinusMousedown.bind(null, -1))
                            .on('mouseup' + eventNamespace + ' mouseleave' + eventNamespace, onPlusMinusMouseup);

                        sliderPlus
                            .on('mousedown' + eventNamespace, onPlusMinusMousedown.bind(null, 1))
                            .on('mouseup' + eventNamespace + ' mouseleave' + eventNamespace, onPlusMinusMouseup);

                        element.attr('tabindex', 1);
                        element.on('keydown', onElementKeyDown);
                        element.focus();
                        //controlsElement.show();
                        enableScrollListening();
                        controlsElement.fadeOut(0).fadeIn();

                        checkMarkedValue(scope.sliderCurrentValue);

                        $timeout(function() {
                            element.addClass('active');
                            //controlsElement.show();
                            scope.$broadcast('rzSliderForceRender');
                            //enableScrollListening();
                        });
                    }
                });

                element.on('$destroy', function() {
                    $document.off('mouseup' + eventNamespace, onMouseUp);
                    sliderInput.off('keydown', onInputKeyDown);
                    sliderInput.off('keyup', onInputKeyUp);
                    sliderMinus.off(eventNamespace);
                    sliderPlus.off(eventNamespace);
                    element.off('click');
                    element.off('keydown', onElementKeyDown);
                });
            },
            template: function (elem, attrs) {
                var sliderMin = attrs.sliderMin || '0',
                    sliderMax = attrs.sliderMax || '100',
                    sliderStep = attrs.sliderStep || '1',
                    sliderPrecision = angular.isDefined(attrs.sliderPrecision) ? attrs.sliderPrecision : 3,
                    icon = attrs.icon || '',
                    direction = attrs.direction || 'down',
                    color = attrs.color || '',
                    hasDropdown = attrs.dropdownOptions ? true : false;

                return  '<div class="dropdown-button arrow-bottom-right-small {{color}} {{direction}} type-slider-dropdown icon-{{icon}} {{classes}}">' +
                            '<span class="button button-on-off {{color}} {{icon}}"></span>' +
                            '<div class="dropdown-button-controls">' +
                                '<span class="controls-triangle"></span>' +
                                '<input class="slider-dropdown-input" number-format="0.[00000]" type="text" ng-model="sliderCurrentValue" ng-change="sliderValueChanged()">' +
                                '<span class="slider-minus"></span>' +
                                '<div class="slider-container {{color}}">' +
                                    '<rzslider rz-slider-model="sliderCurrentValue" rz-slider-floor="' + sliderMin + '" rz-slider-ceil="' + sliderMax +
                                            '" rz-slider-step="' + sliderStep + '" rz-slider-precision="' + sliderPrecision +
                                            '" on-edit-end="sliderEditEnd()" on-edit-begin="sliderEditBegin()" on-edit-move="sliderEditMove()"></rzslider>' +
                                '</div>' +
                                '<span class="slider-plus"></span>' +
                                (hasDropdown ? '<dropdown-button slider-button="true" class="slider-button radius-right" color="' + color + '" direction="down" type="icon" icon="' + attrs.dropdownIcon + '" options="dropdownOptions" on-change="dropdownValueChanged()" ng-model="dropdownModel" value-field="value"></dropdown-button>' : '') +
                            '</div>' +
                        '</div>';
            }
        };
    }]);
