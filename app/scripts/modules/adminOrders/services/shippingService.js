'use strict';

angular.module('pace.adminOrders')
    .service('ShippingService', function() {
		
        var carriers = {
            'UPS': {
                trackingUrl: 'http://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=TRACKING_ID',
                trackingIdRegExp: [/^(1Z\s?[0-9A-Z]{3}\s?[0-9A-Z]{3}\s?[0-9A-Z]{2}\s?[0-9A-Z]{4}\s?[0-9A-Z]{3}\s?[0-9A-Z]$|[\dT]\d{3}\s?\d{4}s?\d{3})$/i] 
            },
            'CP': {
                trackingUrl: 'http://www.canadapost.ca/cpotools/apps/track/personal/findByTrackNumber?LOCALE=en&trackingNumber=TRACKING_ID',
                trackingIdRegExp: [/^[0-9]{16}$/] 
            },
            'M1MI': {
                trackingUrl: 'http://www.m1mi.ca/',
                trackingIdRegExp: [/^[0-9]{2}$/]   
            }
        }
       
        this.getTrackingUrl = function(product) {
        	var carrier = product.options.carrier, 
        		trackingId = product.options.trackingId,
        	    carrierInfo = carriers[carrier];
            if (carrierInfo) {
                return carrierInfo.trackingUrl.replace('TRACKING_ID', trackingId);
            }
            return null;
        };

        this.isTrackingIdValid = function(trackingId, product) {
            if (product.productNumber===trackingId) return true;
            for (var key in carriers) {
                var carrierInfo = carriers[key];
                for (var i = 0; i < carrierInfo.trackingIdRegExp.length; i++) {
                    if (carrierInfo.trackingIdRegExp[i].test(trackingId)) return true;
                }
            }
            return false;
        };

        this.getCarrier = function(trackingId, product) {
            //recognize carrier by tracking ID
            if (!trackingId) return null;

            if (trackingId===product.productNumber) return 'LOCAL_PICKUP';

            for (var key in carriers) {
                var carrierInfo = carriers[key];
                for (var i = 0; i < carrierInfo.trackingIdRegExp.length; i++) {
                    if (carrierInfo.trackingIdRegExp[i].test(trackingId)) return key;
                }
            }
            return null;
        };

    });
