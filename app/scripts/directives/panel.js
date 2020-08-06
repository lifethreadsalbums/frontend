'use strict';

angular.module('paceApp')

/**
 * Set of Angular directives for rendering a collapsible panel
 * Example:
 * <panel>
 *    <panelheader>Header</panelheader>
 *    <panelcontent>
 *        <div>Some HTML panel content goes here...</div>
 *    </panelcontent>
 * </panel>
 */
.directive('panel', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        transclude: true,
        replace: true,
        scope: {},
        template: '<div class="ui-panel {{color}} ng-animate-disabled" ng-class="{\'panel-collapsed\':collapsed}" ng-transclude></div>',
        restrict: 'E',
        controllerAs: 'panelCtrl',
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

            var enableCollapsing = true,
                that = this;

            $scope.color = $attrs.color ? $attrs.color : '';
            this.collapsed = $scope.collapsed = $attrs.collapsed === 'true';

            $attrs.$observe('enableCollapsing', function(value) {
                enableCollapsing = value!=='false';
            });

            $attrs.$observe('collapsed', function(val) {
                if(enableCollapsing && val !== undefined)
                    that.collapsed = $scope.collapsed = (val === 'true');
            });

            this.toggle = function() {
                if (!enableCollapsing && !this.collapsed)
                    return;
                this.collapsed = $scope.collapsed = !this.collapsed;
                if (this.panelGroupCtrl) {
                    if (!this.collapsed)
                        this.panelGroupCtrl.setActivePanel(this);
                    else if (this.collapsed && this.active)
                        this.panelGroupCtrl.setActivePanel(undefined);
                }
            };

            this.expand = function() {
                this.collapsed = $scope.collapsed = false;
                if (this.panelGroupCtrl)
                    this.panelGroupCtrl.setActivePanel(this);

            };

            this.collapse = function() {
                this.collapsed = $scope.collapsed = true;
            };

            this.setActive = function(active) {
                this.active = active;
                if (active)
                    $element.addClass('active-panel');
                else
                    $element.removeClass('active-panel');
            };

            this.registerInGroup = function(panelGroupCtrl) {
                this.panelGroupCtrl = panelGroupCtrl;
                this.panelGroupCtrl.addPanel(this);
            };


            if ($attrs.round === "true")
                $element.addClass('round');

            if ($attrs.removePaddingTop === "true")
                $element.addClass('panel-remove-padding-top');

            if ($attrs.removePaddingBottom === "true")
                $element.addClass('panel-remove-padding-bottom');

            if ($attrs.addresschoosing === "true")
                $element.addClass('addressChoosing');
        }],
        require: '^?panelgroup',
        link: function(scope, element, attrs, panelGroupCtrl) {

            if (panelGroupCtrl)
                scope.panelCtrl.registerInGroup(panelGroupCtrl);

            element.on('focusin', function(e) {
                $timeout(function() {
                    if (panelGroupCtrl)
                        panelGroupCtrl.setActivePanel(scope.panelCtrl);
                });
            });

        }
    };
}])

/**
 * Angular directive that renders a panel header
 */
.directive('panelheader', function() {
    return {
        require: '^panel',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: { title: '@' },
        link: function(scope, element, attrs, panelCtrl) {
            scope.hideCollapseOption = attrs.hideCollapseOption ? true : false;
            scope.panelCtrl = panelCtrl;
            scope.toggle = function(e) {
                if (!$(e.target).hasClass('button'))
                    panelCtrl.toggle();
            };
        },
        template: function (elem, attrs) {

            return '<header ng-click="toggle($event)">'+
                    '<div class="row">'+
                        '<div class="large-12 columns ui-panel-header">'+
                            '<h2>{{title}}</h2>' +
                            '<div ng-transclude class="ng-animate-disabled ui-panel-header-content"></div>' +
                            "<div class=\"icons\"><i class=\"iconArrow\" ng-if=\"!hideCollapseOption\" ng-class=\"{active:!panelCtrl.collapsed, 'active-panel': panelCtrl.active}\"></i></div>" +
                        '</div>' +
                    '</div>' +
                '</header>';
        }
    };
})

/**
 * Angular directive that renders a toggleable panel header
 */
.directive('panelheaderToggle', function() {
    return {
        require: '^panel',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            title: '@',
            readOnly: '=',
            onChange: '&'
        },
        link: function(scope, element, attrs, panelCtrl) {

            scope.$watch(function() {
                return panelCtrl.collapsed;
            }, function(value, oldValue) {
                scope.enabled = !value;
                if (scope.enabled) {
                    panelCtrl.expand();
                } else {
                    panelCtrl.collapse();
                }
            });

            // scope.$watch('readOnly', function(val) {
            //     console.log('panelheaderToggle readOnly', val);
            // })

            scope.onEnableChange = function() {
                if (scope.enabled) {
                    panelCtrl.expand();
                } else {
                    panelCtrl.collapse();
                }
                scope.onChange({enabled:!panelCtrl.collapsed});
            };
        },
        template: function (elem, attrs) {

            return '<header>'+
                    '<div class="row">'+
                        '<div class="large-12 columns ui-panel-header">'+
                            '<h2>{{title}}</h2>' +
                            '<div ng-transclude class="ui-panel-header-content"></div>' +
                            '<on-off ng-disabled="readOnly" on-label="Yes" off-label="No" on-change="onEnableChange()" ng-model="enabled"></on-off>' +
                        '</div>' +
                    '</div>' +
                '</header>';
        }
    };
})

/**
 * Angular directive that renders the panel content
 */
.directive('panelcontent', function() {
    return {
        require: '^panel',
        restrict: 'E',
        transclude: true,
        replace: true,
        link: function(scope, element, attrs, panelCtrl) {
            scope.panelCtrl = panelCtrl;
            if (panelCtrl.collapsed) {
                element.addClass('collapsed');
            } else {
                element.removeClass('collapsed');
            }
        },
        template: function (elem, attrs) {
            return '<div class="ui-panel-content collapsed ng-animate-disabled" ng-transclude ng-class="{collapsed:panelCtrl.collapsed}"></div>';
        }

    };
})
/**
 * Angular directive that renders the panel group
 */
.directive('panelgroup', function() {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template:'<div class="panel-group ng-animate-disabled" ng-transclude></div>',
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

            var panels = [];

            this.addPanel = function(panel) {
                panels.push(panel);
                //if (panels.length===1 && !panel.collapsed)
                //    panel.setActive(true);
            };

            this.setActivePanel = function(activePanel) {
                angular.forEach(panels, function(panel) {
                    panel.setActive(activePanel===panel);
                });
            };

        }],
    };
});
