'use strict';

angular.module('paceApp')
    .service('DataTransferService', [function DataTransferService() {

        this.getDataTransfer = function(event, eventType) {
            if (eventType && event[eventType] && event[eventType].detail && event[eventType].detail.dataTransfer) {
                return event[eventType].detail.dataTransfer;
            } else if (eventType && event[eventType]) {
                return event[eventType].dataTransfer;
            } else if (event.detail && event.detail.dataTransfer) {
                return event.detail.dataTransfer;
            } else {
                return event.dataTransfer;
            }
        };

        this.setDetailClientXY = function(event, eventType) {
            var detail;

            if (eventType && event[eventType] && event[eventType].detail && event[eventType].detail.dataTransfer) {
                detail = event[eventType].detail;
            } else if (event.detail && event.detail.dataTransfer) {
                detail = event.detail;
            }

            if (detail) {
                if (typeof detail.clientX !== 'undefined' && detail.clientX !== null) {
                    event.clientX = detail.clientX;
                }

                if (typeof detail.clientY !== 'undefined' && detail.clientY !== null) {
                    event.clientY = detail.clientY;
                }
            }
        };

        this.setDetailPageXY = function(event, eventType) {
            var detail,
                ev;

            if (eventType && event[eventType] && event[eventType].detail && event[eventType].detail.dataTransfer) {
                ev = event[eventType];
                detail = event[eventType].detail;
            } else if (event.detail && event.detail.dataTransfer) {
                ev = event;
                detail = event.detail;
            }

            if (detail) {
                if (typeof detail.pageX !== 'undefined' && detail.pageX !== null) {
                    ev.pageX = detail.pageX;
                }

                if (typeof detail.pageY !== 'undefined' && detail.pageY !== null) {
                    ev.pageY = detail.pageY;
                }
            }
        };

    }]);
