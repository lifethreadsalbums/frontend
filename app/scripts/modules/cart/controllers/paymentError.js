'use strict';

angular.module('pace.cart')
.controller('PaymentErrorCtrl', ['$scope', '$rootScope', 'MessageService',
    function ($scope, $rootScope, MessageService) {

    	MessageService.clear();
      	$scope.errorMessage = PACE.FlashMessage.error;

    }]);

