'use strict';

angular.module('pace.layout')
    .service('swatchApplyToService', function() {
        var i = 0;

        this.getNewId = function() {
            return ++i;
        }

        this.getLastId = function() {
            return i;
        }
    })
    .directive('pageRangeInput', ['$debounce', function($debounce){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {

                function parsePageNumbers(pages) {
                    if (!pages || pages==='') return null;

                    var numPages = parseInt(attrs.maxPages) || 1000;
                    var result = [];
                    var regexp = /(\d+\-\d+)|(\d+)/g;

                    var matches = pages.match(regexp);
                    for (var j = 0; j < matches.length; j++) {
                        var grp = matches[j];

                        if (grp.indexOf("-")>0) {
                            var range = grp.split("-");
                            var from = parseInt(range[0]);
                            var to = parseInt(range[1]);

                            if (from<=0) from = 1;

                            if (to==from) {
                                if (result.indexOf(to)===-1 && to<numPages) {
                                    result.push(to);
                                }
                            } else if (to<from)
                                continue;

                            for(var i=from;i<=to;i++) {
                                if (result.indexOf(i)===-1 && i<=numPages) {
                                    result.push(i);
                                }
                            }

                        } else {
                            var num = parseInt(grp);
                            if (num<=0) num = 1;

                            if (result.indexOf(num)===-1 && num<=numPages) {
                                result.push(num);
                            }
                        }
                    }
                    return result;
                }

                function normalizePrintedPages(pagesText) {
                    var pages = parsePageNumbers(pagesText);
                    if (!pages || pages.length==0) {
                        return null;
                    }

                    pages.sort(function(a,b) { return a - b; });

                    var n = pages.length;
                    var last = pages[0];
                    var currentRangeFrom = pages[0];
                    var ranges = [];
                    for(var i=1;i<n;i++) {
                        if (pages[i] - last>1) {
                            if (last>currentRangeFrom)
                                ranges.push(currentRangeFrom + "-" + last);
                            else
                                ranges.push(currentRangeFrom);
                            currentRangeFrom = pages[i];
                        }
                        last = pages[i];
                    }
                    if (last>currentRangeFrom)
                        ranges.push(currentRangeFrom + "-" + last);
                    else
                        ranges.push(currentRangeFrom);

                    var result = ranges.join(",") + ',';

                    return result;
                }

                function fixInput() {
                    var text = ngModelCtrl.$viewValue;
                    var transformedInput = normalizePrintedPages(text) || '';
                    if (transformedInput!==text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                }

                var fixDebounced = $debounce(fixInput, 1000);
                var keyCodes = [13,8,9,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105,109,110,173,188,189];

                function onKeyDown(event) {
                    var keyCode = event.keyCode;

                    if (keyCodes.indexOf(keyCode) === -1 || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                        event.stopPropagation();
                        event.preventDefault();
                    } 
                    else if (keyCode === 13) {
                        fixInput();
                        return;
                    }
                    fixDebounced();
                }
                element.on('keydown', onKeyDown);
            }
        };
    }])

    .directive('swatchApplyTo', ['$timeout', '$window', '$rootScope', 'swatchApplyToService', 'ngDialog', function ($timeout, $window, $rootScope, swatchApplyToService, ngDialog) {
        return {
            restrict: 'A',
            scope: {
                numSpreads: '=',
                pageType: '=',
                applyToOptions: '=',
                applyToOption: '=',
                applyToRange: '=',
                onApplyToChange: '&onApplyToChange'
            },
            link: function postLink(scope, element, attrs) {
                var dropdownId = swatchApplyToService.getNewId();
                var template = '' +
                    '<div id="swatch-options-' + dropdownId + '" class="swatch-options">' +
                        '<span class="swatch-bar"></span>' +
                        '<span class="swatch-arrow"></span>' +
                        '<ul class="swatch-options-list"></ul>' +
                    '</div>';

                var optionsEl = $(template);
                var optionsListEl = optionsEl.find('.swatch-options-list');
                var arrowEl = optionsEl.find('.swatch-arrow');
                var isOptionsHover = false;
                var isSwatchHover = false;
                var activeSwatch = null;
                var optionsWidth = 0;

                $('body').append(optionsEl);

                renderItems();

                scope.$watch('applyToOptions', renderItems);

                element.on({
                    'mouseenter': swatchEnter,
                    'mouseleave': swatchLeave,
                    'click': swatchClick
                }, '.recently-used-color');

                element.on('$destroy', function() {
                    removeElementListeners();
                    optionsEl.remove();
                });

                optionsEl.on('mousedown', '.swatch-option', optionClick);

                function renderItems() {
                    if (!scope.applyToOptions) {
                        return;
                    }

                    optionsListEl.empty();

                    var items = scope.applyToOptions.map(function(item) {
                        return '<li class="swatch-option" swatch-value="' + item.value + '"><span>' + item.name + '</span></li>';
                    });

                    optionsListEl.html(items);

                    // reset cached width so it will be calculated later on
                    optionsWidth = 0;
                }

                function optionClick(e) {
                    var applyToOption = e.currentTarget.getAttribute('swatch-value');

                    if (applyToOption === 'range') {
                        openRangeModal(applyToOption);
                    } else {
                        scope.applyToOption = applyToOption;
                        scope.onApplyToChange({value:applyToOption});
                        hideOptions();
                    }
                }

                function removeElementListeners() {
                    element.off({
                        'mouseenter': swatchEnter,
                        'mouseleave': swatchLeave
                    }, '.recently-used-color');
                }

                function addOptionsListeners() {
                    optionsEl.on({
                        'mouseenter': optionsEnter,
                        'mouseleave': optionsLeave
                    });
                }

                function removeOptionsListeners() {
                    optionsEl.off({
                        'mouseenter': optionsEnter,
                        'mouseleave': optionsLeave
                    });
                }

                function showOptions() {
                    calculatePosition();
                    optionsEl.slideDown(200);
                    addOptionsListeners();
                }

                function hideOptions() {
                    $timeout(function() {
                        if (!isOptionsHover && !isSwatchHover) {
                            activeSwatch = null;
                            optionsEl.slideUp(200);
                            removeOptionsListeners();
                        }
                    }, 100);
                }

                function swatchEnter(e) {
                    activeSwatch = $(e.target);

                    if (!activeSwatch.hasClass('active')) {
                        return;
                    }

                    isSwatchHover = true;
                    showOptions(e);
                }

                function swatchLeave() {
                    isSwatchHover = false;
                    hideOptions();
                }

                function swatchClick(e) {
                    swatchEnter(e);
                }

                function optionsEnter() {
                    isOptionsHover = true;
                    showOptions();
                }

                function optionsLeave() {
                    isOptionsHover = false;
                    hideOptions();
                }

                function calculatePosition() {
                    // check if options width is calculated
                    if (!optionsWidth) {
                        // calculate and store it
                        optionsWidth = optionsEl.outerWidth();
                    }

                    var offset = activeSwatch.offset();
                    var elHeight = activeSwatch.outerHeight();

                    // left offset + 50% width of swatch box + 50% width of options element
                    var left = offset.left + 30 - (optionsWidth / 2);

                    var right = 'auto';
                    var arrowLeft = left + (optionsWidth / 2);

                    if (offset.left + optionsWidth > $('body').width()) {
                        left = 'auto';
                        right = 10;
                    }

                    optionsEl.css({
                        top: offset.top + elHeight + 12,
                        left: left,
                        right: right
                    });

                    arrowEl.css({
                        top: offset.top + elHeight - 12,
                        left: arrowLeft
                    });
                }

                function openRangeModal(applyToOption) {
                    removeOptionsListeners();
                    isOptionsHover = false;
                    isSwatchHover = false;

                    var modalScope = $rootScope.$new();
                    modalScope.pageType = scope.pageType;
                    
                    if (scope.pageType==='PageBased')
                        modalScope.maxPages = (scope.numSpreads - 1) * 2;
                    else
                        modalScope.maxPages = scope.numSpreads;

                    modalScope.ok = function(swatchRangeValue) {
                        scope.applyToOption = applyToOption;
                        scope.applyToRange = swatchRangeValue;
                        scope.onApplyToChange();
                        hideOptions();
                    };

                    modalScope.cancel = function() {
                        hideOptions();
                    };

                    ngDialog.open({
                        template: 'views/layout/swatchRangeModal.html',
                        scope: modalScope,
                        className: 'pace-modal pace-modal-dark',
                        showClose: false,
                        controller: 'SwatchRangeModal'
                    });
                }
            }
        };

    }]);
