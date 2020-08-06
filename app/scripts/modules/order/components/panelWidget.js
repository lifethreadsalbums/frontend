'use strict';

angular.module('pace.order')
.factory('PanelWidget', [function() {

    return function PanelWidget() {

        this.type = 'PanelWidget';
        this.children = [];
        this.parent = null;
        this.collapsed = false;
        this.panelHeaderElement = "panelheader";
        this.showExpression;
        this.label = '';
        
        function escapeExpression(exp) {
            if (exp==null) return null;
            exp = exp.replace(/\"/g, "'");
            return exp;
        }
    
        this.render = function() {
            var fields = [];
            findOptions(this, fields);

            var html = '';
            var title = this.label;
            var formId = "form_" + PACE.utils.slug(title);
            var hasTabInside = this.children.length===1 && this.children[0].type==='TabWidget';

            var isHoldReasonOption = this.children.length===1 &&
                this.children[0].prototypeProductOption!=null &&
                this.children[0].prototypeProductOption.systemAttribute==='HoldReason';
            
            html += "<panel round=\"true\" ng-disabled=\"!model.isReprint && !model.productPrototype.isDefault && "
                    + " form." + formId + ".$pristine && !form." + formId + ".$valid && !model.product.id && model.currentForm!='" +formId+"'\"";
            
            html += " enable-collapsing=\"{{ model.currentUser.admin || model.isReprint || model.readOnly || form." + formId + ".$valid}}\"  ";

            if (isHoldReasonOption)
                html += " ng-show=\"model.product.onHold\" ";
            else if (this.showExpression!=null) {
                html += " ng-show=\"" + this.showExpression + "\" ";
            }
            
            if (hasTabInside)
                html += " remove-padding-top=\"true\" ";
            
            if (this.collapsed)
                html += " collapsed=\"true\" ";
            
            if ("panelheader-toggle"===this.panelHeaderElement && fields.length>0) {
                html += " collapsed=\"{{!model.product.options." + fields[0] +  "}}\" ";
                html += "style=\"margin-bottom:15px\"";
            }
            
            html += ">";
            html += "<" + this.panelHeaderElement + " title=\"" + title + "\" "
                    + "ng-class=\"{'current-form':model.productPrototype.isDefault || model.currentForm=='" +formId+"'}\" ";

            if ("panelheader-toggle"===this.panelHeaderElement && fields.length>0) {
                if (this.children.length===1 && 
                    this.children[0].prototypeProductOption!=null &&
                    this.children[0].prototypeProductOption.enabledExpression) {
                    
                    var exp = escapeExpression(this.children[0].prototypeProductOption.enabledExpression);
                    html += " ng-disabled=\"model.readOnly || !(" + exp + ")\" ";
                } else {
                    html += " ng-disabled=\"model.readOnly\" ";
                }
                html += "on-change=\"toggleOptionalAddon(" + "'" + fields[0] + "', enabled)\"";
            }
            html += ">";
            
            if (fields.length>0) {
                //html +=("<span ng-show=\"panelCtrl.collapsed && !(form." + formId + ".$pristine && !model.product.id) \">{{getOptionInfo([");
                html += "<span ng-show=\"panelCtrl.collapsed\" ng-bind-html=\"getOptionInfo([";
                html += '\'' + fields.join('\',\'') + '\'';
                html += "])\"></span>";
            }
            html += "</" + this.panelHeaderElement + ">";
            
            var hasSingleBooleanOption = this.children.length===1 && 
                this.children[0].type==='ProductOptionWidget' && 
                this.children[0].prototypeProductOption.productOptionType.productOptionClass==='com.poweredbypace.pace.domain.ProductOptionBoolean' &&
                this.children[0].prototypeProductOption.getOrdersSubpanel===false;

            html += "<panelcontent";
            if (hasSingleBooleanOption) {
                html += " class=\"no-content\" ";
            }
            html += ">";
            
            if (!hasSingleBooleanOption) {
                html += "<ng-form class=\"ng-animate-disabled\" name=\"" + formId + "\" ";
                if ("panelheader-toggle"===this.panelHeaderElement && fields.length>0) {
                    html += " ng-if=\"!panelCtrl.collapsed\" ";
                }
                html += ">";
                if (!hasTabInside) {
                    html += "<div class=\"row\">";
                    html += "<div class=\"large-12 columns\">";
                }
                for (var i = 0; i < this.children.length; i++) {
                    html += this.children[i].render();
                }
                
                if (!hasTabInside)
                    html += "</div></div>";
                html += "</ng-form>";
            }
            
            html += "</panelcontent></panel>";
            return html;
        }

        function findOptions(widget, result) {
            if (widget.prototypeProductOption!=null)
                result.push( widget.prototypeProductOption.effectiveCode );
            else if (widget.type==='ProductNumberWidget') {
                result.push("_productNumber");
            }
            if (widget.children!=null) {
                for (var i = 0; i < widget.children.length; i++) {
                    findOptions(widget.children[i], result);
                }
            }
        }


    };

}])
.factory('PanelGroupWidget', [function() {

    return function PanelGroupWidget() {

        this.type = 'PanelWidget';
        this.children = [];
        this.classes = null;
        
        this.render = function() {
            var html = '';
            if (this.classes!=null)
                html += "<panelgroup class=\""+ classes + "\">";
            else
                html += "<panelgroup>";
            for (var i = 0; i < this.children.length; i++) {
                html += this.children[i].render();
            }
            
            html += "</panelgroup>";
            return html;
        };

    }

}]);