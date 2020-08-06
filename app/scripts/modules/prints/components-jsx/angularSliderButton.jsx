angular.module('pace.order')

.factory('AngularSliderButtonComponent', ['$state', 'StoreConfig', '$rootScope', '$compile',
    function($state, StoreConfig, $rootScope, $compile) {
        return React.createClass({

            propTypes: {
                containerClass: React.PropTypes.string,
                selectedItem: React.PropTypes.object,
                class: React.PropTypes.string,
                direction: React.PropTypes.string,
                color: React.PropTypes.string,
                paceTooltip: React.PropTypes.string,
                paceTooltipPosition: React.PropTypes.string,
                onChange: React.PropTypes.func,
                onEditBegin: React.PropTypes.func,
                onEditEnd: React.PropTypes.func,
                sliderScale: React.PropTypes.string,
                sliderPrecision: React.PropTypes.string,
                sliderPostfix: React.PropTypes.string,
                sliderStep: React.PropTypes.string,
                sliderMin: React.PropTypes.string,
                sliderMax: React.PropTypes.string,
                sliderLabelButton: React.PropTypes.string,
                sliderLabelButtonIcon: React.PropTypes.string
            },

            onChange: function() {
                if (this.props.onChange) {
                    this.props.onChange(this.scope.selectedItem);
                }
            },

            onEditBegin: function() {
                if (this.props.onEditBegin) {
                    this.props.onEditBegin(this.scope.selectedItem);
                }
            },

            onEditEnd: function() {
                if (this.props.onEditEnd) {
                    this.props.onEditEnd(this.scope.selectedItem);
                }
            },

            componentDidMount: function() {
                var node = ReactDOM.findDOMNode(this);
                var classes = this.props.class + ' ' ? this.props.class : '';

                var html = '<slider-button class="' + classes + '"'+
                    (this.props.valueField ? ' value-field="' + this.props.valueField + '"' : '') +
                    (this.props.labelField ? ' label-field="' + this.props.labelField + '"' : '') +
                    (this.props.direction ? ' direction="' + this.props.direction + '"' : '') +
                    (this.props.color ? ' color="' + this.props.color + '"' : '') +
                    (this.props.paceTooltip ? ' data-pace-tooltip="' + this.props.paceTooltip + '"' : '') +
                    (this.props.paceTooltipPosition ? ' data-pace-tooltip-position="' + this.props.paceTooltipPosition + '"' : '') +
                    (this.props.sliderScale ? ' slider-scale="' + this.props.sliderScale + '"' : '') +
                    (this.props.sliderPrecision ? ' slider-precision="' + this.props.sliderPrecision + '"' : '') +
                    (this.props.sliderPostfix ? ' slider-postfix="' + this.props.sliderPostfix + '"' : '') +
                    (this.props.sliderStep ? ' slider-step="' + this.props.sliderStep + '"' : '') +
                    (this.props.sliderMin ? ' slider-min="' + this.props.sliderMin + '"' : '') +
                    (this.props.sliderMax ? ' slider-max="' + this.props.sliderMax + '"' : '') +
                    (this.props.sliderLabelButton ? ' slider-label-button="' + this.props.sliderLabelButton + '"' : '') +
                    (this.props.sliderLabelButtonIcon ? ' slider-label-button-icon="' + this.props.sliderLabelButtonIcon + '"' : '') +
                    (this.props.onEditBegin ? ' on-edit-begin="onEditBegin()"' : '') +
                    (this.props.onEditEnd ? ' on-edit-end="onEditEnd()"' : '') +
                    ' ng-model="selectedItem" on-change="onChange()"></slider-button>';

                var element = angular.element(html),
                    scope = $rootScope.$new();

                scope.selectedItem = this.props.selectedItem;
                scope.onChange = this.onChange.bind(this);
                scope.onEditBegin = this.onEditBegin.bind(this);
                scope.onEditEnd = this.onEditEnd.bind(this);
                node.appendChild(element[0]);
                $compile(element)(scope);
                this.scope = scope;
            },

            componentWillUnmount: function () {
                var node = ReactDOM.findDOMNode(this);
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                };
                this.scope.$destroy();
                this.scope = null;
            },

            render: function() {
                if (this.scope) {
                    this.scope.selectedItem = this.props.selectedItem;

                    if (!this.scope.$$phase) {
                        this.scope.$apply();
                    }
                }

                var containerClass = this.props.containerClass || '';

                return <div className={containerClass}></div>
            }

        });
    }
]);
