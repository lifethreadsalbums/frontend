(function() {
    'use strict';

    var ErrorPopupComponentClass = function(StoreConfig, $rootScope, UploadEvent, ImageFileStatus) {

      
        return React.createClass({

            propTypes: {
                image: React.PropTypes.object.isRequired,
            },

            render: function() {
                
                
                return (

                    React.createElement("div", {className: "error-popup"}, 
                        React.createElement("span", null, this.props.image.errorMessage)
                    )

                );
            }
        });
    };

    angular.module('pace.layout').provider('ErrorPopupComponent', function() {
        this.$get = ['StoreConfig', '$rootScope', 'UploadEvent', 'ImageFileStatus', ErrorPopupComponentClass ];
    });

})();
