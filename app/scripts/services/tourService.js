'use strict';

angular.module('paceApp')
    .service('TourService', ['AuthService', 'Settings', '$rootScope', '$state', '$location', '$timeout', 'StoreConfig', function TourService(AuthService, Settings, $rootScope, $state, $location, $timeout, StoreConfig) {
        var intro;
        var config;
        var userSettings;
        var deregisterStateChangeSuccess;
        var isDisableExitOnRouteChange = false;

        var tourList = [
            {
                id: 'dashboardOverview',
                name: 'Dashboard Overview',
                path: [
                    'dashboard.default.overview',
                    'dashboard.default.overview.product'
                ]
            }, {
                id: 'productBuilder',
                name: 'Product Builder',
                path: [
                    'build.section'
                ],
                pathRegex: /\/details$/,
                // pathParams: [
                //     {
                //         key: 'section',
                //         value: 'details'
                //     }
                // ],
                pathFunc: function() {
                    return !$rootScope.isSinglePrintProduct;
                }
            }
            , {
                id: 'printsOverview',
                name: 'Prints Overview',
                path: [
                    'build.section'
                ],
                pathFunc: function() {
                    return $rootScope.isSinglePrintProduct;
                }
            }
            , {
                id: 'designerOverview',
                name: 'Designer Overview',
                path: [
                    'layout'
                ]
            }
        ];

        this.getAvailable = function() {
            var availableTours = [];

            if (tourList && tourList.length) {
                for (var i = 0; i < tourList.length; i++) {
                    var isPathRegexOk = true;
                    var isPathParamsOk = true;
                    var isPathFuncOk = true;

                    if (tourList[i].pathRegex && !tourList[i].pathRegex.test($location.path())) {
                        isPathRegexOk = false;
                    }

                    if (tourList[i].pathParams && tourList[i].pathParams.length) {
                        for (var k = 0; k < tourList[i].pathParams.length; k++) {
                            var param = tourList[i].pathParams[k];
                            if ($state.params[param.key] !== param.value) {
                                isPathParamsOk = false;
                                break;
                            }
                        }
                    }

                    if (typeof tourList[i].pathFunc === 'function') {
                        isPathFuncOk = tourList[i].pathFunc();
                    }

                    for (var j = 0; j < tourList[i].path.length; j++) {
                        if (isPathRegexOk && isPathParamsOk && isPathFuncOk && $state.is(tourList[i].path[j])) {
                            availableTours.push({
                                id: tourList[i].id,
                                name: tourList[i].name
                            });
                            break;
                        }
                    }
                }
            }

            return availableTours;
        };

        this.start = function(options) {
            if (!options.config) { return; };

            config = options.config;

            if (typeof config !== 'object' || !config.steps || !config.id) { return; }

            if (options.forceStart) {
                config.forceStart = true;
            };

            var user = AuthService.getCurrentUser();

            Settings.getUserSettings(user.id)
                .then(function(settings) {
                    userSettings = settings;

                    var isTourCompleted = userSettings.settings.tour && userSettings.settings.tour[config.id];
                    var tourStartCount = userSettings.settings.tour && userSettings.settings.tour[config.id + 'StartCount'];

                    if (typeof tourStartCount === 'undefined') {
                        tourStartCount = 0;
                    }

                    if ((!isTourCompleted && tourStartCount < StoreConfig.tourBypassLimit) || config.forceStart) {
                        init();
                    }
                });
        };

        this.stop = function() {
            if (intro) {
                intro.exit();
            }
        };

        this.disableTourButton = function(isDisable) {
            disableTourButton(isDisable);
        };

        this.disableExitOnRouteChange = function(isDisable) {
            isDisableExitOnRouteChange = isDisable;
        };

        function init() {
            var introOptions =  {
                tooltipClass: 'pace-intro',
                showStepStatus: true,
                showBullets: false,
                showProgress: false,
                skipLabel: '<img src="/images/tour/tour-close-thin.png">',
                doneLabel: "I'm done!",
                nextLabel: 'Next',
                prevLabel: '<span class="introjs-prevbutton-icon"></span>',
                doneLabelTooltip: 'Next (→)',
                skipLabelTooltip: 'Stop Tour (esc)',
                prevLabelTooltip: 'Previous (←)',
                nextLabelTooltip: 'Next (→)',
                keyboardNavigation: true,
                scrollToElement: false,
                showStepNumbers: false,
                overlayOpacity: 0,
                steps: config.steps
            };

            if (config.options) {
                Object.assign(introOptions, config.options);
            }

            intro = introJs();
            intro.setOptions(introOptions);

            intro.onbeforechange(function(targetElement) {
                scrollToElement(targetElement);

                if (typeof intro._introItems[intro._currentStep].onBefore === 'function') {
                    intro._introItems[intro._currentStep].onBefore(targetElement);
                }
            });

            intro.onafterchange(function(targetElement) {
                if (typeof intro._introItems[intro._currentStep].onAfter === 'function') {
                    intro._introItems[intro._currentStep].onAfter(targetElement);
                }

                // $('.introjs-tooltipbuttons').foundation('tooltip');
            });

            intro.oncomplete(function() {
                saveState();
            });

            intro.onexit(function(isSkip) {
                if (typeof config.onAfter === 'function') {
                    config.onAfter();
                }

                if (isSkip) {
                    saveState();
                }

                stop();
            });

            isDisableExitOnRouteChange = false;
            deregisterStateChangeSuccess = $rootScope.$on('$stateChangeSuccess', stateChanged);

            if (typeof config.onBefore === 'function') {
                config.onBefore();
            }

            disableTourButton(false);

            intro.start();
            $('body').css('overflow','hidden');

            updateStartCount();

            $timeout(function() {
                $rootScope.tourInProgress = true;
                $rootScope.$apply();
            });
        };

        function updateStartCount() {
            if (!userSettings.settings.tour || !userSettings.settings.tour[config.id + 'StartCount'] || userSettings.settings.tour[config.id + 'StartCount'] < StoreConfig.tourBypassLimit) {
                if (!userSettings.settings.tour) {
                    userSettings.settings.tour = {};
                }

                if (!userSettings.settings.tour[config.id + 'StartCount']) {
                    userSettings.settings.tour[config.id + 'StartCount'] = 0;
                }
                userSettings.settings.tour[config.id + 'StartCount']++;
                userSettings.$save();
            }
        }

        function saveState() {
            if (!userSettings.settings.tour) {
                userSettings.settings.tour = {};
            }

            userSettings.settings.tour[config.id] = true;
            userSettings.$save();
        }

        function stop() {
            $timeout(function() {
                $rootScope.tourInProgress = false;
                $rootScope.$apply();
            });

            if ($location.$$search.tour) {
                delete $location.$$search.tour;
                $location.$$compose();
            }

            intro = null;
            config = {};
            deregisterStateChangeSuccess();
            $('body').css('overflow', 'auto');
        };

        function stateChanged() {
            if (!isDisableExitOnRouteChange) {
                intro.exit();
            }
        }

        function scrollToElement(targetElement) {
            var target = $(targetElement);

            if (!isElementInViewport(target)) {
                var container = target.closest('div:scrollable, ul:scrollable');

                if (container) {
                    container.scrollTop(target.offset().top);
                }
            }
        }

        function isElementInViewport(el) {
            if (typeof jQuery === "function" && el instanceof jQuery) {
                el = el[0];
            }

            if (el) {
                var rect = el.getBoundingClientRect();

                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            }

            return true;
        }

        function disableTourButton(isDisable) {
            if (isDisable) {
                $timeout(function() {
                    $('.introjs-prevbutton, .introjs-nextbutton, .introjs-skipbutton').addClass('introjs-button--blocked');
                });
            } else {
                $timeout(function() {
                    $('.introjs-prevbutton, .introjs-nextbutton, .introjs-skipbutton').removeClass('introjs-button--blocked');
                });
            }
        }

    }]);
