    'use strict';

angular.module('pace.dashboard')
.controller('WelcomeCtrl',
    ['$scope', '$rootScope', '$stateParams', '$timeout', '$state', 'ngDialog', 'categories', '$location', 'Product', 'StoreConfig', 'user',
    function ($scope, $rootScope, $stateParams, $timeout, $state, ngDialog, categories, $location, Product, StoreConfig, user) {
        function selectFeatured(item) {

            if (_.isString(item)) {
                $location.url(item);
            } else {
                $location
                    .path('/build/new/details/product-line')
                    .search({ category: item.code });
            }
        }


        $scope.selectFeatured = selectFeatured;
        $scope.welcomePage = StoreConfig.welcomePage;

        if (user.admin && StoreConfig.welcomePage && StoreConfig.welcomePage.adminProducts) {
            $scope.products = StoreConfig.welcomePage.adminProducts;
        } else if (StoreConfig.welcomePage && StoreConfig.welcomePage.products) {
            $scope.products = StoreConfig.welcomePage.products;
        } else {
            $scope.categories = categories;
        }

        function checkCurrentProjects() {
            Product.countMyCurrentProducts({}, function (value) {
                $rootScope.designerDisabled = value.count > 0 ? false : true;
            });
        }
        checkCurrentProjects();
    }])
.controller('NewProjectPopupCtrl', ['$scope', '$location', 'ngDialog', 'Product', 'MessageService',
    function ($scope, $location, ngDialog, Product, MessageService) {
        var category = $scope.itemCategory;

        function createNewProject() {
            $scope.validating = false;
            Product.getMyProducts({name:$scope.projectName}, function(products) {
                $scope.validating = false;
                if (products.length>0) {
                    MessageService.show('This Project name currently exists please choose another name.', 'alert');
                } else {
                    $location.path('/build/new/details/product-line')
                        .search({
                            category: $scope.itemCategory,
                            name: $scope.projectName,
                        });
                    ngDialog.closeAll();
                }
            });
        }

        $scope.createNewProject = createNewProject;
    }]);
