'use strict';

angular
    .module('paceApp')
    .factory('LeaveSiteService', [function () {
        var enable = function () {
            if (ENV === 'production' && typeof window.onbeforeunload !== 'function') {
                window.onbeforeunload = function(e) {
                    var dialogText = 'Do you want to leave this site? Changes you made may not be saved.';
                    e.returnValue = dialogText;
                    return dialogText;
                };
            }
        };

        var disable = function () {
            window.onbeforeunload = null;
        };

        return {
            enable: enable,
            disable: disable
        };
    }
]);
