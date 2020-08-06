'use strict';

agGrid.initialiseAgGridWithAngular1(angular);

angular.module('paceApp', ['ui.router', 'ngResource', 'ngSanitize', 'localization', 'ui.event', 'ngDialog',
    'ngAnimate',
    'pace.build', 'pace.login', 'pace.cart', 'pace.order', 'pace.layout', 'pace.admin',
    'pace.templates', 'pace.static', 'pace.adminOrders',
    'rzModule', 'pace.dashboard', 'pace.proofer', 'angular-flexslider',
    'angular-datepicker',
    '720kb.datepicker', 'ui.mask', 'modelOptions', 'react', 'agGrid', 'ui.ace', 'pace.prints'])
.config(['$httpProvider', '$compileProvider', '$stateProvider', '$urlRouterProvider', '$animateProvider',
        function($httpProvider, $compileProvider, $stateProvider, $urlRouterProvider, $animateProvider) {

    $httpProvider.interceptors.push('PaceHttpInterceptor');

    $urlRouterProvider.otherwise('/dashboard');

    //allow loading images from blob URLs
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|blob:|data:image\//);

    //disable animation for class ng-animate-disabled
    $animateProvider.classNameFilter(/\bng-animate-enabled\b/);

}])

.constant('AppVersion', '2018.04.16')

.constant('AppConstants',
    {
        PPI: 72,
        POINTS_PER_CM: 28.3464,
        LF_HIDDEN_AREA: 0.3937 * 72,
        DEFAULT_FIXED_SPACING: 0.09375, // 0.125,
        DATE_FORMAT: 'DD/MM/YYYY',
        DATE_TIME_FORMAT: 'DD/MM/YYYY HH:mm',
        YEAR_NUMBER: 10000,
        MONTH_NUMBER: 100
    }
)

.constant('Page', { LEFT:'left', RIGHT:'right', BOTH:'both' })

