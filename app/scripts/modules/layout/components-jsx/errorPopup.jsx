(function() {
    'use strict';

    var ErrorPopupComponentClass = function(StoreConfig, $rootScope, UploadEvent, ImageFileStatus) {

      
        return React.createClass({

            propTypes: {
                image: React.PropTypes.object.isRequired,
            },

            render: function() {
                
                
                return (

                    <div className="error-popup">
                        <span>{this.props.image.errorMessage}</span>
                    </div>

                );
            }
        });
    };

    angular.module('pace.layout').provider('ErrorPopupComponent', function() {
        this.$get = ['StoreConfig', '$rootScope', 'UploadEvent', 'ImageFileStatus', ErrorPopupComponentClass ];
    });

})();
