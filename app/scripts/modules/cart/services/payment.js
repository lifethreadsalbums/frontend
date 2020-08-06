'use strict';

angular.module('pace.cart')
    .service('PaymentService', ['$http', '$parse', 'localize', 'StoreConfig',
     function PaymentService($http, $parse, localize, StoreConfig) {
        /* global apiUrl */
        
        var paymentGateway = StoreConfig.paymentGateway || 'psigate'; //'skipgate';
        var config = {};

        var getConfig = function() {
            //console.log('Retrieving payment gateway config', paymentGateway);

            $http.get(apiUrl + "api/payment/" + paymentGateway + "/config")
                .success(function (data) {
                    config = data;
                });
        };

        getConfig();


        function doPay(cart) {
            console.log("pay", cart);

            var order = angular.copy(cart);

            order.billingAddress = order.addresses[0];
            order.shippingAddress = order.addresses.length>1 ? order.addresses[1] : order.addresses[0];
            // for (var i = 0; i < order.taxes.length; i++) {
            //     order['tax' + (i+1)] = order.taxes[i].tax.amount;
            //     if (order.taxes[i].taxRate.includeShipping)
            //         order.shippingCost = {amount: 0};
            // }

            var form = $('<form></form>');
            form.attr("action", config.gatewayUrl);
            form.attr("method", config.httpMethod || 'POST');
            form.attr("style", "display:none;");
    
            for(var fieldName in config.formFields) {
                var field = config.formFields[fieldName];
                var getter = $parse(field);

                var value = getter( { order: order, apiUrl:apiUrl } );
                
                if (value) {
                    console.log(fieldName + " = "+value);
                    var input = $("<input></input>")
                        .attr("type", "hidden")
                        .attr("name", fieldName)
                        .val(value);
                    form.append(input);
                }
            }

            $("body").append(form);

            // submit form
            form.submit();
            form.remove();
        }


        return {

            pay : function(cart) {

                $http.get(apiUrl + "api/payment/" + paymentGateway + "/config")
                    .success(function (data) {
                        console.log(paymentGateway + ' config', data)
                        config = data;
                        doPay(cart);
                    });
            }

        };

    }]);
