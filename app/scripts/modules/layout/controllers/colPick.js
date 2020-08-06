'use strict';

angular.module('pace.layout')
    .controller('ColPickCtrl', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

        $timeout(function() {              
            $('#picker').colpick({
                flat:true,
                layout:'full',
                submit:false,
                colorScheme:'dark',
                color: $scope.selectedColor,
                onChange: function(hsb,hex,rgb,el,bySetColor) {
                    $scope.selectedColor = '#' + hex;
                }
            });            
        },100);      
        

    }]);