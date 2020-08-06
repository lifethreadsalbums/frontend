/*
 *
 * SETTINGS - settings [array]
 * - position (left|right) - default "left" - align to right or left side of button
 * - direction (up|down) - default "down" - options open direction
 *
 */

angular.module('pace.order')
.factory('DropdownComponent', [function() {

    return React.createClass({
        propTypes: {
            items: React.PropTypes.object.isRequired,
            selectedItem: React.PropTypes.string.isRequired,
            selected: React.PropTypes.bool.isRequired,
            customClass: React.PropTypes.string,
            onOptionChange: React.PropTypes.func,
            settings: React.PropTypes.object
        },

        componentDidMount: function() {
            this.onMouseUp.bind(this, 'closeDropdown');
        },

        getInitialState: function() {
            return {
                isOpen: false
            };
        },

        render: function() {
            var dropdownClass = 'dropdown-r';
            var dropdownOptionsClass = 'dropdown-r__options';

            if (this.state.isOpen) {
                dropdownClass += ' dropdown-r--is-open';
            }

            if (this.props.settings) {
                if (this.props.settings.position && this.props.settings.position === 'right') {
                    dropdownOptionsClass += ' dropdown-r__options--position-right';
                }

                if (this.props.settings.direction && this.props.settings.direction === 'up') {
                    dropdownOptionsClass += ' dropdown-r__options--direction-up';
                }
            }

            if (this.props.customClass) {
                dropdownClass += ' ' + this.props.customClass;
            }

            var selectedItemLabel = '';
            this.props.items.map(function(item) {
                if (this.props.selectedItem === item.id) {
                    selectedItemLabel = item.label;
                }
            }, this);

            return (
                React.createElement("div", {className: dropdownClass, onMouseDown: this.onDropdownMouseDown, onMouseUp: this.onDropdownMouseUp}, 
                    React.createElement("span", {className: "dropdown-r__label"}, selectedItemLabel), 
                    React.createElement("ul", {className: dropdownOptionsClass}, 
                        this.props.items.map(function(item) {
                            if (item.hidden) {
                                return '';
                            }

                            var itemClassName = 'dropdown-r__option';

                            if (this.props.selectedItem === item.id) {
                                itemClassName += ' dropdown-r__option--active';
                            }

                            return (
                                React.createElement("li", {className: itemClassName, 
                                    onMouseDown: this.onOptionMouseDown, 
                                    onMouseUp: this.onOptionMouseUp.bind(this,item.id), key: item.id}, item.label)
                            )
                        }, this)
                    )
                )
            );
        },

        onDropdownMouseDown: function(e) {
            if (this.state.isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
                e.stopPropagation();
            }
        },

        onDropdownMouseUp: function(e) {
            e.stopPropagation();
        },

        onOptionMouseDown: function(e) {
            e.stopPropagation();
        },

        onOptionMouseUp: function(id, e) {
            e.stopPropagation();
            this.closeDropdown();
            this.props.selectedItem = id;
            this.props.onOptionChange(e, id);
        },

        onMouseUp: function(e) {
            if (!ReactDOM.findDOMNode(this).contains(e.target)) {
                this.closeDropdown();
            }
        },

        openDropdown: function() {
            $(document).on('mouseup', this.onMouseUp);

            this.setState({
                isOpen: true
            });
        },

        closeDropdown: function() {
            $(document).off('mouseup', this.onMouseUp);

            this.setState({
                isOpen: false
            });
        }
    });

}]);
