(function() {
    'use strict';

    var CoverZoneComponentClass = function() {

        return React.createClass({

            propTypes: {
                numItems: React.PropTypes.number.isRequired,
                thumbScale: React.PropTypes.number,
            },

            render: function() {

                var liStyles = {},
                    imgStyles = {},
                    scale = this.props.thumbScale || 1;

                //original size from css
                //height: 114px;
                //width: 150px;
                liStyles.width = Math.round(150 * (this.props.numItems + 1) * scale) + 'px';
                liStyles.height = Math.round(114 * scale) + 'px';

                if (this.props.numItems>0) {
                    imgStyles.marginLeft = Math.round(150 * this.props.numItems * scale) + 'px';
                }

                return (
                    <li style={liStyles} className="filmstrip__cover-zone">
                        <div style={imgStyles} className="image-include">
                            <span className="upload-preview"></span>
                            <span className="upload-text"><span>Drop Cover</span><span>Photos Here</span></span>
                        </div>
                    </li>
                );
            }
        });
    };

    angular.module('pace.layout').provider('CoverZoneComponent', function() {
        this.$get = [CoverZoneComponentClass ];
    });

})();
