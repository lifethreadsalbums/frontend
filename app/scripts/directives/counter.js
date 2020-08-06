'use strict';

angular.module('paceApp')
    .directive('counter', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var $minus = element.find('.counter-minus');
                var $plus = element.find('.counter-plus');
                var $value = element.find('.counter-value');
                var $valueLabel = element.find('.counter-value-label');
                var min = $.isNumeric(attrs.min) ? parseInt(attrs.min) : 0;
                var max = $.isNumeric(attrs.max) ? parseInt(attrs.max) : Number.MAX_VALUE;
                var step = $.isNumeric(attrs.step) ? parseInt(attrs.step) : 1;
                var holdTimeout;
                var holdTimeoutDelay = 500;
                var updateTimeout;
                var updateTimeoutDefaultDelay = 200;
                var updateTimeoutCurrentDelay;
                var updateTimeoutIterationNo = 0;

                if ($valueLabel.length) {
                    $valueLabel.text($value.val());
                }

                $minus.on('click', function(e) {
                    e.preventDefault();
                    clearHoldTimeout();
                    updateCounterValue('minus');
                    $value.trigger('change');
                    $value.trigger('blur');
                });

                $plus.on('click', function(e) {
                    e.preventDefault();
                    clearHoldTimeout();
                    updateCounterValue('plus');
                    $value.trigger('change');
                    $value.trigger('blur');
                });
                
                $plus.on('dblclick', function(e) {
                    e.preventDefault();
                });

                $value.on('change', function() {
                    validateCounterValue();
                });

                $minus.on('mousedown', function() {
                    setHoldTimeout('minus');
                });

                $plus.on('mousedown', function() {
                    setHoldTimeout('plus'); 
                });

                $minus.on('mouseup mouseleave', function() {
                    if (holdTimeout) clearHoldTimeout();
                });

                $plus.on('mouseup mouseleave', function() {
                    if (holdTimeout) clearHoldTimeout();
                });

                $value.on('keydown', function(e) {
                    // Allow: backspace, delete, tab, escape, enter and .
                    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
                         // Allow: Ctrl+A
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                         // Allow: Ctrl+C
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                         // Allow: Ctrl+X
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                         // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                            // let it happen, don't do anything
                            return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                    }
                });

                function setHoldTimeout(operation) {
                    clearHoldTimeout();

                    holdTimeout = $timeout(function() {
                        setUpdateTimeout(operation);
                    }, holdTimeoutDelay);
                }

                function setUpdateTimeout(operation) {
                    if (updateTimeoutIterationNo > 30) {
                        updateTimeoutCurrentDelay = 10;
                    } else if (updateTimeoutIterationNo > 10) {
                        updateTimeoutCurrentDelay = 100;
                    } else {
                        updateTimeoutCurrentDelay = updateTimeoutDefaultDelay;
                    }

                    updateTimeout = $timeout(function() { 
                        updateCounterValue(operation);
                        //$value.trigger('change');
                        updateTimeoutIterationNo++;
                        setUpdateTimeout(operation);
                    }, updateTimeoutCurrentDelay);
                }

                function clearHoldTimeout() {
                    if (holdTimeout) {
                        $timeout.cancel(holdTimeout);
                        holdTimeout = null;
                    }

                    if (updateTimeout) {
                        $timeout.cancel(updateTimeout);
                    }
                    $value.trigger('change');
                    $value.trigger('blur');
                    updateTimeoutIterationNo = 0;
                }

                function validateCounterValue() {
                    var val = $value.val();
                    if (val==='') return;

                    var value = parseInt($value.val());
                    if (!$.isNumeric(value))
                        value = 0;

                    if (value < min)
                        value = min;

                    if (value > max)
                        value = max;

                    value = Math.round(value/step) * step;

                    if (value != $value.val()) {
                        $value.val(value);
                        $value.trigger('change');
                        $value.trigger('blur');
                    }
                }

                function updateCounterValue(operation) {
                    var value = parseInt($value.val());
                    if (!$.isNumeric(value))
                        value = 0;

                    if (operation === 'plus') {
                        $value.val(value + step);
                    } else if (operation === 'minus') {
                        $value.val(value - step);
                    }

                    validateCounterValue();

                    if ($valueLabel.length) {
                        $valueLabel.text($value.val());
                    }
                }

                // Clean up when the element is destroyed
                element.on('$destroy', function() {
                    $minus.unbind('click');
                    $minus.unbind('mousedown');
                    $minus.unbind('mouseup');
                    $minus.unbind('mouseleave');
                    $plus.unbind('click');
                    $plus.unbind('mousedown');
                    $plus.unbind('mouseup');
                    $plus.unbind('mouseleave');
                    $value.unbind('change');
                    $value.unbind('keydown');
                    clearHoldTimeout();
                });
            }
        };
    }]);
