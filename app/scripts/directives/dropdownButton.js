'use strict';

angular.module('paceApp')
.service('dropdownButtonService', function() {
    var i = 0;

    this.getNewId = function() {
        return ++i;
    }

    this.getLastId = function() {
        return i;
    }
})
.directive('dropdownButton', ['$compile', '$parse', '$timeout', '$window', 'IconSet', 'dropdownButtonService', function($compile, $parse, $timeout, $window, IconSet, dropdownButtonService) {
    return {
        replace: true,
        restrict: 'E',
        scope: {
            active:'='
        },
        priority: -10000,
        require: '?ngModel',
        link: function postLink(scope, element, attrs, ngModelCtrl) {
            //
            // Variables
            //
            var dropdownId = dropdownButtonService.getNewId();
            var optionsElement = element.find('ul').first();
            var controlsElement = element.find('.dropdown-button-controls').first();
            var changeFn = $parse(attrs.onChange);
            var animationDuration = 200;
            var elWidth; //= element.outerWidth();
            var elHeight;
            var isHiddenScroll = $('html').hasClass('hiddenscroll');
            var trackBy = (attrs.valueField || attrs.trackBy) ? ' track by option.' + (attrs.valueField || attrs.trackBy) : '';
            var scrollDirection = null;
            var innerWrapper;
            var innerWrapperBaseWidth;
            var optionsElementBaseHeight;
            var scrollableContainers;
            var isOptionsModelInitialized = false;
            var wrapperInitialized = false;
            var scrollDisabled = attrs.scrollDisabled==='true'

            scope.type = attrs.type || 'standard';
            scope.icon = attrs.icon || '';
            scope.iconText = (attrs.iconText === 'true') ? true : false;
            scope.labelField = attrs.labelField || 'label';
            scope.secondaryLabelField = attrs.secondaryLabelField || 'secondaryLabel';
            scope.items = attrs.items || null;
            scope.label = attrs.label || null;
            scope.labelPreIcon = attrs.labelPreIcon || null;
            scope.direction = attrs.direction || 'down';
            scope.color = attrs.color || '';
            scope.classes = attrs.classes || '';
            scope.noLabel = attrs.noLabel || null;
            scope.noArrow = attrs.noArrow || null;
            scope.selectedOptionIndex = -1;
            scope.isSubButton = (attrs.subButton === 'true') ? true : false;
            scope.manualId = attrs.manualId || '';
            scope.alignTo = (attrs.alignTo === 'right') ? 'right' : 'left';
            scope.sliderButton = attrs.sliderButton === 'true' ? true : false;
            scope.nullable = attrs.nullable === 'true';

            //initiateInnerWrapper();

            element.attr('data-dropdown-main-button-id', dropdownId);

            function initiateInnerWrapper() {
                if (wrapperInitialized) return;

                if (controlsElement.length) {
                    var wrapper = $('<div class="dropdown-button-controls-wrapper dropdown-button active type-' + scope.type + ' ' + scope.color + ' ' + scope.direction + ' ' + scope.classes + '" data-manual-id="{{manualId}}"></div>');
                    wrapper.attr('data-dropdown-button-id', dropdownId);
                    wrapper.append(controlsElement);
                    controlsElement = wrapper;
                    $('body').append(controlsElement);
                    optionsElement.on('click', optionsOnClick);

                } else {
                    //$timeout(function() {
                        optionsElement = $('<ul class="dropdown-button-options {{color}} arrow-{{direction}}-small type-{{type}} icon-{{icon}} {{classes}}" ng-class="{\'label-pre-icon-on\':labelPreIcon, \'no-label\':noLabel, \'no-arrow\':noArrow, \'icon-text\':iconText}" data-manual-id="{{manualId}}">' +
                            '<div class="dropdown-button-options-inner-wrapper">' +
                                '<span class="scroll-up-arrow">&#9650;</span>' +
                                '<li ng-repeat="option in options' + trackBy + '" index="{{$index}}" class="dropdown-button-option" ng-class="{active:$index==selectedOptionIndex, \'label-pre-icon-on\':option.labelPreIcon, \'dropdown-divider\':option.divider, \'dropdown-separator\':option.separator, \'label-pre-icon-invisible\':option.labelPreIconInvisible, \'right-label-on\':option.rightLabel, \'disabled\':option.disabled, \'indent\': option.indent, \'dropdown-button-option--has-secondary-label\': option[secondaryLabelField]}">' +
                                    '<span ng-if="option.labelPreIcon" class="label-pre-icon label-icon-{{option.labelPreIcon}}" ng-class="{\'indent\': option.indent}"></span>' +
                                    (scope.type === 'standard' ? '<span class="dropdown-option-label">{{option[labelField]}}<span ng-if="option.rightLabel !== undefined">{{option.rightLabel}}</span></span>' : '') +
                                    (scope.type === 'icon' ? '<span class="icon {{option.icon}}"></span>' : '') +
                                    '<span ng-if="option.iconText" class="dropdown-option-icon-text">{{option.iconText}}</span>' +
                                    '<span ng-if="option[secondaryLabelField]" class="dropdown-option-secondary-label">{{option[secondaryLabelField]}}</span>' +
                                '</li>' +
                                '<span class="scroll-down-arrow">&#9660;</span>' +
                            '</div>' +
                        '</ul>');

                        var newScope = scope.$new();
                        $compile(optionsElement)(newScope);
                        optionsElement.attr('data-dropdown-button-id', dropdownId);
                        $('body').append(optionsElement);

                        optionsElement.off('click').on('click', optionsOnClick);

                        innerWrapper = optionsElement.find('.dropdown-button-options-inner-wrapper');
                    //}, 100);
                }
                wrapperInitialized = true;
            }

            function findSelectedIndex(value) {
                if (  (!scope.nullable && (angular.isUndefined(value) || value===null)) || !scope.options ) {
                    return -1;
                }

                if (angular.isUndefined(value)) value = null;

                var selectedIndex = -1;
                if (attrs.valueField || attrs.trackBy) {
                    var where = {},
                        prop = attrs.trackBy || attrs.valueField,
                        value = attrs.trackBy ? value[attrs.trackBy] : value;

                    where[prop] = value;
                    var item = _.findWhere(scope.options, where);
                    selectedIndex = scope.options.indexOf(item);
                } else {
                    selectedIndex = scope.options.indexOf(value);
                }

                return selectedIndex;
            }

            function checkValidity(value) {
                var options = scope.options,
                    resolved = true;
                if (options && options.$promise) {
                    resolved = options.$resolved;
                }

                if (options && resolved) {
                    var selectedIndex = findSelectedIndex(value);
                    var valid = selectedIndex>=0 || !attrs.required;
                    ngModelCtrl.$setValidity('required', valid);

                    //if (!valid) {
                        //console.log('value not valid', value)
                        //return undefined;
                    //}
                }

                return value;
            }

            function getCurrentLabel() {
                return scope.options && scope.selectedOptionIndex>=0 ? scope.options[scope.selectedOptionIndex][scope.labelField] : scope.label;
            }

            // init ngModelController
            if (ngModelCtrl) {
                ngModelCtrl.$parsers.push(checkValidity);
                ngModelCtrl.$formatters.push(checkValidity);

                ngModelCtrl.$render = function() {
                    if (scope.type === 'standard' || scope.type === 'icon') {
                        var options = scope.options,
                            resolved = true;

                        if (options && options.$promise) {
                            resolved = options.$resolved;
                        }

                        if (angular.isDefined(ngModelCtrl.$viewValue) && options && resolved) {
                            var selectedIndex = findSelectedIndex(ngModelCtrl.$viewValue);
                            scope.selectedOptionIndex = selectedIndex;
                        } else {
                            scope.selectedOptionIndex = -1;
                        }

                        if (scope.options && scope.selectedOptionIndex >= 0) {
                            scope.labelPreIcon = scope.options[scope.selectedOptionIndex].labelPreIcon || attrs.labelPreIcon;
                        } else {
                            scope.labelPreIcon = attrs.labelPreIcon;
                        }

                        //if ($('[data-dropdown-button-id="' + dropdownId + '"]').length) {
                        if (wrapperInitialized) {
                            setTimeout(function() {
                                var elemToPostion = (controlsElement.length) ? controlsElement : optionsElement;
                                elemToPostion.removeClass('scroll-on');
                                elemToPostion.css('height', '');
                                elemToPostion.css('width', '');
                                optionsElementBaseHeight = 0;
                                innerWrapperBaseWidth = 0;
                                innerWrapper.css('maxWidth', '');
                            }, animationDuration + 100);
                        }
                    }
                };
            }

            if (scope.type === 'icon') {
                scope.selectedOptionIndex = 0;
                scope.options = IconSet[scope.icon];
                attrs.valueField = 'value';

                if (attrs.active) {
                    element.addClass('active-triangle');
                }
            } else if (scope.type === 'horizontal') {
                scope.options = IconSet[scope.items];
                attrs.valueField = 'value';
            }

            if (attrs.options) {
                scope.$parent.$watchCollection(attrs.options, function(value) {
                    var prevLabel = getCurrentLabel();

                    scope.options = value;
                    calculateLongestLabel();

                    if (ngModelCtrl) {
                        ngModelCtrl.$render();

                        var selectedIndex = findSelectedIndex(ngModelCtrl.$viewValue);
                        if (selectedIndex === -1 && scope.selectedOptionIndex !== selectedIndex) {
                            ngModelCtrl.$setViewValue(null);
                        }
                        //console.log('options changes', ngModelCtrl.$viewValue, value);

                        checkValidity(ngModelCtrl.$viewValue);
                    }

                    var label = getCurrentLabel();

                    if (isOptionsModelInitialized && label!==prevLabel) {
                        var labelEl = element.find('.dropdown-button-label');

                        labelEl.addClass('is-changed');
                        setTimeout(function () {
                            labelEl.removeClass('is-changed');
                        }, 10);
                    }

                    isOptionsModelInitialized = true;
                });
            }

            attrs.$observe('label', function(value) {
                scope.label = value;
            });


            //
            // Functions
            //
            function getTextWidth(text, font) {
                font = font || "normal 13px 'Museo Sans 300'";
                var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
                var context = canvas.getContext('2d');
                context.font = font;
                var metrics = context.measureText(text);
                return metrics.width;
            }

            function calculateLongestLabel() {
                if (scope.type !== 'standard') {
                    return;
                }

                var maxTxt = scope.label || '';
                var maxTxtLength = getTextWidth(maxTxt);

                if (scope.options) {
                    angular.forEach(scope.options, function(item) {
                        var label = (item[scope.labelField] || '').toString();

                        if (label) {
                            var labelWidth = getTextWidth(label);

                            if (labelWidth > maxTxtLength) {
                                maxTxt = label;
                                maxTxtLength = labelWidth;
                            }
                        }
                    });
                }

                scope.maxLabel = maxTxt;
            }

            function calculateWidth() {
                elWidth = element.outerWidth();

                if (scope.type === 'standard') {
                    optionsElement.css({minWidth: elWidth});
                }
            }

            function calculateOptionsPosition(event, setBaseSize) {
                var elemToPostion = (controlsElement.length) ? controlsElement : optionsElement;
                var offset = element.offset();

                if (setBaseSize && !innerWrapperBaseWidth && innerWrapper && innerWrapper.length) {
                    innerWrapperBaseWidth = innerWrapper.width();
                }

                if (!elHeight) {
                    elHeight = element.outerHeight();
                }

                if (!elWidth) {
                    elWidth = element.outerWidth();
                }


                var positionLeft = offset.left;

                if (scope.alignTo === 'right') {
                    positionLeft = positionLeft + elWidth - innerWrapperBaseWidth - 2;
                }

                if (scope.sliderButton) {
                    positionLeft = positionLeft - elemToPostion.outerWidth() + elWidth;
                }

                if (scope.direction === 'up') {
                    elemToPostion.css({
                        bottom: $window.innerHeight - offset.top + 2,
                        left: positionLeft,
                        top: 'auto'
                    });
                } else {
                    elemToPostion.css({
                        top: offset.top + elHeight + ((controlsElement.length) ? 15 : -4),
                        left: positionLeft,
                        bottom: 'auto'
                    });
                }

                if (!controlsElement.length) {
                    if (setBaseSize) {
                        innerWrapper.css({
                            maxWidth: innerWrapperBaseWidth + 'px',
                            'overflow-y': 'hidden'
                        });
                    }

                    // Fix for chrome bug - li's had rendered incorrect width. I'm forcing here redraw/repaint
                    innerWrapper[0].style.display = 'inline-block';
                    innerWrapper[0].offsetHeight;
                    innerWrapper[0].style.display = 'block';

                    setTimeout(function() {
                        if (!optionsElementBaseHeight) {
                            optionsElementBaseHeight = elemToPostion.outerHeight();
                        }

                        var elemHeight = optionsElementBaseHeight;
                        var heightDifference;

                        if (scope.direction === 'up') {
                            heightDifference = offset.top - elemHeight;

                            if (heightDifference < 0) {
                                elemToPostion.css({
                                    height: elemHeight + heightDifference - 10 + 'px'
                                });
                            }
                        } else {
                            heightDifference = $window.innerHeight - offset.top + 5 - elemHeight - elHeight;

                            if (heightDifference < 0) {
                                elemToPostion.css({
                                    height: elemHeight + heightDifference - 10 + 'px'
                                });
                            }
                        }

                        if (heightDifference < 0) {
                            var newInnerWrapperWidth = (isHiddenScroll) ? innerWrapperBaseWidth : innerWrapperBaseWidth + 15;

                            innerWrapper.css({
                                maxWidth: newInnerWrapperWidth + 'px',
                               'overflow-y': 'auto'
                            });

                            elemToPostion.addClass('scroll-on');
                        } else {
                            elemToPostion.css({
                                height: optionsElementBaseHeight + 'px'
                            });
                        }
                    }, animationDuration + 50);
                }
            }

            function enableScrollListening() {
                calculateOptionsPosition(null, true);

                if (scrollDisabled) return;
                setTimeout(function() {
                    scrollableContainers = element.parents('div:not(.dropdown-button-options-inner-wrapper):scrollable, ul:not(.dropdown-button-options-inner-wrapper):scrollable');
                    scrollableContainers.scroll(calculateOptionsPosition);
                }, animationDuration + 10);
            }

            function disableScrollListening() {
                if (!scrollableContainers) return;

                scrollableContainers.off('scroll', calculateOptionsPosition);
            }

            function optionsOnClick(e) {
                e.stopPropagation();

                // cancel action if middle button was clicked
                if (e && e.which === 2) {
                    return;
                }

                var index = parseInt($(e.target).closest('.dropdown-button-option').attr('index'), 10),
                    item = scope.options[index];

                // cancel action if separator
                if (!item) {
                    return;
                }

                // cancel action if disabled
                if (item.disabled) {
                    return;
                }

                if (attrs.callback === "true") {
                    if (typeof item.callback === "function") {
                        item.callback(item);
                    }

                    return;
                }

                scope.$apply(function() {
                    if (!element.hasClass('sub-button')) {
                        if (index >= 0) {
                            scope.selectedOptionIndex = index;

                            if (ngModelCtrl) {
                                ngModelCtrl.$setViewValue(attrs.valueField ? item[attrs.valueField] : item);
                            }

                            changeFn(scope.$parent, {index:index});
                        }
                    }
                });
            }

            function toggleActiveTriangle(isActive) {
                if (isActive) {
                    element.addClass('active-triangle-hover');
                } else {
                    element.removeClass('active-triangle-hover');
                }
            }

            //
            // Events
            //
            function closePopup() {
                var doClose = function() {
                    element.removeClass('active');
                    disableScrollListening();
                    disableScrollArrows();
                };

                var elemToPostion = (controlsElement.length > 0) ? controlsElement : optionsElement;
                elemToPostion.removeClass('scroll-on');

                if (controlsElement.length > 0) {
                    controlsElement.slideUp(animationDuration, doClose);
                } else {
                    optionsElement.slideUp(animationDuration, doClose);
                }

            }

            function onMouseUp(e) {
                $timeout(function() {
                    var closestSubButton = $(e.target).closest('.sub-button');
                    var target = $(e.target);

                    // don't close when clicking on disabled option
                    if ((target.hasClass('dropdown-button-option') && target.hasClass('disabled')) || (target.closest('li').hasClass('dropdown-button-option') && target.closest('li').hasClass('disabled'))) {
                        return;
                    }

                    if (e && e.which === 2 && (target.hasClass('dropdown-button-option') || target.closest('li').hasClass('dropdown-button-option'))) {
                        return;
                    }

                    if (closestSubButton.length === 0 || (closestSubButton.length > 0 && closestSubButton.hasClass('active'))) {
                        closePopup();

                        if (ngModelCtrl) {
                            ngModelCtrl.$blurred = true;
                            element.addClass('ng-blurred');
                        }

                        $(document).off('mouseup', onMouseUp);
                    }

                });

            }

            function enableScrollArrows() {
                $('body').on(
                    'mouseenter',
                    '[data-dropdown-button-id="' + dropdownId + '"] .scroll-up-arrow, [data-dropdown-button-id="' + dropdownId + '"] .scroll-down-arrow',
                    function(e) {
                        if ($(e.currentTarget).hasClass('scroll-up-arrow')) {
                            scrollDirection = 'up';
                        } else if ($(e.currentTarget).hasClass('scroll-down-arrow')) {
                            scrollDirection = 'down';
                        }

                        scrollOptions();
                    }
                );

                $('body').on(
                    'mouseleave',
                    '[data-dropdown-button-id="' + dropdownId + '"] .scroll-up-arrow, [data-dropdown-button-id="' + dropdownId + '"] .scroll-down-arrow',
                    function(e) {
                        scrollDirection = null;
                    }
                );
            }

            function disableScrollArrows() {
                $('body').off(
                    'mouseenter',
                    '[data-dropdown-button-id="' + dropdownId + '"] .scroll-up-arrow, [data-dropdown-button-id="' + dropdownId + '"] .scroll-down-arrow');

                $('body').off(
                    'mouseleave',
                    '[data-dropdown-button-id="' + dropdownId + '"] .scroll-up-arrow, [data-dropdown-button-id="' + dropdownId + '"] .scroll-down-arrow');
            }

            element.on('mousemove', function(e) {
                if (scope.type === 'icon' && attrs.active) {
                    if (e.offsetX >= (element.outerWidth() - 18)) {
                        toggleActiveTriangle(true);
                    } else {
                        toggleActiveTriangle(false);
                    }
                }
            });

            element.on('mouseout', function(e) {
                toggleActiveTriangle(false);
            });

            element.on('click', function(e) {
                if (scope.type === 'icon' && attrs.active) {
                    if (e.offsetX < (element.outerWidth() - 18) || e.offsetY < (element.outerHeight() - 18)) {
                        return;
                    }
                }

                e.stopPropagation();
                e.stopImmediatePropagation();

                initiateInnerWrapper();
                calculateWidth();

                if (!element.hasClass('active')) {
                    $timeout(function() {
                        element.addClass('active');

                        if (controlsElement.length > 0) {
                            controlsElement.slideDown(animationDuration);
                        } else {
                            optionsElement.slideDown(animationDuration);
                        }

                        enableScrollListening();
                        enableScrollArrows();

                        $(document).on('mouseup', onMouseUp);
                        element.trigger('focusin');
                    });
                } else {
                    closePopup();
                }
            });

            function scrollOptions() {
                if (innerWrapper && scrollDirection) {
                    var newPosition = innerWrapper.scrollTop();

                    if (scrollDirection === 'up') {
                        newPosition -= 20;
                    } else if (scrollDirection === 'down') {
                        newPosition += 20;
                    }

                    if (newPosition < 0) {
                        newPosition = 0;
                    }

                    innerWrapper.animate({
                        scrollTop: newPosition
                    }, 50, 'linear', function() {
                        if (scrollDirection) {
                            setTimeout(scrollOptions);
                        }
                    });
                }
            }

            calculateLongestLabel();

            element.on('$destroy', function() {
                element.unbind('click');
                element.unbind('mousemove');
                element.unbind('mouseout');
                optionsElement.unbind('click');
            });
        },
        template: function (elem, attrs) {
            var type = attrs.type || 'standard',
                icon = attrs.icon || '',
                direction = attrs.direction || 'down',
                color = attrs.color || '',
                classes = attrs.classes || '',
                labelPreIcon = attrs.labelPreIcon,
                hideFirstOption = attrs.hideFirstOption || false,
                fixedWidth = attrs.fixedWidth || null,
                sliderButton = attrs.sliderButton === 'true' ? true : false;

            if (type === 'horizontal') {
                return '<div class="dropdown-button ' + color + ' ' + direction + ' type-' + type +' icon-' + icon + ' ' + classes + '">' +
                            '<span class="button button-on-off ' + color + ' ' + icon + '"></span>' +
                            '<div class="dropdown-button-controls">' +
                                '<span class="controls-triangle"></span>' +
                                '<ul class="dropdown-button-options ' + color + ' ' + direction + ' type-' + type +' icon-' + icon + ' ' + classes + '">' +
                                    '<li class="dropdown-button-option" ng-repeat="option in options" index="{{$index}}">' +
                                        //'<span ng-if="!option.dropdown" class="button icon {{option.icon}}"></span>' +
                                        '<span class="button icon {{option.icon}}"></span>' +
                                        //'<dropdown-button ng-if="option.dropdown" sub-button="true" class="sub-button" color={{color}} direction="up" type="icon" icon="{{option.icon}}"></dropdown-button>' +
                                    '</li>' +
                                '</ul>' +
                            '</div>' +
                       '</div>';
            } else {
                var trackBy = (attrs.valueField || attrs.trackBy) ? ' track by option.' + (attrs.valueField || attrs.trackBy) : '';
                var labelStyle = '';

                if (fixedWidth) {
                    labelStyle = 'style="width: ' + fixedWidth + '; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"';
                }

                // JS - string interpolation changed to regular string concatenation here,
                // angular form validation didn't work correctly when the class attribute was interpolated
                return (attrs.subButton === 'true' ?
                        '<div class="button dropdown-button {{color}} arrow-{{direction}}-small type-{{type}} icon-{{icon}}" ng-class="{\'label-pre-icon-on\':labelPreIcon, \'no-label\':noLabel, \'no-arrow\':noArrow}"' :

                        '<div title={{options[selectedOptionIndex].iconText}} class="button dropdown-button ' + color + ' arrow-' + direction + '-small type-' + type +' icon-' + icon + ' ' + classes + '"') + ' ng-class="{\'dropdown-active\': active, \'label-pre-icon-on\':labelPreIcon, \'no-label\':noLabel, \'no-arrow\':noArrow}">' +
                            '<span class="dropdown-max-label" ' + labelStyle + '>{{maxLabel}}</span>'+

                            (type === 'standard' ? '<span class="dropdown-button-label" ' + labelStyle + '>'+
                                '<span ng-if="labelPreIcon" class="label-pre-icon label-icon-{{labelPreIcon}}"></span>'+
                                '{{ selectedOptionIndex>=0 ? options[selectedOptionIndex][labelField] : label }}'+
                            '</span>' : '') +

                            ((type === 'icon') ? '<span class="icon '+(attrs.active ? '' : 'active') +' {{options[selectedOptionIndex].icon}}" ' + (attrs.active ? 'ng-class="{\'active\': active}"' : '' ) + '></span>' : '') +
                            //((type === 'icon' && sliderButton) ? '<span class="icon '+(attrs.active ? '' : 'active') +' {{icon}}" ' + (attrs.active ? 'ng-class="{\'active\': active}"' : '' ) + '></span>' : '') +
                        '</div>';
            }
        }
    };
}]);
