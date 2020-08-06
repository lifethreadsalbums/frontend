'use strict';

angular.module('pace.proofer')
    .controller('ProoferPreviewCtrl', ['$scope', '$rootScope', 'productPrototype', 'layout', 'coverLayout', 'ProoferService', 
        'NotificationEvent', '$timeout', 'AppConstants', 'KeyboardService', 'MessageService', '$state', '$interval', '$window',
        'currentStore', 'prooferSettings',
        function ($scope, $rootScope, productPrototype, layout, coverLayout, ProoferService, 
            NotificationEvent, $timeout, AppConstants, KeyboardService, MessageService, $state, $interval, $window,
            currentStore, prooferSettings) {

            var slideshowInterval;

            var layoutController = $scope.layoutController = new PACE.LayoutController($scope);
            layoutController.scale = 0.5;
            layout.viewState = layout.viewState || {};

            $scope.layout = layout;
            $scope.productPrototype = productPrototype;
            $scope.model = {
                slideshowPlaying: false
            };
            

            setupLayout(layout);
           
            $scope.isSpreadBased = productPrototype.productPageType === 'SpreadBased';

            $scope.changePage = function(direction) {
                new PACE.PageNavCommand($scope.toolbarCtrl, direction).execute();
            };

           
            $scope.flipBookProps = {
                layout: layout,
                coverLayout: coverLayout,
                layoutController: layoutController,
                productPrototype: productPrototype,
                onPageChanged: onPageChanged,
                onPageChanging: onPageChanged,
                containerSelector: '.slideshow',
                commentsEnabled: false
            };

            
            function refreshReact() {
                for (var i = 0; i < arguments.length; i++) {
                    var prop = arguments[i];
                    $scope[prop] =  _.extend({}, $scope[prop]);
                }
            }

            function setupLayout(layout) {
                layout.viewState.filmstripFilter = 'alphabetical';
                layout.lps = layout.layoutSize.lps = productPrototype.productPageType==='SpreadBased';
                layout.pageType = productPrototype.productPageType;
                if (layout.isLayFlat && !layout.lfAdjusted) {
                    var ls = layout.layoutSize;
                    var prop = (ls.pageOrientation==='Horizontal') ? 'width' : 'height';
                    ls[prop] -= AppConstants.LF_HIDDEN_AREA;
                    layout.lfAdjusted = true;
                }
                new PACE.UpdateFilmstripStatsCommand(layout, []).execute();
            }

            function makeFakeRenderer(spread) {
                return {
                    spread: spread,
                    makeFirstVisible: _.noop
                };
            }

            $scope.toolbarCtrl = {
                setCurrentRenderer: function(r) {
                    this.currentRenderer = r;
                    $scope.flipBookProps.currentSpread = r.spread;
                 
                    refreshReact('flipBookProps');
                    $scope.$broadcast('layout:current-renderer-changed');
                },
                renderers: _.map(layout.spreads, makeFakeRenderer)
            };

            $scope.toolbarCtrl.currentRenderer = $scope.toolbarCtrl.renderers[0];

            function onPageChanged(page) {
                page = Math.floor(page/2) * 2;
                if (productPrototype.productPageType === 'SpreadBased') page--;
                var spreadIdx = Math.floor(page/2);

                $scope.toolbarCtrl.currentRenderer = $scope.toolbarCtrl.renderers[spreadIdx];
                $scope.$broadcast('layout:current-renderer-changed');
            }
           
            $scope.onKeyDown = function(e) {
                var activeElement = $(document.activeElement);
                if (activeElement.is('input') || activeElement.is('textarea')) return;

                var shortcut = KeyboardService.getShortcut(e);

                var shortcutMap = {
                    'LEFT':           { cmd: PACE.PageNavCommand, params:[-1] },
                    'RIGHT':          { cmd: PACE.PageNavCommand, params:[1] },
                    'PAGEUP':         { cmd: PACE.PageNavCommand, params:[-1] },
                    'PAGEDOWN':       { cmd: PACE.PageNavCommand, params:[1] },
                    'SHIFT+LEFT':     { cmd: PACE.PageNavCommand, params:[-5] },
                    'SHIFT+RIGHT':    { cmd: PACE.PageNavCommand, params:[5] },
                    'SHIFT+PAGEUP':   { cmd: PACE.PageNavCommand, params:[-5] },
                    'SHIFT+PAGEDOWN': { cmd: PACE.PageNavCommand, params:[5] },
                };
                var cmdInfo = shortcutMap[shortcut];
                if (cmdInfo) {
                    var args = [null, $scope.toolbarCtrl];
                    if (cmdInfo.params)
                        args = _.union(args, cmdInfo.params);

                    var cmdInstance = new (Function.prototype.bind.apply(cmdInfo.cmd, args));
                    cmdInstance.execute();
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            //
            // Play / Stop slideshow
            //
            $scope.playSlideshow = function() {
                $scope.model.slideshowPlaying = true;
                slideshowInterval = $interval(nextSlide, 4500);
            };

            $scope.stopSlideshow = function() {
                $scope.model.slideshowPlaying = false;

                if (slideshowInterval) {
                    $interval.cancel(slideshowInterval);
                    slideshowInterval = null;
                }
            };

            function nextSlide() {
                if (isLastPage()) {
                    $scope.stopSlideshow();
                } else {
                    $scope.changePage(1);

                    if (isLastPage()) {
                        $scope.stopSlideshow();
                    }
                }
            }

            function isLastPage() {
                var currentSpread = $scope.toolbarCtrl.currentRenderer.spread;
                var spreadIndex = layout.spreads.indexOf(currentSpread);
                var currentPage = Math.max(1, $scope.isSpreadBased ? spreadIndex + 1 : currentSpread.pageNumber);
                var numPages = $scope.isSpreadBased ? layout.spreads.length : ((layout.spreads.length - (layout.lps ? 0 : 1)) * 2);

                return currentPage >= numPages;
            }

            
        }
    ]);
