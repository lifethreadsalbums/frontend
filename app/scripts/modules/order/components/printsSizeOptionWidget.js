'use strict';

angular.module('pace.order')
.factory('PrintsSizeOptionWidget', ['$injector', function($injector) {

    return function PrintsSizeOptionWidget() {

    	this.prototypeProduct = null;
        this.prototypeProductOption = null;
        this.previousPrototypeProductOption = null;
        this.isReprint = false;
        this.replaceParentPanel = true;


    	this.render = function() {

            var options = _.filter(this.prototypeProduct.prototypeProductOptions, 
                function(o) {
                    return o.effectiveParams && o.effectiveParams.containerOption;
                });
            options = _.sortBy(options, function(g) { return g.sortOrder ? g.sortOrder : g.id; });

            var optionCodes = _.pluck(options, 'effectiveCode');
    		var html = '<panel ng-repeat="child in model.product.children" round="true" collapsed="false">';
            html += '<panelheader title="Size">';
            html +=     '<span ng-show="panelCtrl.collapsed" ng-bind-html="getOptionInfo([';
            html +=     "'" + optionCodes.join("','") + "'";
            html +=     '], child)"></span>';
            html += '</panelheader>';
            html += '<panelcontent>';
            html += '<spo-thumbnail-widget editable="!model.readOnly" restore-selection="true" ';
            html += 'admin-mode="currentUser.admin" ';
            html += 'parent-product="model.product" product="child"></spo-thumbnail-widget>';
    		
    		for (var i = 0; i < options.length; i++) {
    			var o = options[i];

    			var widgetClassName = 'ProductOptionWidget';
                if (o.effectiveOrdersWidgetClass) {
                    widgetClassName = o.effectiveOrdersWidgetClass.replace('com.poweredbypace.pace.domain.widget.','');
                }
                var widgetClass = $injector.get(widgetClassName);
                var optionWidget = new (Function.prototype.bind.apply(widgetClass));
                optionWidget.prototypeProductOption = o;
                optionWidget.prototypeProduct = this.prototypeProduct;
                optionWidget.productExpression = 'child';
                optionWidget.triggerChangeProductPrototypeEvent = false;
                if (o.effectiveParams.editable===false) {
                    optionWidget.editable = false;
                }

                html += optionWidget.render();
    		}

            html += '</panelcontent>';
    		html += '</panel>';
    		return html;
    	};

    };

}]);