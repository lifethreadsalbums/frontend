'use strict';

angular.module('pace.order')
.factory('ProductNumberWidget', [function() {
	return function ProductNumberWidget() {

		this.render = function() {
			var html = "<div class=\"form-element inline\"";
			
			var label = "Order ID";
			html += " name=\"" + label + "\"";
			html += " ng-show=\"model.product.state!='New' && currentUser.admin\">";
			html += "<label>" + label +"</label>";

			html += "<input type=\"text\"";
			html += " name=\"product_number" + "\" ng-model=\"model.product.productNumber\"";
			html += " ng-required=\"model.product.state!='New' && currentUser.admin\"";
			html += " ng-focus/>";
			
			html += "</div>";
			return html;
		}

	};
}]);