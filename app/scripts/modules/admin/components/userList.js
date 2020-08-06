angular.module('pace.order')

.factory('UserListComponent', ['GenericListComponent', 'UserListItemComponent', function(GenericListComponent, UserListItemComponent) {
    return GenericListComponent(UserListItemComponent);
}])

.factory('UserListItemComponent', ['DropdownComponent', '$interpolate', 'StoreConfig', 'AppConstants', 
    function(DropdownComponent, $interpolate, StoreConfig, AppConstants) {

    var mailToExpression = 'mailto:{{user.email}}',
        dateFormat = AppConstants.DATE_FORMAT;

    if (StoreConfig.adminUsers && StoreConfig.adminUsers.mailToExpression) {
        mailToExpression = StoreConfig.adminUsers.mailToExpression;
    }
    if (StoreConfig.adminUsers && StoreConfig.adminUsers.dateFormat) {
        dateFormat = StoreConfig.adminUsers.dateFormat;
    }
    var mailToGetter = $interpolate(mailToExpression);

    return React.createClass({

        propTypes: {
            item: React.PropTypes.object.isRequired,
            selected: React.PropTypes.bool.isRequired,
            customOptions: React.PropTypes.object,
            onItemRendererEvent: React.PropTypes.func
        },

        onStatusClick: function (event, id) {
            event.stopPropagation();
            this.props.onItemRendererEvent({
                type: 'StatusClicked',
                userId: this.props.item.id,
                statusId: id
            });
        },

        onGroupClick: function (event, id) {
            event.stopPropagation();
            this.props.onItemRendererEvent({
                type: 'GroupClicked',
                userId: this.props.item.id,
                groupId: id
            });
        },

        onAccountTypeClick: function (event, id) {
            event.stopPropagation();
            this.props.onItemRendererEvent({
                type: 'AccountTypeClicked',
                userId: this.props.item.id,
                accountTypeId: id
            });
        },

        onWebsitePreviewTypeClick: function (event) {
            event.stopPropagation();
            event.preventDefault()
            this.props.onItemRendererEvent({
                type: 'WebsitePreviewClicked',
                url: this.props.item.website
            });
        },

        render: function () {
            var user = this.props.item,
                userName = user.firstName + ' ' + user.lastName,
                role = user.admin ? 'admin' : 'user',
                lastLoginDate = moment(new Date(user.lastLoginDate)).format(dateFormat);

            var itemClassSet = classNames({
                'project-item': true,
                'user-item': true,
                'active': this.props.selected,
                'clearfix': true
            });

            var dropdownSettings = {
                position: 'right'
            };

            var statusDropdownClass = ' user-item__status ';
            var groupDropdownClass = ' user-item__membership ';
            var accountTypeDropdownClass = ' user-item__role ';

            switch (user.status) {
                case 'New':
                    statusDropdownClass += 'dropdown-r--red-badge dropdown-r--disabled';
                    break;
                case 'Verified':
                    statusDropdownClass += 'dropdown-r--orange-badge';
                    break;
                case 'Enabled':
                    statusDropdownClass += 'dropdown-r--green-badge';
                    break;
                case 'Suspended':
                    statusDropdownClass += 'dropdown-r--red-badge';
                    break;
                default:
                    if (this.props.selected) {
                        statusDropdownClass += 'dropdown-r--gray-badge';
                    }
                    break;
            }

            var mailTo = mailToGetter({user:user});

            return (
                React.createElement("div", {className: itemClassSet}, 
                    React.createElement(DropdownComponent, {settings: dropdownSettings, 
                                       onOptionChange: this.onStatusClick, 
                                       customClass: statusDropdownClass, 
                                       items: this.props.customOptions.accountStatusOptions, 
                                       selectedItem: this.props.item.status}), 
                    React.createElement("div", {className: "user-item__name", title: userName}, userName), 
                    React.createElement("div", {className: "user-item__company"}, user.companyName), 
                    React.createElement("span", {className: "user-item__www", onClick: this.onWebsitePreviewTypeClick}, 
                        React.createElement("span", {className: "icon icon-www left"})
                    ), 
                    React.createElement("a", {className: "user-item__email", target: "_blank", href: mailTo}, 
                        React.createElement("span", {className: "icon icon-email left"})
                    ), 
                    React.createElement(DropdownComponent, {settings: dropdownSettings, 
                                       onOptionChange: this.onGroupClick, 
                                       customClass: groupDropdownClass, 
                                       items: this.props.customOptions.userGroupOptions, 
                                       selectedItem: this.props.item.group ? this.props.item.group.id : null}), 
                    React.createElement("div", {className: "user-item__last-login"}, "Last login: ", lastLoginDate), 
                    React.createElement(DropdownComponent, {settings: dropdownSettings, 
                                       onOptionChange: this.onAccountTypeClick, 
                                       customClass: accountTypeDropdownClass, 
                                       items: this.props.customOptions.accountTypeOptions, 
                                       selectedItem: role})
                )
            );

        }
    });

}]);
