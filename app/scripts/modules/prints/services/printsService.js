'use strict';

angular.module('pace.layout')
.service('PrintsService', ['$q', '$templateCache', 'PanelWidget', 'PanelGroupWidget', 'ProductOptionWidget', 
    '$injector', 'ProductNumberWidget', 'ProductService',
    function($q, $templateCache, PanelWidget, PanelGroupWidget, ProductOptionWidget, 
        $injector, ProductNumberWidget, ProductService) {

     function escapeExpression(exp) {
        if (exp==null) return null;
        exp = exp.replace(/\"/g, "'");
        return exp;
    }

    function renderOption(option) {
        if (option.effectiveCode==='borders') return renderCheckbox(option);

        var html = '<span id="prints-sidebar-' + option.effectiveCode + '" class="prints-sidebar__label">' + option.effectiveDisplayLabel + '</span>';
        html += '<dropdown-button class="prints-sidebar__button" color="dark" ';
        html += 'on-change="onOptionChange()" ';
        html += 'ng-disabled="!selectedProduct" ';
        html += 'label-field="displayName" value-field="code" label="Please select" ';
        html += 'options="productOptions.' + option.effectiveCode + '.prototypeProductOptionValues';

        if (option.parent) {
            var parentCode = option.parent.effectiveCode;
            html += " | parentOption:selectedProduct.options." + parentCode + ":'" + parentCode + "' ";

        }
        html += " | optionVisibility:selectedProduct";



        if (option.sortType==='AlphabeticAscending') {
            html += " | orderBy:'displayName' ";
        } else if (option.sortType==='AlphabeticDescending') {
            html += " | orderBy:'displayName':true ";
        }
        html += '" ng-model="selectedProduct.options.' + option.effectiveCode +'"></dropdown-button>';
        return html;
    }

    function renderCheckbox(option) {
        var html = '<div class="prints-sidebar__form-item"';
        var enabled = escapeExpression(option.enabledExpression);
        if (enabled!=null) {
            enabled = enabled.replace(/product./g, 'selectedProduct.');
            html += ' ng-disabled="!(' + enabled + ')" ';
        }

        html += '><span style="display:inline-block; float:left" id="prints-sidebar-' + option.effectiveCode + '" class="prints-sidebar__label" ' + 
            'data-pace-tooltip="Add borders to all photos">' + option.effectiveDisplayLabel + '</span>';

        html += '<on-off  color="dark" style="float:right" ';
        html += 'on-label="Yes" off-label="No" ';
        html += 'ng-model="selectedProduct.options.' + option.effectiveCode +'"></on-off></div>';
        return html;
    }

    this.sortImages = function (container) {
        var spreads = [],
            idx = 0;
        for (var i = 0; i < container.spreads.length; i++) {
            var spread = container.spreads[i];
            if (spread.elements.length>0) {
                spread.pageNumber = idx++;
                spreads.push(spread);
            }
        }
        var sortOrder = function(s) {
            var orientation = 1,
                el = s.elements[0];
            if (el && el.width>el.height) {
                orientation = 3;
            } else if (el && el.height>el.width) {
                orientation = 2;
            }
            return (orientation * 1000000) + (s.id || 0);// s.pageNumber;
        }
        spreads.sort(function(a,b) {
            return sortOrder(a) - sortOrder(b);
        });
        container.spreads = spreads;
    };

    this.isBorderEnabled = function(product, productPrototype) {
        var borderOption = productPrototype.getPrototypeProductOption('borders'),
            borderEnabled = false;
        if (borderOption) {
            if (borderOption.enabledExpression) {
                borderEnabled = !!(ProductService.evalExpression(borderOption.enabledExpression, product));
            } else {
                borderEnabled = true;
            }
        }
        return borderEnabled;
    }

    this.prepareOptionsTemplate = function(scope, productPrototype) {
        var requiredItems = [],
            optionalItems = [];

        scope.productOptions = {};
        _.each(productPrototype.prototypeProductOptions, function(option) {
            var params = option.effectiveParams;
            if (params && params.containerOption && params.includeInBuild!==false) {
                scope.productOptions[option.effectiveCode] = option;
                if (option.isRequired)
                    requiredItems.push(option);
                else
                    optionalItems.push(option);
            }
        });

        var sortFn = function(o) { return o.sortOrder ? o.sortOrder : o.id; }

        requiredItems = _.sortBy(requiredItems, sortFn);
        optionalItems = _.sortBy(optionalItems, sortFn);

        var html = '', i;

        for (i = 0; i < requiredItems.length; i++) {
            html += renderOption(requiredItems[i]);
        }

        if (optionalItems.length>0) {
            html += '<div init-pace-tooltip><div style="margin: 35px 0 20px; text-align:left; padding: 0 5px 5px; border-bottom: 1px solid #e1e1e1; font-size: 13px; color: #acacac;"><span>Global Options</span></div>'
            for (i = 0; i < optionalItems.length; i++) {
                html += renderOption(optionalItems[i]);
            }
        }
        html += '</div>';

        var templateName = 'prints-options-template-' + productPrototype.id;
        $templateCache.put(templateName, html);
        return templateName;
    };

}]);
