'use strict';

angular.module('pace.order')
.service('ProductFormService', ['$q', '$templateCache', 'PanelWidget', 'PanelGroupWidget', 'ProductOptionWidget', '$injector', 'ProductNumberWidget',
    function($q, $templateCache, PanelWidget, PanelGroupWidget, ProductOptionWidget, $injector, ProductNumberWidget) {


    function getGroups(productPrototype) {
        var groups = _.compact(
            _.unique( 
                _.map(productPrototype.prototypeProductOptions, function(o) {
                    return o.orderGroup || o.effectiveGroup;
                }), 
                _.property('code') 
            )
        );
        groups = _.sortBy(groups, function(g) { return g.order ? g.order : g.id; });
        return groups;
    }

    function createWidget(productPrototype, option, reprint) {
        var widgetClassName = 'ProductOptionWidget';
        if (option.effectiveOrdersWidgetClass) {
            widgetClassName = option.effectiveOrdersWidgetClass.replace('com.poweredbypace.pace.domain.widget.','');
        }
        var widgetClass = $injector.get(widgetClassName);
        var optionWidget = new (Function.prototype.bind.apply(widgetClass));
        optionWidget.prototypeProductOption = option;
        optionWidget.prototypeProduct = productPrototype;
        optionWidget.isReprint = reprint;
        return optionWidget;
    }

    this.prepareProductFormTemplate = function(productPrototype, reprint) {

        var templateName = 'product-form-template-' + productPrototype.id;
        if (reprint) templateName += '-reprint';
        if ($templateCache.get(templateName)) return;

        var groups = getGroups(productPrototype);
        var optionsByGroup = _.groupBy(productPrototype.prototypeProductOptions, function(o) {
            var group = o.ordersGroup || o.effectiveGroup || {};
            return group.code;
        });

        //console.log('groups', groups)

        var mainWidget = new PanelGroupWidget();
        for (var i = 0; i < groups.length; i++) {
            var group = groups[i];
            var groupWidget = new PanelWidget();
            groupWidget.label = group.label;
            groupWidget.collapsed = !productPrototype.isDefault;
            groupWidget.showExpression = group.visibilityExpression;


            var options = optionsByGroup[group.code];
            options = _.sortBy(options, function(g) { return g.sortOrder ? g.sortOrder : g.id; });
        
            var requiredItems = [],
                optionalItems = [],
                j,
                numOptions = 0;
            for (j = 0; j < options.length; j++) {
                var o = options[j];
                
                if (o.effectiveIncludeInOrders || (reprint && o.includeInReprint)) {
                    numOptions++;
                    if (o.isRequired || o.systemAttribute==='HoldReason')
                        requiredItems.push(o);
                    else
                        optionalItems.push(o);
                }
            }
            if (numOptions===0) continue;

            var prevOption = null;
            for (j = 0; j < requiredItems.length; j++) {
                var o = requiredItems[j];

                if (o.systemAttribute==='Name') {
                    groupWidget.children.push(new ProductNumberWidget());
                }

                var optionWidget = createWidget(productPrototype, o, reprint);
                optionWidget.previousPrototypeProductOption = prevOption;
                if (optionWidget.replaceParentPanel) {
                    groupWidget = optionWidget;
                    break; 
                } else {
                    groupWidget.children.push(optionWidget);
                }
                prevOption = o;
            }

            for (j = 0; j < optionalItems.length; j++) {
                var o = optionalItems[j];
                var optionWidget = createWidget(productPrototype, o, reprint);
                    
                if (o.ordersSubpanel===false || optionWidget.type==='TextAreaWidget') {
                    groupWidget.children.push(optionWidget);
                } else {
                    var subpanel = new PanelWidget();
                    subpanel.panelHeaderElement = "panelheader-toggle";
                    subpanel.label = o.effectiveDisplayLabel;
                    subpanel.children.push(optionWidget);
                    
                    groupWidget.children.push(subpanel);
                }
            }

            mainWidget.children.push(groupWidget);
        }

        var html = mainWidget.render();
        $templateCache.put(templateName, html);
    };

}]);
