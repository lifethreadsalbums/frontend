'use strict';

angular.module('pace.dashboard')
.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('dashboard.preferences.designer.general', {
            url: '/general',
            views: {
            	'left@dashboard': {
                    templateUrl: 'views/dashboard/designer.html'
                },
                'right@dashboard': {
                    controller:'DesignerPrefsCtrl',    
                    templateUrl: 'views/dashboard/general.html'
                }
            }
        })
        // .state('dashboard.preferences.designer.grid', {
        //     url: '/grid',
        //     views: {
        //     	'left@dashboard': {
        //             templateUrl: 'views/dashboard/designer.html'
        //         },
        //         'right@dashboard': {
        //             controller:'DesignerPrefsCtrl',    
        //             templateUrl: 'views/dashboard/grid.html'
        //         }
        //     }
        // })  
        // .state('dashboard.preferences.designer.units', {
        //     url: '/units',
        //     views: {
        //     	'left@dashboard': {
        //             templateUrl: 'views/dashboard/designer.html'
        //         },
        //         'right@dashboard': {
        //             controller:'DesignerPrefsCtrl',    
        //             templateUrl: 'views/dashboard/units.html'
        //         }
        //     }
        // })       
}])
.controller('DesignerPrefsCtrl', ['$scope', '$state', '_', 'userSettings',
    function ($scope, $state, _, userSettings) {
        /* jshint indent: false */

        var master = angular.copy(userSettings.settings);
            
        $scope.userSettings = userSettings;
        
        $scope.reset = function() {
           userSettings.settings = angular.copy(master);
        };

        $scope.isChanged = function() {
            return !angular.equals(userSettings.settings, master);
        };

        $scope.save = function() {
            var done = function(value) {
                master = angular.copy(userSettings.settings);
                $scope.saving = false;
            };
            $scope.$saving = true;
            userSettings.$save(done, done);
        };

        $scope.stroke = {
            color: '#37afe1',
            stroke: '5pt'
        };

        $scope.bgColor = {
            color: '#37afe1'
        };

        $scope.gridColorOptions = [
            {
                name: 'Light Blue',
                value: 'Light Blue',
                color: '#00A2FF'
            },{
                name: 'Light Grey',
                value: 'Light Grey',
                color: '#ccc'
            },{
                name: 'Dark Blue',
                value: 'Dark Blue',
                color: '#000E4E'
            },{
                name: 'Dark Grey',
                value: 'Dark Grey',
                color: '#555'
            }
        ];

        // <span class="color-block" ng-style="{\'background-color\': bgColor}"> </span>
      
        $scope.selectedGridColorOptions = $scope.gridColorOptions[0];

        // var colorBlock = angular.element( document.querySelector( '.label-icon-color-block' ) );

        $( ".label-icon-color-block" ).addClass( "color" );

        
        // colorBlock.attr('style', 'backgound:blue');

        $scope.relativeToOptions = [
            {
                name: 'Top of Page',
                value: 'Top of Page',
            },{
                name: 'Middle of Page',
                value: 'Middle of Page',
            },{
                name: 'Bottom of Page',
                value: 'Bottom of Page',
            }

        ];

        $scope.selectedRelativeToOptions = $scope.relativeToOptions[0].value;

        $scope.rulerOriginOptions = [
            {
                name: 'Spread',
                value: 'Spread',
            },{
                name: 'Another',
                value: 'Another',
            },{
                name: 'One more',
                value: 'One more',
            }

        ];

        $scope.selectedRulerOriginOptions = $scope.rulerOriginOptions[0].value;

        $scope.rulerHorizontalOptions = [
            {
                name: 'Inches',
                value: 'Inches',
            },{
                name: 'Centemeters',
                value: 'Centemeters',
            },{
                name: 'Pixels',
                value: 'Pixels',
            }

        ];

        $scope.selectedRulerHorizontalOptions = $scope.rulerHorizontalOptions[0].value;

        $scope.rulerVerticalOptions = [
            {
                name: 'Inches',
                value: 'Inches',
            },{
                name: 'Centemeters',
                value: 'Centemeters',
            },{
                name: 'Pixels',
                value: 'Pixels',
            }

        ];

        $scope.selectedRulerVerticalOptions = $scope.rulerVerticalOptions[0].value;

        $scope.unitsTextSizeOptions = [
            {
                name: 'Points',
                value: 'Points',
            },{
                name: 'Inches',
                value: 'Inches',
            },{
                name: 'Pixels',
                value: 'Pixels',
            }

        ];

        $scope.selectedUnitsTextSizeOptions = $scope.unitsTextSizeOptions[0].value;

        $scope.unitsStrokeOptions = [
            {
                name: 'Points',
                value: 'Points',
            },{
                name: 'Inches',
                value: 'Inches',
            },{
                name: 'Pixels',
                value: 'Pixels',
            }

        ];

        $scope.selectedUnitsStrokeOptions = $scope.unitsStrokeOptions[0].value;

    }
]);