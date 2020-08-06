'use strict';

angular.module('pace.order')
.factory('CoverBuilderWidget', [function() {
    return function CoverBuilderWidget() {

        this.type = 'CoverBuilderWidget';
        this.children = [];

        this.prototypeProduct = null;
        this.prototypeProductOption = null;
        this.previousPrototypeProductOption = null;
        this.isReprint = false;


        this.render = function() {
            var html = '';
            html += "<div class=\"form-element\"";
            
            var label = PACE.utils.slug(this.prototypeProductOption.effectiveDisplayLabel);
            html += " name=\"" + label + "\"";
            
            var visiblity = this.prototypeProductOption.visibilityExpression;
            if (visiblity!=null)
                html += " ng-show=\"" + visiblity + "\" ";
            
            html += ">";
            
            var code = this.prototypeProductOption.effectiveCode;
            
            var sectionUrl = PACE.utils.slug(this.prototypeProductOption.effectiveGroup.label);
            html += "<cover-builder-widget product-prototype=\"model.productPrototype\" ";
            html += "option-url=\"" + label + "\" ";
            html += "section-url=\"" + sectionUrl + "\" ";
            html += "option-code=\"" + code + "\" ";
            
            //if (isRequired())
            //  builder.append("required ");
            html += ">";
            html += "</cover-builder-widget>";
            
            html += "</div>";
            return html;
        };
    };

}]);