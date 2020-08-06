'use strict';

angular.module('paceApp')
.directive('dropdownButtonSplit', ['$compile', '$parse', '$timeout', '$window', 'IconSet', 'dropdownButtonService', function($compile, $parse, $timeout, $window, IconSet, dropdownButtonService) {
    return {
        replace: true,
        restrict: 'E',
        scope: {
            active: '=',
            isDisabledPrimary: '&',
            isDisabledDrop: '&'
        },
        priority: -10000,
        require: '?ngModel',
        link: function postLink(scope, element, attrs, ngModelCtrl) {
            //
            // Variables
            //
            var dropdownId = dropdownButtonService.getNewId();
            var optionsElement = element.find('ul').first();
            var changeFn = $parse(attrs.onChange);
            var animationDuration = 200;
            var elHeight = element.outerHeight();
            var isHiddenScroll = $('html').hasClass('hiddenscroll');
            var trackBy = (attrs.valueField || attrs.trackBy) ? ' track by option.' + (attrs.valueField || attrs.trackBy) : '';
            var bodyEl = $('body');
            var scrollDirection = null;
            var innerWrapper;
            var innerWrapperBaseWidth;
            var optionsElementBaseHeight;
            var scrollableContainers;

            scope.type = attrs.type || 'standard';
            scope.icon = attrs.icon || '';
            scope.iconText = (attrs.iconText === 'true') ? true : false;
            scope.labelField = attrs.labelField || 'label';
            scope.items = attrs.items || null;
            scope.label = attrs.label || null;
            scope.direction = attrs.direction || 'down';
            scope.color = attrs.color || '';
            scope.classes = attrs.classes || '';
            scope.noLabel = attrs.noLabel || null;
            scope.noArrow = attrs.noArrow || null;
            scope.manualId = attrs.manualId || '';
            scope.valueField = (attrs.valueField) ? attrs.valueField : 'value';

            scope.filterNonPrimaryOptions = function(option) {
                if (option.isPrimary === false || option.isPrimary === undefined) {
                    return true;
                }

                return false;
            }

            scope.getPrimaryOption = function() {
                return _.find(scope.options, function(option) {
                    return option.isPrimary === true;
                });
            }

            initiateInnerWrapper();

            element.attr('data-dropdown-main-button-id', dropdownId);

            function initiateInnerWrapper() {
                $timeout(function() {
                    optionsElement = $('<ul class="dropdown-button-options {{color}} arrow-{{direction}}-small type-{{type}} icon-{{icon}} {{classes}}" ng-class="{\'label-pre-icon-on\':getPrimaryOption() && getPrimaryOption().labelPreIcon, \'no-label\':noLabel, \'no-arrow\':noArrow, \'icon-text\':iconText}" data-manual-id="{{manualId}}">' +
                        '<div class="dropdown-button-options-inner-wrapper">' +
                            '<span class="scroll-up-arrow">&#9650;</span>' +
                            '<li ng-repeat="option in options | filter: filterNonPrimaryOptions ' + trackBy + '" option-value="{{option[valueField]}}" class="dropdown-button-option" ng-class="{\'label-pre-icon-on\':option.labelPreIcon, \'dropdown-separator\':option.separator, \'label-pre-icon-invisible\':option.labelPreIconInvisible, \'right-label-on\':option.rightLabel, \'disabled\':option.disabled, \'indent\': option.indent}">' +
                                '<span ng-if="option.labelPreIcon" class="label-pre-icon label-icon-{{option.labelPreIcon}}" ng-class="{\'indent\': option.indent}"></span>' +
                                (scope.type === 'standard' ? '<span class="dropdown-option-label">{{option[labelField]}}<span ng-if="option.rightLabel !== undefined">{{option.rightLabel}}</span></span>' : '') +
                                (scope.type === 'icon' ? '<span class="icon {{option.icon}}"></span>' : '') +
                                '<span ng-if="option.iconText" class="dropdown-option-icon-text">{{option.iconText}}</span>' +
                            '</li>' +
                            '<span class="scroll-down-arrow">&#9660;</span>' +
                        '</div>' +
                    '</ul>');

                    var newScope = scope.$new();
                    $compile(optionsElement)(newScope);
                    optionsElement.attr('data-dropdown-button-id', dropdownId);
                    bodyEl.append(optionsElement);

                    optionsElement.off('click').on('click', optionsOnClick);

                    innerWrapper = optionsElement.find('.dropdown-button-options-inner-wrapper');
                }, 100);
            }

            // update DOM
            function render() {
                if (scope.type === 'standard' || scope.type === 'icon') {
                    var options = scope.options,
                        resolved = true;

                    if (options && options.$promise) {
                        resolved = options.$resolved;
                    }

                    if ($('[data-dropdown-button-id="' + dropdownId + '"]').length) {
                        $timeout(function() {
                            var elemToPostion = optionsElement;
                            elemToPostion.removeClass('scroll-on');
                            elemToPostion.css('height', '');
                            elemToPostion.css('width', '');
                            optionsElementBaseHeight = 0;
                            innerWrapperBaseWidth = 0;
                        }, animationDuration + 100);
                    }
                }
            }

            if (scope.type === 'icon') {
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
                    scope.options = value;
                    calculateLongestLabel();
                    render();
                });
            }

            attrs.$observe('label', function(value) {
                scope.label = value;
            });


            //
            // Functions
            //
            function calculateLongestLabel() {
                if (scope.type !== 'standard') {
                    return;
                }

                var maxTxt = scope.label || '';

                if (scope.options) {
                    angular.forEach(scope.options, function(item) {
                        var label = item[scope.labelField];

                        if (label && label.length > maxTxt.length) {
                            maxTxt = label;
                        }
                    });
                }

                scope.maxLabel = maxTxt;
            }

            function calculateWidth() {
                if (scope.type === 'standard') {
                    optionsElement.css({width: element.outerWidth()});
                }
            }

            function calculateOptionsPosition(event, setBaseSize) {
                var elemToPostion = optionsElement;
                var offset = element.offset();

                if (setBaseSize && !innerWrapperBaseWidth && innerWrapper && innerWrapper.length) {
                    innerWrapperBaseWidth = innerWrapper.width();
                }

                if (!elHeight) {
                    elHeight = element.outerHeight();
                }

                if (scope.direction === 'up') {
                    elemToPostion.css({
                        bottom: $window.innerHeight - offset.top + 2,
                        left: offset.left,
                        top: 'auto'
                    });
                } else {
                    elemToPostion.css({
                        top: offset.top + elHeight + (-4),
                        left: offset.left,
                        bottom: 'auto'
                    });
                }

                if (setBaseSize) {
                    innerWrapper.css({
                        width: innerWrapperBaseWidth + 'px',
                        'overflow-y': 'hidden'
                    });
                }

                $timeout(function() {
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
                           width: newInnerWrapperWidth + 'px',
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

            function enableScrollListening() {
                calculateOptionsPosition(null, true);

                setTimeout(function() {
                    scrollableContainers = $(':scrollable:not(.dropdown-button-options-inner-wrapper)');
                    scrollableContainers.scroll(calculateOptionsPosition);
                }, animationDuration + 10);
            }

            function disableScrollListening() {
                if (!scrollableContainers) return;

                scrollableContainers.off('scroll', calculateOptionsPosition);
            }

            function optionsOnClick(e) {
                e.stopPropagation();

                var optionValue = $(e.target).closest('.dropdown-button-option').attr('option-value');
                var item = _.find(scope.options, function(option) {
                    return (option[scope.valueField] === optionValue);
                });

                // cancel action if separator
                if (!item) {
                    return;
                }

                // cancel action if disabled
                if (item.disabled) {
                    return;
                }

                if (typeof item.callback === "function") {
                    item.callback();
                }
            }

            function toggleActiveActionButton(isActive) {
                if (isActive && !element.hasClass('active-action-button')) {
                    element.addClass('active-action-button');
                } else if (!isActive && element.hasClass('active-action-button')) {
                    element.removeClass('active-action-button');
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

                var elemToPostion = optionsElement;
                elemToPostion.removeClass('scroll-on');
                elemToPostion.slideUp(animationDuration, doClose);
            }

            function onMouseUp(e) {
                $timeout(function() {
                    var target = $(e.target);

                    // don't close when clicking on disabled option
                    if ((target.hasClass('dropdown-button-option') && target.hasClass('disabled')) || (target.closest('li').hasClass('dropdown-button-option') && target.closest('li').hasClass('disabled'))) {
                        return;
                    }

                    closePopup();

                    if (ngModelCtrl) {
                        ngModelCtrl.$blurred = true;
                        element.addClass('ng-blurred');
                    }

                    $(document).unbind('mouseup', onMouseUp);
                });

            }

            element.on('mousemove', function(e) {
                if (element.hasClass('active-action-button') && e.target.classList.contains('dropdown-button-label') || e.target.classList.contains('label-pre-icon')) {
                    return;
                }
                
                if (!e.target.classList.contains('split-button-drop')) {
                    toggleActiveActionButton(true);
                } else {
                    toggleActiveActionButton(false);
                }
            });

            element.on('mouseout', function(e) {
                if (!e.toElement || e.toElement.classList.contains('dropdown-button-label') || e.toElement.classList.contains('label-pre-icon')) {
                    return;
                }

                toggleActiveActionButton(false);
            });

            element.on('click', function(e) {
                if (scope.type === 'icon' && attrs.active) {
                    if (e.offsetX < (element.outerWidth() - 18) || e.offsetY < (element.outerHeight() - 18)) {
                        return;
                    }
                }

                if (!e.target.classList.contains('split-button-drop')) {
                    if (element.hasClass('is-disabled-primary')) {
                        return;
                    }

                    var primaryOption = scope.getPrimaryOption();

                    if (primaryOption && typeof primaryOption.callback === "function") {
                        primaryOption.callback();
                    }

                    return;
                } else if (e.target.classList.contains('split-button-drop') && element.hasClass('is-disabled-drop')) {
                    return;
                }

                e.stopPropagation();
                e.stopImmediatePropagation();

                calculateWidth();

                if (!element.hasClass('active')) {
                    element.addClass('active');

                    optionsElement.slideDown(animationDuration);

                    enableScrollListening();
                    enableScrollArrows();

                    $(document).on('mouseup', onMouseUp);
                    element.trigger('focusin');
                } else {
                    closePopup();
                }
            });

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
                hideFirstOption = attrs.hideFirstOption || false,
                fixedWidth = attrs.fixedWidth || null;

            
            var trackBy = (attrs.valueField || attrs.trackBy) ? ' track by option.' + (attrs.valueField || attrs.trackBy) : '';
            var buttonStyle = '';
            var labelStyle = '';

            if (fixedWidth) {
                buttonStyle = 'style="width: ' + fixedWidth + '"';
                labelStyle = 'style="width: calc(100% - 43px); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"';
            }

            return '<div class="button dropdown-button is-split-dropdown ' + color + ' arrow-' + direction + '-small type-' + type +' icon-' + icon + ' ' + classes + '" ' + buttonStyle +
                        ' ng-class="{\'active\': active, \'label-pre-icon-on\':getPrimaryOption() && getPrimaryOption().labelPreIcon, \'no-label\':noLabel, \'no-arrow\':noArrow, \'is-disabled-primary\': isDisabledPrimary(), \'is-disabled-drop\': isDisabledDrop()}">' +
                '<span class="dropdown-max-label" ' + labelStyle + '>{{maxLabel}}</span>'+

                (type === 'standard' ? '<span class="dropdown-button-label" ' + labelStyle + '>'+
                    '<span ng-if="getPrimaryOption() && getPrimaryOption().labelPreIcon" class="label-pre-icon label-icon-{{getPrimaryOption().labelPreIcon}}"></span>'+
                    '{{ (getPrimaryOption()) ? getPrimaryOption()[labelField] : label }}'+
                '</span>' : '') +

                (type === 'icon' ? '<span class="icon '+ (attrs.active ? '' : 'active') + ' {{getPrimaryOption().icon}}" ' + (attrs.active ? 'ng-class="{\'active\': active}"' : '' ) + '></span>' : '') +
                '<span class="split-button-drop"></span>' +
            '</div>';
        }
    };
}]);
