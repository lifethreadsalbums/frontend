'use strict';

angular.module('paceApp')

    .config(['$provide', function($provide) {
        return $provide.decorator('Slider', ['$delegate', '$timeout', '$parse', '$document', function($delegate, $timeout, $parse, $document) {
            
            var slider = $delegate;

            slider.prototype.init = (function(originalFn) {
                return function() {

                    originalFn.apply(this, arguments);
                    var self = this;
                    $timeout(function() {
                        self.calcViewDimensions();
                    });

                };
            })(slider.prototype.init);

            slider.prototype.onEnd = (function(originalFn) {
                return function(event) {
                    //originalFn.apply(this, arguments);
                    this.minH.removeClass('active');
                    this.maxH.removeClass('active');

                    if(event.touches)
                    {
                        $document.unbind('touchmove.rzslider');
                        $document.unbind('touchend.rzslider');
                    }
                    else
                    {
                        $document.unbind('mousemove.rzslider');
                        $document.unbind('mouseup.rzslider');
                    }

                    this.tracking = '';

                    if (this.attributes.onEditEnd) {
                        if (!this.editEndFn) 
                            this.editEndFn = $parse(this.attributes.onEditEnd);
                        this.editEndFn(this.scope.$parent,{});
                    }
                };
            })(slider.prototype.onEnd);

            slider.prototype.onStart = (function(originalFn) {
                return function(pointer, ref, event) {
                    //originalFn.apply(this, arguments);


                    event.stopPropagation();
                    event.preventDefault();

                    if(this.tracking !== '') { return }

                    // We have to do this in case the HTML where the sliders are on
                    // have been animated into view.
                    this.calcViewDimensions();
                    this.tracking = ref;

                    pointer.addClass('active');

                    if(event.touches)
                    {
                        $document.on('touchmove.rzslider', angular.bind(this, this.onMove, pointer));
                        $document.on('touchend.rzslider', angular.bind(this, this.onEnd));
                    }
                    else
                    {
                        $document.on('mousemove.rzslider', angular.bind(this, this.onMove, pointer));
                        $document.on('mouseup.rzslider', angular.bind(this, this.onEnd));
                    }

                    if (this.attributes.onEditBegin) {
                        if (!this.editBeginFn) 
                            this.editBeginFn = $parse(this.attributes.onEditBegin);
                        this.editBeginFn(this.scope.$parent,{});
                    }
                };
            })(slider.prototype.onStart);

            slider.prototype.onMove = (function(originalFn) {
                return function(event) {
                    originalFn.apply(this, arguments);

                    


                    if (this.attributes.onEditMove) {
                        if (!this.editMoveFn) 
                            this.editMoveFn = $parse(this.attributes.onEditMove);
                        this.editMoveFn(this.scope.$parent,{});
                    }
                };
            })(slider.prototype.onMove);

            return $delegate;
        }]);
      }
    ])

    .directive('sliderButton', ['$parse', '$timeout', '$window', 'IconSet', 'GeomService', 'KeyboardService',
    function($parse, $timeout, $window, IconSet, GeomService, KeyboardService) {
        return {
            replace: true,
            restrict: 'E',
            scope:{},
            require: '?ngModel',
            link: function postLink(scope, element, attrs, ngModelCtrl) {
                //
                // Variables
                //
                var controlsElement = element.find('.dropdown-button-controls').first(),
                    step = parseFloat(attrs.sliderStep || 1),
                    min = parseFloat(attrs.sliderMin || 0),
                    max = parseFloat(attrs.sliderMax || 0),
                    sliderMin = attrs.sliderMin || '0',
                    sliderPrecision = angular.isDefined(attrs.sliderPrecision) ? attrs.sliderPrecision : 3,
                    changeFn = $parse(attrs.onChange),
                    editEndFn = attrs.onEditEnd ? $parse(attrs.onEditEnd) : null,
                    editBeginFn = attrs.onEditBegin ? $parse(attrs.onEditBegin) : null,
                    openFn = attrs.onOpen ? $parse(attrs.onOpen) : null,
                    closeFn = attrs.onClose ? $parse(attrs.onClose) : null,
                    sliderElement = attrs.type === 'slider' ? element.find('[data-slider]').first() : null,
                    elHeight, // = element.outerHeight(),
                    currentValue,
                    activeElement;

                scope.icon = attrs.icon || '';
                scope.direction = attrs.direction || 'down';
                scope.color = attrs.color || '';
                scope.classes = attrs.classes || '';
                scope.sliderLabel = attrs.sliderLabel || '';
                scope.sliderLabelButton = attrs.sliderLabelButton === 'true';
                scope.sliderLabelButtonIcon = attrs.sliderLabelButtonIcon || '';
                scope.sliderInput = attrs.sliderInput === 'true';
                scope.sliderCurrentValue = -1;

                var wrapper = $('<div class="dropdown-button-controls-wrapper dropdown-button active type-slider ' + scope.color + ' ' + scope.direction + ' ' + scope.classes + '"></div>');
                wrapper.append(controlsElement);
                controlsElement = wrapper;
                $('body').append(controlsElement);
                
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

                // init ngModelController
                if (ngModelCtrl) {
                    ngModelCtrl.$render = function() {
                        var value = ngModelCtrl.$viewValue;
                        scope.sliderCurrentValue = currentValue = fixValue(value);
                    };

                    scope.$watch('sliderCurrentValue', function(value, oldValue) {
                        if (angular.isDefined(value) && angular.isDefined(oldValue) && value!==oldValue && value!==currentValue) {
                            currentValue = value;
                            ngModelCtrl.$setViewValue(value);
                            changeFn(scope.$parent, {value:value});
                        }
                    });

                    scope.sliderValueChanged = function() {
                        ngModelCtrl.$setViewValue(scope.sliderCurrentValue);
                        changeFn(scope.$parent, {value:scope.sliderCurrentValue});
                    };

                    scope.sliderEditEnd = function() {
                        if (editEndFn) {
                            editEndFn(scope.$parent, {});
                        }
                    };

                    scope.sliderEditBegin = function() {
                        if (editBeginFn) {
                            editBeginFn(scope.$parent, {});
                        }
                    };
                }

                //
                // Functions
                //

                function closePopup() {
                    // timeout to prevent showing slider again
                    $timeout(function() {
                        element.removeClass('active');
                        element.removeAttr('tabindex');
                        element.off('keydown', onKeyDown);
                        //controlsElement.hide();
                        controlsElement.fadeOut();
                        disableScrollListening();
                        if (activeElement) activeElement.focus();
                    });
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

                function enableScrollListening() {
                    calculateOptionsPosition();

                    $(':scrollable').scroll(calculateOptionsPosition);
                }

                function disableScrollListening() {
                    $(':scrollable').off('scroll', calculateOptionsPosition);
                }
    
                //
                // Events
                //
                function onMouseUp(e) {
                    var target = $(e.target),
                        parent = target.parent();

                    if (target[0]===element[0] || (parent.length>0 && parent[0]===element[0])) {
                        return;
                    }
                 
                    closePopup();
                    $(document).unbind('mouseup', onMouseUp);
                }

                function onKeyDown(e) {
                    var shortcut = KeyboardService.getShortcut(e),
                        up = shortcut==='UP' || shortcut==='RIGHT' || shortcut==='+' || shortcut==='=',
                        down = shortcut==='DOWN' || shortcut==='LEFT' || shortcut==='-';

                    if (shortcut==='ENTER') {
                        onMouseUp();
                        e.stopPropagation();
                        return;
                    }
                    if (!(up || down)) return;

                    var value = fixValue( scope.sliderCurrentValue + (step * (up ? 1 : -1)) );
                    
                    scope.$apply(function() {
                        scope.sliderCurrentValue = currentValue = value;
                        ngModelCtrl.$setViewValue(value);
                        changeFn(scope.$parent, {value:value});

                        if (editBeginFn) {
                            editBeginFn(scope.$parent, {});
                        }
                        if (editEndFn) {
                            editEndFn(scope.$parent, {});
                        }
                    });

                    e.stopPropagation();
                }

                element.on('click', function(e) {
                    e.stopPropagation();

                    if (!element.hasClass('active')) {
                        if (openFn) {
                            openFn(scope.$parent, {});
                        }
                        activeElement = document.activeElement;
                        
                        $(document).on('mouseup', onMouseUp);
                        
                        element.attr('tabindex', 1);
                        element.on('keydown', onKeyDown);
                        element.focus();
                        controlsElement.fadeOut(0).fadeIn();
                            
                        $timeout(function() {
                            element.addClass('active');
                            scope.$broadcast('rzSliderForceRender');
                            enableScrollListening();
                        });
                    }
                    
                });

                element.on('$destroy', function() {
                    element.unbind('click');
                });
            },
            template: function (elem, attrs) {
                var sliderInitialValue = attrs.sliderInitialValue || '50',
                    sliderMin = attrs.sliderMin || '0',
                    sliderMax = attrs.sliderMax || '100',
                    sliderStep = attrs.sliderStep || '1',
                    sliderPrecision = angular.isDefined(attrs.sliderPrecision) ? attrs.sliderPrecision : 3,
                    sliderPostfix = attrs.sliderPostfix || '',
                    sliderScale = attrs.sliderScale || 'full',
                    sliderInput = attrs.sliderInput === 'true',
                    sliderInputPrefix = attrs.sliderInputPrefix || '',
                    sliderInputClass = attrs.sliderInputClass || 'small-75',
                    sliderInputIcon = attrs.sliderInputIcon || '',
                    icon = attrs.icon || '',
                    direction = attrs.direction || 'down',
                    color = attrs.color || '';

                if (sliderInput) {
                    return '<div class="dropdown-button slider-input {{color}} {{direction}} type-slider icon-{{icon}} {{classes}}">' +
                            '<span class="split-input {{color}} ' + sliderInputClass + '">' +
                                '<input number-format="0.[00000]" postfix="' + sliderPostfix + '" type="text" class="{{color}} " ng-model="sliderCurrentValue" ng-change="sliderValueChanged()">' +
                                '<span class="split-prefix button-on-off icon-' + sliderInputIcon + '">' + sliderInputPrefix + '</span>' +
                                '<div class="dropdown-button-controls">' +
                                    '<span class="controls-triangle"></span>' +
                                    '<div class="slider-container {{color}}">' +
                                        '<rzslider rz-slider-model="sliderCurrentValue" rz-slider-floor="' + sliderMin + '" rz-slider-ceil="' + sliderMax + 
                                            '" rz-slider-step="' + sliderStep + '" rz-slider-precision="' + sliderPrecision + 
                                            '" on-edit-end="sliderEditEnd()" on-edit-begin="sliderEditBegin()"></rzslider>' +
                                        '<span class="slider-scale scale-1 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-2 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-3 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-4 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-5 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-6 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-7 scale-type-' + sliderScale + '"></span>' +
                                    '</div>' +
                                    '<span ng-if="sliderLabel" class="slider-label">{{sliderCurrentValue}}' + sliderPostfix + '</span>' +
                                '</div>' +
                            '</span>' +
                            '</div>';
                } else {
                    return '<div class="dropdown-button arrow-bottom-right-small {{color}} {{direction}} type-slider icon-{{icon}} {{classes}}">' +
                                '<span ng-if="!sliderLabelButton" class="button button-on-off {{color}} {{icon}}"></span>' +
                                '<span ng-if="sliderLabelButton" class="button button-on-off {{color}} {{sliderLabelButtonIcon}}">{{sliderCurrentValue}}' + sliderPostfix + '</span>' +
                                '<div class="dropdown-button-controls">' +
                                    '<span class="controls-triangle"></span>' +
                                    '<div class="slider-container {{color}}">' +
                                        '<rzslider rz-slider-model="sliderCurrentValue" rz-slider-floor="' + sliderMin + 
                                            '" rz-slider-ceil="' + sliderMax + '" rz-slider-step="' + sliderStep + 
                                            '" rz-slider-precision="' + sliderPrecision + 
                                            '" on-edit-end="sliderEditEnd()" on-edit-begin="sliderEditBegin()"></rzslider>' +
                                        '<span class="slider-scale scale-1 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-2 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-3 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-4 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-5 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-6 scale-type-' + sliderScale + '"></span>' +
                                        '<span class="slider-scale scale-7 scale-type-' + sliderScale + '"></span>' +
                                    '</div>' +
                                    '<span ng-if="sliderLabel" class="slider-label">{{sliderCurrentValue}}' + sliderPostfix + '</span>' +
                                '</div>' +
                           '</div>';
                }
                
            }
        };
    }]);
