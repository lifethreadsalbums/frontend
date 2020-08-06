'use strict';

angular.module('pace.proofer')
    .controller('ProoferCtrl', ['$scope', '$rootScope', 'product', 'productPrototype', 'layout', 'coverLayouts', 'ProoferService', 'user',
        'NotificationEvent', '$timeout', 'AppConstants', 'KeyboardService', 'MessageService', '$state', '$interval', '$window',
        'currentStore', 'prooferSettings', 'FontEvent', 'spines', 'hinges',
        function ($scope, $rootScope, product, productPrototype, layout, coverLayouts, ProoferService, user,
            NotificationEvent, $timeout, AppConstants, KeyboardService, MessageService, $state, $interval, $window,
            currentStore, prooferSettings, FontEvent, spines, hinges) {

            var slideshowInterval;
            var coverLayout;

            if (coverLayouts && coverLayouts.length>0) {
                coverLayout = coverLayouts[0];
                coverLayout.spines = spines;
                coverLayout.hinges = hinges;
                coverLayout.bookLayout = layout;
            }

            $rootScope.appTitle = $window.document.title = product.options._name;

            var layoutController = $scope.layoutController = new PACE.LayoutController($scope);
            var slideshowController = new PACE.LayoutController($scope);
            layoutController.scale = 0.5;
            layout.viewState = layout.viewState || {};
            layout.viewState.bottomTabIndex = 0;

            $scope.layout = layout;
            $scope.productPrototype = productPrototype;
            $scope.product = product;
            $scope.prooferSettings = prooferSettings;
            $scope.prooferSettings.product = product;

            $scope.model = {
                slideshow: prooferSettings.approved,
                slideshowPlaying: false,
                tab: 1,
                toolbarEdits: null,
                bottomContainerCollapsed: $window.innerHeight < 800 ? true : false,
                sidebarFolded: true
            };
            $scope.filmstripModel = {};

            setupLayout(layout);
            ProoferService.onChange(onCommentChange);
            ProoferService.onLoad(onCommentsLoaded);

            function refreshTextBoxes() {
                for (var i = 0; i < layoutController.renderers.length; i++) {
                    var elements = layoutController.renderers[i].spread.elements;
                    var textElements = _.filter(elements, function(el) { return el.type==='TextElement' || el.type==='SpineTextElement'});
                    if (textElements.length>0) {
                        layoutController.renderers[i].render();
                    }
                }
            }

            if (!PACE.FontsLoaded) {
                $scope.$on(FontEvent.FontsLoaded, refreshTextBoxes);
            }

            $scope.isSpreadBased = productPrototype.productPageType === 'SpreadBased';

            $scope.onProoferBadgeClick = function() {
                layoutController.fireEvent('proofer:unread-badge-clicked');
            };

            $scope.changePage = function(direction) {
                new PACE.PageNavCommand($scope.toolbarCtrl, direction).execute();
            };

            $scope.filterOptions = [
                {value: 'alphabetical', label: 'Alphabetical', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'unused', label: 'Unused', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'admin', label: 'Album Order', labelPreIcon: 'filter', labelPreIconInvisible: true}
            ];

            var filterItem = _.findWhere($scope.filterOptions, {value:'admin'});
            filterItem.label = productPrototype.productPageType === 'SpreadBased' ? 'Album Order' : 'Book Order';

            // order filmstrip filters by label
            $scope.filterOptions = _.sortBy($scope.filterOptions, 'label');

            $scope.prooferComponentProps = {
                layoutController: layoutController,
                layout: layout,
                prooferSettings: prooferSettings,
                user: user,
                brideMode: true,
                currentSpread: layout.spreads[0],
                onSelectedEditChanged: onSelectedEditChanged,
                onEditClick: onSelectedEditChanged,
                isSpreadBased: $scope.isSpreadBased,
                onApproveClick: approveAlbum
            };

            $scope.flipBookProps = {
                user: user,
                layout: layout,
                coverLayout: coverLayout,
                layoutController: layoutController,
                product: product,
                productPrototype: productPrototype,
                onPageChanged: onPageChanged,
                onPageChanging: onPageChanged,
                containerSelector: '.proofer-section__content',
                commentsEnabled: !prooferSettings.approved && !$scope.model.slideshow
            };

            $scope.pagesProps = {
                layout: layout,
                layoutController: layoutController,
                pageType: productPrototype.productPageType,
                thumbScale: 1.0,
                thumbSize: 160,
                onPageClick: onPageThumbClick,
                onPageDoubleClick: _.noop,
                currentSpread: layout.spreads[0]
            };

            $scope.fullPagesProps = _.extend({}, $scope.pagesProps);
            $scope.fullPagesProps.thumbSize = 500;
            $scope.fullPagesProps.thumbScale = 0.5;
            $scope.fullPagesProps.autoCenter = true;
            $scope.fullPagesProps.onPageDoubleClick = onPageThumbDoubleClick;

            $scope.slideshowProps = _.extend({}, $scope.flipBookProps);
            $scope.slideshowProps.layoutController = slideshowController;
            $scope.slideshowProps.commentsEnabled = false;

            function onCommentsLoaded() {
                var numPending = ProoferService.getNumPending(),
                    numCompleted = ProoferService.getNumCompleted();
                if (numCompleted>0) {
                    $scope.toggleEdits('completed');
                } else if (numPending>0) {
                    $scope.toggleEdits('pending');
                }
            }

            function onCommentChange() {
                var firstComment = $scope.numPending===0 && ProoferService.getNumPending()===1;
                $scope.numPending = ProoferService.getNumPending();
                $scope.numCompleted = ProoferService.getNumCompleted();

                $scope.numUnreadMessages = ProoferService.getUnreadMessageCount(user);

                if (firstComment) {
                    $scope.toggleEdits('pending');
                } else if ($scope.numCompleted>0 && $scope.numPending===0 && $scope.model.toolbarEdits!=='completed') {
                    $scope.toggleEdits('completed');   
                } if ($scope.numPending>0 && $scope.numCompleted===0 && $scope.model.toolbarEdits!=='pending') {
                    $scope.toggleEdits('pending');   
                }

                if (!$scope.$$phase) $scope.$apply();
            }

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
                    $scope.prooferComponentProps.currentSpread = r.spread;
                    $scope.pagesProps.currentSpread = r.spread;

                    $scope.slideshowProps = _.extend({}, $scope.flipBookProps);
                    $scope.slideshowProps.layoutController = slideshowController;
                    $scope.slideshowProps.commentsEnabled = false;

                    refreshReact('flipBookProps', 'prooferComponentProps', 'pagesProps');
                    $scope.$broadcast('layout:current-renderer-changed');
                },
                renderers: _.map(layout.spreads, makeFakeRenderer)
            };

            $scope.toolbarCtrl.currentRenderer = $scope.toolbarCtrl.renderers[0];


            function onPageChanged(page) {
                page = Math.floor(page/2) * 2;
                if (productPrototype.productPageType === 'SpreadBased') page--;
                var spreadIdx = Math.floor(page/2);

                $scope.prooferComponentProps.currentSpread = layout.spreads[spreadIdx];
                $scope.pagesProps.currentSpread = layout.spreads[spreadIdx];
                refreshReact('prooferComponentProps', 'pagesProps');

                $scope.toolbarCtrl.currentRenderer = $scope.toolbarCtrl.renderers[spreadIdx];
                $scope.$broadcast('layout:current-renderer-changed');
            }

            function onPageThumbClick(spread) {
                $scope.pagesProps.currentSpread = spread;
                $scope.fullPagesProps.currentSpread = spread;
                refreshReact('pagesProps', 'fullPagesProps');

                var r = _.findWhere($scope.toolbarCtrl.renderers, {spread:spread});
                $scope.toolbarCtrl.setCurrentRenderer(r);
            }

            function onPageThumbDoubleClick(spread) {
                $scope.closePages();
                $timeout(function() {
                    onPageThumbClick(spread);
                }, 1000);
            }

            function onSelectedEditChanged(edit) {
                //$scope.flipBookProps.selectedEdit = edit;
                $scope.flipBookProps.currentSpread = edit && edit.spread ? edit.spread : null;

                $scope.slideshowProps = _.extend({}, $scope.flipBookProps);
                $scope.slideshowProps.layoutController = slideshowController;
                $scope.slideshowProps.commentsEnabled = false;

                refreshReact('flipBookProps');
            }

            $scope.nextEdit = function() {
                layoutController.fireEvent('proofer:next-edit-clicked');
            };

            $scope.prevEdit = function() {
                layoutController.fireEvent('proofer:prev-edit-clicked');
            };

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

            function approveAlbum() {
                var msg = $scope.prooferSettings.approved ? 'Do you really want to unapprove this album? Doing so will allow you to make change requests again. Do you want to continue?' :
                    'Are you sure you would like to approve this album? Once approved you will no longer be able to make change requests. Do you want to continue?';

                var doStuff = function() {
                    prooferSettings.product = product;
                    var fn = prooferSettings.approved ? 'unapprove' : 'approve';
                    ProoferService[fn](prooferSettings).then(function(result) {
                        _.extend(prooferSettings, result);
                        $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
                    });

                    prooferSettings.approved = !prooferSettings.approved;
                    $scope.flipBookProps.commentsEnabled = !prooferSettings.approved;
                    $scope.model.slideshow = prooferSettings.approved;
                    refreshReact('flipBookProps', 'prooferComponentProps');
                };

                MessageService.confirm(msg, doStuff);
            };

            $scope.openPages = function() {
                $scope.fullPagesProps.currentSpread = $scope.pagesProps.currentSpread;
                refreshReact('fullPagesProps');
                $scope.model.pages = true;
            };

            $scope.closePages = function() {
                $scope.model.pages = false;
            };

            $scope.initFilmstrip = function(filmstripCtrl) {
                filmstripCtrl.setEditable(false);
            };

            $scope.$watch('fullPagesProps.thumbScale', function(val, oldVal) {
                if (val===oldVal) return;
                refreshReact('fullPagesProps');
            });

            $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
                if (notification.type==='EntityChange' && notification.entityType==='com.poweredbypace.pace.domain.layout.Layout') {
                    var l = JSON.parse(notification.body);
                    if (l.id===$scope.flipBookProps.layout.id) {
                        console.log('layout update', l);
                        $scope.layout = layout = l;
                        ProoferService.setLayout(l);

                        setupLayout(l);
                        $scope.flipBookProps.layout = l;
                       
                        $scope.slideshowProps = _.extend({}, $scope.flipBookProps);
                        $scope.slideshowProps.layoutController = slideshowController;
                        $scope.slideshowProps.commentsEnabled = false;

                        $scope.prooferComponentProps.layout = l;
                        $scope.pagesProps.layout = l;
                        $scope.fullPagesProps.layout = l;
                        $scope.toolbarCtrl.renderers = _.map(layout.spreads, makeFakeRenderer);

                        refreshReact('flipBookProps', 'prooferComponentProps', 'pagesProps', 'fullPagesProps');
                        
                        $scope.$apply();
                    }
                }
                if (notification.type==='CommentTyping') {
                    var comment = JSON.parse(notification.body);
                    layoutController.fireEvent('proofer:comment-typing', comment);
                }

                if (notification.type==='LayoutApproved' || notification.type==='LayoutUnapproved') {
                    var settings = JSON.parse(notification.body);
                    if (prooferSettings.id===settings.id) {
                        _.extend(prooferSettings, settings);
                        $scope.flipBookProps.commentsEnabled = !prooferSettings.approved;
                        $scope.model.slideshow = prooferSettings.approved;
                        refreshReact('flipBookProps', 'prooferComponentProps');
                        $scope.$apply();
                    }
                }
            });

            //
            // Collapse bottom container
            //
            $scope.toggleBottomContainer = function() {
                $scope.model.bottomContainerCollapsed = !$scope.model.bottomContainerCollapsed;
                setTimeout(function() {
                    window.dispatchEvent(new Event('resize'));
                }, 700);
            };

            //
            // Toggle slideshow view
            //
            $scope.openSlideshow = function() {
                $scope.model.slideshow = true;
                $scope.stopSlideshow();
            };

            $scope.closeSlideshow = function() {
                $scope.model.slideshow = false;
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

            function animatePageThumbs(scale) {
                 fabric.util.animate({
                    startValue: $scope.fullPagesProps.thumbScale,
                    endValue: scale,
                    duration: 800,
                    onChange: function(value) {
                        $scope.fullPagesProps.thumbScale = value;
                        $scope.$apply();
                    }
                });
            }

            $scope.zoomToFit = function() {
                var container = $('.frp-pages .layout-section__pages-content'),
                    w = container.width(),
                    h = container.height(),
                    thumbContainer = $('.frp-pages .thumb-container').first(),
                    padX = 38 * 2,
                    padY = 8 * 2,
                    tw = (thumbContainer.width() / $scope.fullPagesProps.thumbScale),
                    th = (thumbContainer.height() / $scope.fullPagesProps.thumbScale);

                var found = false,
                    s = 0.1;
                while(!found && s<=2.0) {
                    var thumbW = (tw * s) + padX,
                        thumbH = (th * s) + padY;
                    var cols = Math.floor(w / thumbW),
                        rows = Math.ceil(layout.spreads.length / cols),
                        height = rows * thumbH;
                    if (height>h) {
                        found = true;
                    } else {
                       s += 0.05;
                    }
                }
                animatePageThumbs(s - 0.05);
            };

            $scope.zoomDefault = function() {
                animatePageThumbs(0.5);
            };

            $scope.toggleEdits = function(type) {
                $scope.model.toolbarEdits = type;
                layoutController.fireEvent('proofer:filter-clicked', type);
            };

            $scope.toggleSidebar = function(forcedValue) {
                $scope.model.sidebarFolded = (typeof forcedValue === 'boolean') ? forcedValue : !$scope.model.sidebarFolded;
            };
        }
    ]);
