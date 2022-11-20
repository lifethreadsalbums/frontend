'use strict';

angular.module('pace.order')
.factory('ProductOptionWidget', [function() {

    return function ProductOptionWidget() {

        this.prototypeProduct = null;
        this.prototypeProductOption = null;
        this.previousPrototypeProductOption = null;
        this.productExpression = 'model.product';
        this.isReprint = false;
        this.triggerChangeProductPrototypeEvent = true;
        this.editable = true;

        var that = this;

        function escapeExpression(exp) {
            if (exp==null) return null;
            exp = exp.replace(/\"/g, "'");
            return exp;
        }

        this.render = function() {
            var html = '';
            var productOptionClass = this.prototypeProductOption.productOptionType.productOptionClass.replace('com.poweredbypace.pace.domain.','');

            html += "<div class=\"form-element inline\"";
            var label = PACE.utils.slug(this.prototypeProductOption.effectiveDisplayLabel);
            html += " name=\"" + label + "\"";

            var visiblity = escapeExpression(this.prototypeProductOption.visibilityExpression);
            if (visiblity!=null)
                html += " ng-show=\"" + visiblity + "\" ";

            html += ">";
            html += "<label>";

            if (productOptionClass==='ProductOptionBoolean' && !(this.prototypeProductOption.effectiveParams && this.prototypeProductOption.effectiveParams.onOff))
                html += "&nbsp;";
            else
                html += this.prototypeProductOption.effectiveDisplayLabel;
            html += "</label>";

            if (productOptionClass==='ProductOptionValue') {
                html += renderDropDown();
            } else if (productOptionClass==='ProductOptionString') {
                html += renderInput("text");
            } else if (productOptionClass==='ProductOptionInteger') {
                html += renderInput("number");
            } else if (productOptionClass==='ProductOptionBoolean') {
                html += renderCheckbox();
            } else if (productOptionClass==='ProductOptionDate') {
                html += renderDateInput();
            } else if (productOptionClass==='ProductOptionDouble') {
                html += renderNumericInput();
            }

            html += "</div>";
            return html;
        };

        function renderDropDown() {

            var code = that.prototypeProductOption.effectiveCode;
            var option = that.prototypeProductOption;

            angular.forEach(option.prototypeProductOptionValues, function(value, index) {
                if(value.productOptionValue.code == "pearl" || value.productOptionValue.code == "velvet"){
                    option.prototypeProductOptionValues.splice(index, 1);
                }
            });
            var html = "<dropdown-button";
            html += renderNgModel();

            var visiblity = escapeExpression(option.visibilityExpression);
            if (visiblity==null && option.isRequired)
                html += "required ";
            //html +=("ng-focus ");

            if (that.triggerChangeProductPrototypeEvent && option.productOptionType.systemAttribute=='ProductPrototype')
                html += " on-change=\"changeProductPrototype()\" ";
            else
                html += " on-change=\"onFieldChange('" + code +"')\" ";

            html += "label-field=\"displayName\" value-field=\"code\" label=\"Please select\" ";
            html += "options=\"model.productOptions." + code + ".prototypeProductOptionValues";

            var parent = option.parent;
            var parentCode = parent!=null ? parent.effectiveCode : null;

            if (parent!=null) {
                html += " | parentOption: " + that.productExpression + ".options." + parentCode + ":'" + parentCode + "' ";
            }
            html += " | optionVisibility: " + that.productExpression;
            if (option.sortType=='AlphabeticAscending')
                html += " | orderBy:'displayOrder' ";
            else if (option.sortType=='AlphabeticDescending')
                html += " | orderBy:'displayOrder':true ";
            html += "\" ";

            if (!option.isRequired) {
                html += "nullable=\"true\" ";
            }

            var parentOptionCondition = "";
            if (parent!=null) {
                parentOptionCondition = " || !" + that.productExpression + ".options." + parentCode;
            } else if (that.previousPrototypeProductOption!=null) {
                parentOptionCondition = " || (!" + that.productExpression + ".options." +
                    that.previousPrototypeProductOption.effectiveCode + " && isVisible('" +
                        that.previousPrototypeProductOption.effectiveCode + "'))";
            }

            if (that.isReprint && !option.includeInReprint) {
                parentOptionCondition += " || true";
            }

            if (!_.isEmpty(option.enabledExpression)) {
                var exp = escapeExpression(option.enabledExpression);
                parentOptionCondition += " || !(" + exp + ")";
            }

            html += " ng-disabled=\"model.readOnly" + parentOptionCondition + "\" ";

            if (visiblity!=null)
                html += " ng-required=\"" + visiblity + "\" ";

            html += "/>";
            return html;
        }


        function renderInput(type) {
            var isNumber = "number"===type;
            var isDate = "date"===type;

            if (isDate) {
                type = "text";
            }

            var html;
            if (!that.editable) {
                html = '<input type="text" class="readonly ' + (isNumber ? 'short' : '') + '"';
            } else {
                html = '<input type="' + type + '"' + (isNumber ? 'class="short"' : '');
            }

            var prevOptionCondition = "";
            if (that.previousPrototypeProductOption!=null) {
                prevOptionCondition = " || !" + that.productExpression +".options." +
                    that.previousPrototypeProductOption.effectiveCode;
            }

            if ((!that.editable) ||
                (that.isReprint && !that.prototypeProductOption.includeInReprint)) {
                prevOptionCondition += " || true";
            }

            html += " ng-disabled=\"model.readOnly" + prevOptionCondition + "\" ";

            if (isNumber) {
                html += renderValidators();
            }
            html += renderNgModel();

            if (!that.isReprint && that.prototypeProductOption.systemAttribute==='PageCount') {
                html += " ng-model-options=\"{ updateOn: 'default', debounce: {'default': 500} }\" ";
            }

            if (that.prototypeProductOption.systemAttribute==='ReprintPages') {
                html += " reprint-pages-widget  ";
            }

            var visiblity = escapeExpression(that.prototypeProductOption.visibilityExpression);
            if (visiblity==null && that.isRequired)
                html += "required ";

            if (visiblity!=null)
                html += " ng-required=\"" + visiblity + "\" ";

            if (isDate) {
                html += " date-format2 ";
            }

            html += "ng-focus/>";
            return html;
        }

        function renderCheckbox() {
            var code = that.prototypeProductOption.effectiveCode,
                html;

            if (that.prototypeProductOption.effectiveParams && that.prototypeProductOption.effectiveParams.onOff) {
                html = '<div style="margin-top:5px"><on-off ';

                var disabledExp = '';
                if (!_.isEmpty(that.prototypeProductOption.enabledExpression)) {
                    var exp = escapeExpression(that.prototypeProductOption.enabledExpression);
                    exp = exp.replace(/product./g, that.productExpression + '.');
                    disabledExp += " || !(" + exp + ")";
                }

                html += ' ng-disabled="model.readOnly '+ disabledExp + '" '+
                    'ng-model="' + that.productExpression +
                    '.options.' + code + '"></on-off></div>';
                return html;
            }
            html = "<a href=\"\" class=\"button tick\" ";
            html += "ng-class=\"{active:" + that.productExpression + ".options." + code + "}\" ng-click=\"toggleOption(" + that.productExpression + ", '" + code + "')\">";
            html += that.prototypeProductOption.effectiveDisplayLabel;
            html += "</a>";
            return html;
        }

        function renderNumericInput() {
            var html = "<span style=\"font-size:12px\">$ </span><input money-input precision=\"2\" class=\"short\" ";
            var prevOptionCondition = "";
            if (that.previousPrototypeProductOption!=null) {
                prevOptionCondition = " || !" + that.productExpression + ".options." +
                    that.previousPrototypeProductOption.effectiveCode;
            }

            if (that.isReprint && !that.prototypeProductOption.includeInReprint) {
                prevOptionCondition += " || true";
            }

            html += " ng-disabled=\"model.readOnly" + prevOptionCondition + "\" ";

            //renderValidators(builder);
            html += renderNgModel();

            var visiblity = escapeExpression(that.prototypeProductOption.visibilityExpression);
            if (visiblity==null && that.isRequired)
                html += "required ";

            if (visiblity!=null)
                html += " ng-required=\"" + visiblity + "\" ";

            html += "ng-focus/>";
            return html;
        }

        function renderDateInput() {
            var html = "<datepicker date-format=\"yyyy-MM-dd\">";
            html += renderInput("date");
            html += "</datepicker>";
            return html;
        }

        function renderNgModel() {
            var code = that.prototypeProductOption.effectiveCode;

            if (that.isReprint && that.prototypeProductOption.productOptionType.systemAttribute==='PageCount')
                code = "_reprintPageCount";

            return ' name="product_' + code + '" ng-model="' + that.productExpression + '.options.' + code + '" ';
        }

        function renderValidators() {
            var params = that.prototypeProductOption.effectiveParams || {};
            var skipMinMax = that.isReprint &&
                that.prototypeProductOption.productOptionType.systemAttribute==='PageCount';

            var html = '';
            if (!skipMinMax) {
                var min = params.min || 1;

                html += " min=\"{{" + min + "}}\" ";
                if (params.max) {
                    html += " max=\"{{" + params.max + "}}\" ";
                }
                if (params.step) {
                    html += " step=\"{{" + params.step + "}}\" ";
                }

                if (that.prototypeProductOption.productOptionType.systemAttribute==='PageCount' &&
                    that.prototypeProduct.productPageType==='PageBased')
                    html += " step=\"2\" ";

                html += " force-min-max ";
            }
            return html;
        }

    };

}]);
