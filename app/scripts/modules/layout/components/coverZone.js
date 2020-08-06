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
                    React.createElement("li", {style: liStyles, className: "filmstrip__cover-zone"}, 
                        React.createElement("div", {style: imgStyles, className: "image-include"}, 
                            React.createElement("span", {className: "upload-preview"}), 
                            React.createElement("span", {className: "upload-text"}, React.createElement("span", null, "Drop Cover"), React.createElement("span", null, "Photos Here"))
                        )
                    )
                );
            }
        });
    };

    angular.module('pace.layout').provider('CoverZoneComponent', function() {
        this.$get = [CoverZoneComponentClass ];
    });

})();
