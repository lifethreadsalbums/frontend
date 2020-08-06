'use strict';

angular.module('paceApp')
.service('MainNavService', ['$state', 'Product', 'StoreConfig', '$location', 
    function MainNavService($state, Product, StoreConfig, $location) {

    var currentController;
    
    this.setCurrentController = function(value) {
        currentController = value;
    };

    this.getProductInfo = function() {
        if (currentController && currentController.getCurrentProductInfo) {
            return currentController.getCurrentProductInfo();
        } else {
            // WTF ????
            console.error('No Current Controller')
        }
        return {};
    };
    
    this.gotoProjects = function() {
        if ($state.includes('orders')) return;

        var productInfo = this.getProductInfo(),
            product = productInfo.product;
        var section = getProductSection(product);
       
        if (product && product.parentId) {
            $state.go('orders.' + section + '.details.duplicate', { id: product.parentId, duplicateId: product.id });
        } else if (product) {
            $state.go('orders.' + section + '.details', { id: product.id, section: productInfo.section, optionUrl: productInfo.optionUrl});
        } else {
            $state.go('orders.current');
        }
    };

    this.gotoPrints = function() {
        var productInfo = this.getProductInfo();
        if (!(productInfo && productInfo.product) && StoreConfig.prints.newProductUrl) {
            $location.url(StoreConfig.prints.newProductUrl);
        } else {
            this.gotoProductBuilder();
        }
    }

    this.gotoProductBuilder = function() {
        if ($state.includes('build')) return;

        var productInfo = this.getProductInfo(),
            params = {
                productId: productInfo.product ? productInfo.product.id : 'new', 
                section: productInfo.section || 'details', 
                optionUrl: productInfo.optionUrl || 'product-type'
            };
        if (productInfo.product && productInfo.product.productType==='SinglePrintProduct' && !productInfo.optionUrl) {
            params.section = 'sizes';
            params.optionUrl = 'sizes-packages';
        }

        var state = params.optionUrl ? 'build.section.option' : 'build.section';
        $state.go(state, params);
    };

    this.gotoDashboard = function() {
        var productInfo = this.getProductInfo(),
            params = { 
                productId: productInfo.product ? productInfo.product.id: null ,
                section: getProductSection(productInfo.product)
            };

        $state.go('dashboard.default.overview.product', params);
    };

    this.gotoDesigner = function() {
        if ($state.includes('layout')) return;

        var productInfo = this.getProductInfo(),
            product = productInfo.product;

        if (product) {
            if (product.productType!=='SinglePrintProduct') {
                $state.go('layout', { productId: product.id });
            } else {
                this.gotoProductBuilder();
            }
        } else {
            Product.getMyProducts({state: 'New'}, function (value) {
                if (value.length) {
                    $state.go('layout', { productId: value[0].id });
                } 
            });
        }
    };


    function getProductSection(product) {
        if (!product) return 'current';

        var states = {
            current: ['New'],
            production: ['Bindery','Printed','Printing','Preflight','OnHold'],
            completed: ['Completed', 'Shipped','ReadyToShip', 'Cancelled']
        }
        var section;
        for(var key in states) {
            if (states[key].indexOf(product.state)>=0) {
                section = key;
                break;
            }
        }
        return section;
    }

}]);