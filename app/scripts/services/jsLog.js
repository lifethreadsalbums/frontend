'use strict';

angular.module('paceApp').
  
service('JsLog', ['$log', '$window',
    function($log, $window) {
        
        this.error = function(exception) {
            StackTrace.fromError(exception)
                .then(function(stackframes) {
                   
                    try {
                        var errorMessage = exception.toString();
                        var stackTrace = _.map(stackframes, function(sf) {
                            return sf.toString();
                        }).join('\n');

                        $.ajax({
                            type: 'POST',
                            url: apiUrl + '/api/log/error',
                            contentType: "application/json",
                            data: angular.toJson({
                                message: errorMessage,
                                stackTrace: stackTrace,
                                url: $window.location.href,
                            })
                        });
                    } catch (loggingError){
                        $log.warn("Error server-side logging failed");
                        $log.log(loggingError);
                    }

                });
        };

        
    }
])
.factory('$exceptionHandler', ['$log', 'JsLog', function($log, JsLog) {
    return function myExceptionHandler(exception, cause) {
        if (ENV==='production') {
            JsLog.error(exception, cause);
        }
        $log.error(exception, cause);
    };
}]);