.value('StoreConfig',
    {
        urlPrefix: 'https://irisbook.s3.amazonaws.com/',
        imageUrlPrefix: 'https://irisbook.s3.amazonaws.com/images/',
        defaultMaterialUrl: 'https://irisstudio.s3.amazonaws.com/materials/default-material.jpg',
        //minImageWidth: 1800,
        //minImageHeight: 1200,
        minImageWidth: 300,
        minImageHeight: 300,
        maxImageFileSize: 30 * 1024 * 1024, //15 megs,
        maxNumberOfStampLines: 2,
        minEffectivePPI: 200,
        cameoBleed: 0.125 * 72
    }
)
.constant('LoginEvent',
    {
        LoginSuccess: 'LoginSuccess',
        LoginFailed: 'LoginFailed',
        LogoutSuccess: 'LogoutSuccess',
        SessionTimeout: 'SessionTimeout',
        NotAuthenticated: 'NotAuthenticated',
        NotAuthorized: 'NotAuthorized'
    }
)
.constant('NotificationEvent',
    {
        NotificationReceived: 'NotificationReceived',
    }
)
.constant('ModelEvent',
    {
        ModelAdded: 'ModelAdded',
        ModelChanged: 'ModelChanged',
        ModelDeleted: 'ModelDeleted',
    }
)
.constant('UploadEvent',
    {
        ImagePreflighted: 'ImagePreflighted',
        ThumbnailReady: 'ThumbnailReady',
        ImageFileSaved: 'ImageFileSaved',
        UploadStart: 'UploadStart',
        UploadProgress: 'UploadProgress',
    }
)
.constant('TourEvent',
    {
        StartTour: 'StartTour'
    }
)
.constant('ImageFileStatus',
    {
        New: 'New',
        Preflighted: 'Preflighted',
        UploadInProgress: 'UploadInProgress',
        Uploaded: 'Uploaded',
        Rejected: 'Rejected',
        Cancelled: 'Cancelled'
    }
)
.run([ '$rootScope', '$location', '$http', 'AuthService', 'localize', 'MessageService',
    '$state', '$stateParams', 'StoreConfig', '$timeout', 'LoginEvent', '$templateCache', 'ProductPrototype',
    'AppConstants', 'NotificationService', 'FontLoader', 'LayoutSettings', 'AppVersion', 'JsLog', 'LeaveSiteService',
    function( $rootScope, $location, $http, AuthService, localize, MessageService,
        $state, $stateParams, StoreConfig, $timeout, LoginEvent, $templateCache, ProductPrototype,
        AppConstants, NotificationService, FontLoader, LayoutSettings, AppVersion, JsLog, LeaveSiteService) {

        //boostrap
        console.log('PACE version ' + AppVersion);

        if (!(bowser.firefox || bowser.chrome || bowser.safari || bowser.phantom)) {
            $timeout(function() {
                $state.go('unsupportedBrowser');
            });
        }

        //workaround for this issue:
        //http://stackoverflow.com/questions/27408501/ng-repeat-sorting-is-throwing-an-exception-in-jquery
        //
        Object.getPrototypeOf(document.createComment('')).getAttribute = function() {};

        PACE.StoreConfig = StoreConfig;
        PACE.AppConstants = AppConstants;
        PACE.LayoutSettings = LayoutSettings;

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.FlashMessage = PACE.FlashMessage;

        var path = $location.path();
        if (['/email-verified', '/signup', '/unsupported-browser'].indexOf(path)===-1 &&
            path.indexOf('/preview/')===-1) {

            $rootScope.appLoading = true;
            AuthService.isAuthenticated()
                .success(function(result){

                    var path = $location.path();
                    $rootScope.appLoading = false;
                    var role = _.findWhere(result.user.roles, {name: 'ROLE_PROOFER_USER'});
                    if (role && path.indexOf('/proof/')>=0) {
                        var id = path.substring(path.lastIndexOf('/') + 1);
                        $state.go('proofer', {productId: id});
                    } else {
                        $rootScope.$broadcast(LoginEvent.LoginSuccess);
                    }

                })
                .error(function() {

                    var path = $location.path();
                    $rootScope.appLoading = false;
                    if (path.indexOf('/proof/')===-1 && path.indexOf('/login')===-1) {
                        $state.go('login.login');
                    }

                });
        }

        localize.setLanguage('en');

        if (PACE.FlashMessage.error!=='' && PACE.FlashMessage.error!=='${errorMessage!}')
            MessageService.show(PACE.FlashMessage.error, 'alert');
        if (PACE.FlashMessage.info!=='' && PACE.FlashMessage.info!=='${infoMessage!}')
            MessageService.show(PACE.FlashMessage.info, 'info');
        if (PACE.FlashMessage.warning!=='' && PACE.FlashMessage.warning!=='${warningMessage!}')
            MessageService.show(PACE.FlashMessage.warning, 'warning');

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams) {
                //TODO: authorize
                if (toState.data && toState.data.spinner) {
                    //improve (hopefully) perceived performance by delaying the spinner
                    //so that it doesn't show up when things are loaded in less than 500ms

                    $timeout(function() {
                        if (toState.name!==$state.current.name)
                            $rootScope[toState.data.spinner + 'Spinner'] = true;
                    }, 500);
                }

                $rootScope.leftPanelHidden = (toState.data && toState.data.leftPanelHidden);

                //expose helper properties for sidebar animations
                if (fromState.name==='' && fromState.abstract)
                    fromState = toState;

                $rootScope.fromStateLevel = fromState.name.split('.').length - 1;
                $rootScope.toStateLevel = toState.name.split('.').length - 1;

            });

        $rootScope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                if (toState.data && toState.data.spinner) {
                    $rootScope[toState.data.spinner + 'Spinner'] = false;
                }

                if (toState.name==='login.login' && $rootScope.appLoading) {
                    $rootScope.appLoading = false;
                }

                if (toState.name==='login.login') {
                    LeaveSiteService.disable();
                } else {
                    LeaveSiteService.enable();
                }
            });

        $rootScope.$on('$stateChangeError',
            function(event, toState, toParams, fromState, fromParams, error) {
                $state.go('dashboard.default.overview',{},{reload:true});
                throw error;
            });

        $rootScope.$on('$stateNotFound',
            function(event, unfoundState, fromState, fromParams){
                console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
                console.log(unfoundState, fromState, fromParams);
            });

        if (ENV==='production') {
            window.onerror = function(msg, file, line, col, error) {
                JsLog.error(error);
            };
        }
    }
]);
