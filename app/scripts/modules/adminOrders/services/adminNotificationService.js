'use strict';

angular.module('pace.adminOrders')
.service('AdminNotificationService', ['$rootScope', 'AuthService', '$timeout', 'LoginEvent', 'NotificationEvent',
    function AdminNotificationService($rootScope,  AuthService, $timeout, LoginEvent, NotificationEvent) {

        function isAdmin() {
            var user = AuthService.getCurrentUser();
            return user && user.admin;
        }   

        $rootScope.$on(LoginEvent.LoginSuccess, function() {
            
            if (!isAdmin()) return;

            if (window.Notification && Notification.permission !== 'granted') {
                Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                        Notification.permission = status;
                    }
                });
             }

        });

        $rootScope.$on(NotificationEvent.NotificationReceived, function(event, notification) {

            if (!isAdmin()) return;
            if (window.Notification && Notification.permission !== 'granted') return;

            if (notification.type==='OrderCreated') {

                var order = JSON.parse(notification.body);
                var n = new Notification('Order ' + order.orderNumber, { 
                    body: 'New order has been created. Order ID: ' + order.orderNumber
                });

            } else if (notification.type==='JobProgress') {

                var job = JSON.parse(notification.body);

                if (job.progressPercent===100 && job.isCompleted) {
                    var n = new Notification('Task Completed', { 
                        tag: job.jobId,
                        body: 'Task ' + job.jobName + ' completed.'
                    });
                } else {
                    // var n = new Notification('Task', { 
                    //     tag: job.jobId,
                    //     body: job.jobName + ' - ' + job.progressPercent + '%'
                    // });
                }

            } else if (notification.type==='UserRegistered') {

                var user = JSON.parse(notification.body);
                var n = new Notification('New User', { 
                    body: 'New user has been registered. User: ' + user.firstName + ' ' + user.lastName
                });

            } else if (notification.type==='BatchSentToPrint') {
                console.log(notification);
                var batch = JSON.parse(notification.body);
                var n = new Notification('Batch sent', { 
                    body: 'Batch ' + batch.name + ' has been sent to print.'
                });
            }


        });

    }
]);