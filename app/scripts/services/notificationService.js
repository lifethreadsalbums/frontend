'use strict';

angular.module('paceApp')
.service('NotificationService', ['$rootScope', '$compile', '$state', '$timeout', 'LoginEvent', 'NotificationEvent',
    'Store',
    function NotificationService($rootScope, $compile, $state, $timeout, LoginEvent, NotificationEvent,
        Store) {

        var subSocket;

        function connect(url) {
            var socket = atmosphere;
            var transport = 'websocket';
            //var reauthCount = 0;
            
            var headers = {};
            //headers["X-Pace-Auth"] = auth;
            
            // We are now ready to cut the request
            var request = { 
                //url: url, //"https://notifications.irisbook.com/studio",
                url: "/websocket/studio",
                contentType: "application/json", 
                logLevel: 'info',
                transport: transport,
                trackMessageLength: true,
                enableProtocol: true,
                headers: headers,
                enableXDR:true,
                reconnectInterval:3000,
                //dropAtmosphereHeaders:true,
                //attachHeadersAsQueryString:true,
                //withCredentials:true,
                //readResponseHeaders:false,
                fallbackTransport: 'long-polling'
            };

            request.onOpen = function (response) {
                console.log( 'Atmosphere connected using ' + response.transport);
                transport = response.transport;
                
                //reauthCount = 0;
                
                // setTimeout( function() {
                //     console.log('UUID:' + subSocket.getUUID() );
                // }, 2000);
            };

            // For demonstration of how you can customize the fallbackTransport using the onTransportFailure function -->
            request.onTransportFailure = function (errorMsg, request) {
                atmosphere.info(errorMsg);
                if (window.EventSource && !jQuery.browser.safari) {
                    request.fallbackTransport = "sse";
                }
                console.log('Transport failure: fallback is ' + request.fallbackTransport);
            };

            request.onMessage = function (response) {
                var messageBody = response.responseBody;
                try {
                    var message = JSON.parse(messageBody);
                } catch (e) {
                    console.log('This doesn\'t look like a valid JSON: ', messageBody);
                    return;
                }
                console.log("Notification received: ",message);
                $rootScope.$broadcast(NotificationEvent.NotificationReceived, message);
            };

            request.onClose = function (response) {
                console.log("socket closed");
            };

            request.onError = function (response) {
                console.log('Sorry, but there\'s some problem with your socket or the server is down');
        //        if (reauthCount<3)
        //        {
        //          console.log("reauthenticating");
        //          swf.ncAuthenticate();
        //          reauthCount++;
        //        }
            };

            subSocket = socket.subscribe(request);            
        }

        
        function onLogin() {
            var store = Store.getCurrent();
            store.$promise.then(function(value) {

                var config = JSON.parse(value.configJson);
                connect(config.notificationServerUrl);

            });
        }

        $rootScope.$on(LoginEvent.LoginSuccess, onLogin);

        this.send = function(n) {
            var message = JSON.stringify(n);
            subSocket.push(message);
            //console.log("sending notification: "+message);
        };

    }
]);