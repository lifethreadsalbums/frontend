angular.module('pace.order')

.factory('AngularDropdownComponent', ['$state', 'DropdownComponent', 'StoreConfig', '$rootScope', '$compile',
    function($state, DropdownComponent, StoreConfig, $rootScope, $compile) {
        return React.createClass({

            propTypes: {
                containerClass: React.PropTypes.string,
                options: React.PropTypes.object,
                selectedItem: React.PropTypes.object,
                valueField: React.PropTypes.string,
                labelField: React.PropTypes.string,
                direction: React.PropTypes.string,
                class: React.PropTypes.string,
                fixedWidth: React.PropTypes.string,
                icon: React.PropTypes.string,
                type: React.PropTypes.string,
                active: React.PropTypes.bool,
                disabled: React.PropTypes.bool,
                color: React.PropTypes.string,
                onChange: React.PropTypes.func,
                onClick: React.PropTypes.func,
                paceTooltip: React.PropTypes.string,
                paceTooltipPosition: React.PropTypes.string,
            },

            onChange: function() {
                if (this.props.onChange) {
                    this.props.onChange(this.scope.selectedItem);
                }
            },

            componentDidMount: function() {
                var node = ReactDOM.findDOMNode(this);
                var classes = this.props.class + ' ' ? this.props.class : '';

                var html = '<dropdown-button class="' + classes + '"'+
                    ' ng-disabled="disabled"' +
                    (this.props.options ? ' options="options"' : '') +
                    (this.props.valueField ? ' value-field="' + this.props.valueField + '"' : '') +
                    (this.props.labelField ? ' label-field="' + this.props.labelField + '"' : '') +
                    (this.props.direction ? ' direction="' + this.props.direction + '"' : '') +
                    (this.props.fixedWidth ? ' fixed-width="' + this.props.fixedWidth + '"' : '') +
                    (this.props.icon ? ' icon="' + this.props.icon + '"' : '') +
                    (this.props.type ? ' type="' + this.props.type + '"' : '') +
                    ((this.props.active===true || this.props.active===false) ? ' active="active"' : '') +
                    (this.props.color ? ' color="' + this.props.color + '"' : '') +
                    (this.props.paceTooltip ? ' data-pace-tooltip="{{tooltip}}"' : '') +
                    (this.props.paceTooltipPosition ? ' data-pace-tooltip-position="' + this.props.paceTooltipPosition + '"' : '') +
                    ' ng-model="selectedItem" on-change="onChange()"></dropdown-button>';

                var element = angular.element(html),
                    scope = $rootScope.$new();

                scope.options = this.props.options;
                scope.selectedItem = this.props.selectedItem;
                scope.active = this.props.active;
                scope.disabled = this.props.disabled;
                scope.tooltip = this.props.paceTooltip;
                scope.onChange = this.onChange.bind(this);
                node.appendChild(element[0]);
                $compile(element)(scope);
                this.dropDownElement = element[0];
                this.scope = scope;
            },

            componentWillUnmount: function () {
                var node = ReactDOM.findDOMNode(this);
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                };
                this.scope.$destroy();
                this.scope = null;
                this.dropDownElement = null;
            },

            render: function() {
                if (this.scope) {
                    this.scope.options = this.props.options;
                    this.scope.selectedItem = this.props.selectedItem;
                    this.scope.active = this.props.active;
                    this.scope.disabled = this.props.disabled;
                    this.scope.tooltip = this.props.paceTooltip;
                    
                    if (!this.scope.$$phase) {
                        this.scope.$apply();
                    }
                }

                var containerClass = this.props.containerClass || '';

                return (
                    <div onClick={this.props.onClick} className={containerClass}></div>
                );
            }

        });
    }
]);
