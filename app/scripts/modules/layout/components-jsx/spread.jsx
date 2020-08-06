(function() {
    'use strict';

    var SpreadComponentClass = function($controller) {

        return React.createClass({

            propTypes: {
                spread: React.PropTypes.object.isRequired,
                layout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                product: React.PropTypes.object,
                productPrototype: React.PropTypes.object,
                spreadInfoFactory: React.PropTypes.object,
                flipBookSide: React.PropTypes.string
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            componentWillMount: function () {
                
            },

            componentWillUnmount: function () {
                console.debug('deregistering renderer');
                this.props.layoutController.unregisterRenderer(this.ctrl);
                this.ctrl.dispose();
                this.ctrl = null;
                var el = $(this.getDOMNode());
                //el.trigger('$destroy');
                el.removeData();
            },

            shouldComponentUpdate: function (nextProps, nextState) {
                return this.scope.spread!==nextProps.spread;    
            },
            
            componentDidUpdate: function () {
                
            },

            componentDidMount: function () {
                
                var el = $(this.getDOMNode()),
                    scope =  {
                        spread: this.props.spread,
                        layout: this.props.layout,
                        layoutController: this.props.layoutController,
                        product: this.props.product,
                        productPrototype: this.props.productPrototype,
                    },
                    attrs = {},
                    layoutController = this.props.layoutController; 

                var ctrl = $controller('SpreadController', 
                    { 
                        $element: el, 
                        $scope: scope, 
                        $attrs: attrs 
                    }
                );

                ctrl.spreadInfoFactory = this.props.spreadInfoFactory;
                ctrl.element = el;
                ctrl.flipBookSide = this.props.flipBookSide;
                ctrl.makePages();
                ctrl.register();

                //initial scale for cover spreads
                if (layoutController.coverScales) {
                    var idx = layoutController.renderers.indexOf(ctrl);
                    if (idx < layoutController.coverScales.length) {
                        ctrl.scale = ctrl.canvas.scale = layoutController.coverScales[idx];
                    }
                }

                ctrl.render();
                this.ctrl = ctrl;
                this.scope = scope;

                //console.log('registering spread', scope.spread.pageNumber);
            },

            render: function() {

                //console.log('render ', this.props.spread.pageNumber);

                if (this.ctrl) {
                    var ctrl = this.ctrl,
                        layoutController = this.props.layoutController;

                    ctrl.scale = ctrl.canvas.scale = layoutController.scale;
                    //initial scale for cover spreads
                    if (layoutController.coverScales) {
                        var idx = layoutController.renderers.indexOf(ctrl);
                        if (idx < layoutController.coverScales.length) {
                            ctrl.scale = ctrl.canvas.scale = layoutController.coverScales[idx];
                        }
                    }

                    ctrl.spread = this.props.spread;
                    ctrl.layout = this.props.layout;
                    ctrl.flipBookSide = this.props.flipBookSide;
                    this.scope.spread = this.props.spread;
                    this.scope.layout = this.props.layout;
                    ctrl.makePages();
                    ctrl.render();
                }

                return <canvas></canvas>;
            }
        });
    };

    angular.module('pace.layout').provider('SpreadComponent', function() {
        this.$get = ['$controller', SpreadComponentClass ];
    });

})();
