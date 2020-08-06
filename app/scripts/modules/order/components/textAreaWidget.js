'use strict';

angular.module('pace.order')
.factory('TextAreaWidget', [function() {

    return function TextAreaWidget() {

        this.type = 'TextAreaWidget';
        this.children = [];

        this.prototypeProduct = null;
        this.prototypeProductOption = null;
        this.previousPrototypeProductOption = null;
        this.isReprint = false;
        var that = this;
        
        function renderNgModel() {
            var code = that.prototypeProductOption.effectiveCode;
            return " name=\"product_"+ code + "\" ng-model=\"model.product.options." + code + "\" "; 
        }
        
        this.render = function() {
            var html = '';
            html += "<div class=\"form-element\"";
        
            var visiblity = this.prototypeProductOption.visibilityExpression;
            if (visiblity!=null)
                html += " ng-show=\"" + visiblity + "\" ";
            
            html += ">";
            html += "<label>";
            html += this.prototypeProductOption.effectiveDisplayLabel;
            html += "</label>";
            
            html += "<textarea";
            html += " ng-disabled=\"model.readOnly\" ";
            html += renderNgModel();
            html += " ng-model-options=\"{ updateOn: 'default', debounce: {'default': 1000} }\" ";
            //if (isRequired())
            //  builder.append("required ");
            html += "ng-focus/>";
            html += "</div>";
           
            return html;
        };
    }

}])