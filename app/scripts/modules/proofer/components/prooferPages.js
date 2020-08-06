angular.module('pace.proofer')
.factory('ProoferPagesComponent', ['AppConstants', 'SpreadThumbComponent',
    function(AppConstants, SpreadThumbComponent) {

        return React.createClass({

            propTypes: {
                layout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                thumbScale: React.PropTypes.number,
                thumbSize: React.PropTypes.number,
                autoCenter: React.PropTypes.bool,
                pageType: React.PropTypes.string
            },

            onPageClick: function(e) {

            },

            render: function() {
                var layout = this.props.layout,
                    spreads = layout.spreads;
                return (
                    React.createElement("div", {className: "page-thumbnails-wrapper"}, 
                        React.createElement("div", {className: "scrollable-content layout__page-thumbnails"}, 
                            
                                spreads.map(function(spread, i) {
                                    return (

                                        React.createElement(SpreadThumbComponent, {
                                            key: i, 
                                            spread: spread, 
                                            numPages: spread.numPages, 
                                            layout: layout, 
                                            layoutController: this.props.layoutController, 
                                            thumbSize: this.props.thumbSize, 
                                            thumbScale: this.props.thumbScale, 
                                            onPageClick: this.onPageClick, 
                                            pageType: this.props.pageType})

                                    );
                                }, this)
                            
                        )
                    )
                );
            }

        });
    }

]);
