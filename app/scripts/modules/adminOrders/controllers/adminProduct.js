'use strict';

angular.module('pace.adminOrders')

    .filter('urlencode', function() {
        return function(input) {
            return window.encodeURIComponent(input);
        }
    })
    .controller('AdminProductCtrl', ['$scope', '$stateParams', '$timeout', '$state', 'Product', 'AuthService',
        'MessageService', '$rootScope', '$debounce', '$location', 'Currency', 'ProductService',
        'ProductPrototype', '$q', 'CartService', 'ProductAutoSaveService', 'ModelEvent', 'StoreConfig', '$interpolate',
        function ($scope, $stateParams, $timeout, $state, Product, AuthService,
            MessageService, $rootScope, $debounce, $location, Currency, ProductService,
            ProductPrototype, $q, CartService, ProductAutoSaveService, ModelEvent, StoreConfig, $interpolate) {

        //console.log('ProductCtrl', product);
        var product = null,
            productPrototype = null,
            defaultPrototype = ProductPrototype.getDefault(),
            autoSaver,
            mailToExpression = 'mailto:{{currentProduct.user.email}}?subject={{currentProduct.productNumber}} {{currentProduct.options._name}}';

        if (StoreConfig.adminOrders && StoreConfig.adminOrders.mailToExpression) {
            mailToExpression = StoreConfig.adminOrders.mailToExpression;
        }
        var mailToGetter = $interpolate(mailToExpression);

        if($state.current.data && typeof $state.current.data.forceReadOnly !== 'undefined') {
            $scope.forceReadOnly = $state.current.data.forceReadOnly;
        } else {
            $scope.forceReadOnly = false;
        }

        $scope.selectedTab = 0;
        $scope.currentProduct = product;
        $scope.saving = false;
        if ($scope.toolBarModel)
            $scope.toolBarModel.isFavourite = !!product.isFavourite;

        function selectDuplicate(duplicateId) {
            var product = $scope.currentProduct,
                id = parseInt(duplicateId),
                child = _.findWhere(product.children, {id:id});

            if (child) {
                $scope.selectedTab = product.children.indexOf(child) + 1;
            }
        }



        function parsePageNumbers(product, productPrototype) {
            var isPageBased = productPrototype.productPageType==='PageBased';
            var isRPS = false;
            var numPages = product.options._pageCount;
            
            var pages = product.options._reprintPages;
            
            if (pages && pages.toLowerCase().indexOf("all")>=0)
            {
                if (isRPS && !isPageBased)
                    pages = "0.5-" + (numPages-0.5);
                else
                    pages =  "1-" + numPages;
            }
            
            if (!pages || pages=="")
                return null;
            
            
            var result = [];
            var regexp = /(\d+\-\d+)|(\d+)/g;
            if (isRPS && !isPageBased)
            {
                regexp = /([0-9]+\.?[0-9]*\-[0-9]*\.?[0-9]+)|([0-9]+\.?[0-9]*)/g;
            }
            var matches = pages.match(regexp);
            for(var k=0;k<matches.length;k++) {
                var grp = matches[k];
                if (grp.indexOf("-")>0)
                {
                    var range = grp.split("-");
                    var from = parseFloat(range[0]);
                    var to = parseFloat(range[1]);
                    
                    if (!isPageBased && isRPS)
                    {
                        if (from==0 || (from>0 && from<1))
                            from = 0.5;
                        else
                            from = Math.floor(from);
                        
                        if (to>numPages - 1 && to<numPages)
                            to = numPages - 0.5;
                        else
                            to = Math.floor(to);
                    } else {
                        if (from==0)
                            from = 1;
                    }
                    
                    if (to==from)
                    {
                        if (isPageBased && to%2==0)
                            to--;
                        if (result.indexOf(to)==-1 && to<numPages)
                        {
                            result.push(to);
                            if (isPageBased)
                                result.push(to+1);
                        }
                    } else if (to<from)
                        continue;
                    if (isPageBased && from%2==0)
                        from--;
                    
                    if (from==0.5)
                    {
                        result.push(from);
                        from = 1;
                    }
                    if (to==numPages-0.5)
                        result.push(to);
                    
                    for(var i=from;i<=to;i+= isPageBased ? 2 : 1)
                    {
                        if (result.indexOf(i)==-1 && i<=numPages)
                        {
                            result.push(i);
                            if (isPageBased)
                                result.push(i+1);
                        }
                    }
                    
                } else {
                    var num = parseFloat(grp);
                    
                    if (!isPageBased && isRPS)
                    {
                        if (num==0 || (num>0 && num<1))
                            num = 0.5;
                        else if (num>numPages - 1 && num<numPages)
                            num = numPages - 0.5;
                        else
                            num = Math.floor(num);
                    } else {
                        if (num==0)
                            num = 1;
                    }
                    if (isPageBased && num%2==0)
                        num--;
                    if (result.indexOf(num)==-1 && num<numPages)
                    {
                        result.push(num);
                        if (isPageBased)
                            result.push(num+1);
                    }
                }
            }
            return result;
        }





        function setupProduct(product, duplicateId) {
            var currentUser = AuthService.getCurrentUser(),
                isAdmin = currentUser && currentUser.admin;

            $scope.currentProduct = product;
            $scope.readOnly = !isAdmin && product.state!=='New';
            $scope.editable = !$scope.readOnly;
            if (duplicateId) selectDuplicate(duplicateId);

            ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                productPrototype = prototype;
                $scope.productPrototype = productPrototype;

                if (product.isReprint) {
                    var pages = parsePageNumbers(product, prototype);
                    product.options._reprintPageCount = pages ? pages.length : 0;
                }

                autoSaver.setProduct(product, productPrototype);
                autoSaver.setEnabled(!$scope.readOnly);
            });

            $rootScope.lastProductId = product.id;
            $rootScope.lastAdminOrderProduct = {state:$state.current.name, id:product.id};

            $scope.mailTo = mailToGetter({currentProduct:product});



            updateUI();
                    
        }

        $scope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                //console.log('stateChangeSuccess', toState, toParams);
                var duplicateId = toParams.duplicateId ? parseInt(toParams.duplicateId) : null;

                if (toState.name.indexOf('.details')>0) {
                    var id = parseInt(toParams.id);
                    $scope.selectedTab = 0;
                    var products = $scope.orderListCtrl.getSelectedProducts();

                    var product = _.findWhere(products, {id:id});
                    if (product) {
                        setupProduct(product, duplicateId);
                    } else {
                        return Product.get({id:id}, function(value) {
                            setupProduct(value, duplicateId);
                        });
                    }
                } else {
                    $scope.currentProduct = null;
                    $rootScope.lastAdminOrderProduct = null;
                }


            });

        $scope.$on(ModelEvent.ModelChanged, function(event, args) {
            // if ($scope.currentProduct && args.type==='Product') {
            //     var p = _.findWhere(args.items, {id:$scope.currentProduct.id});
            //     if (p && p.version>$scope.currentProduct.version) {
            //         setupProduct(p);
            //     }
            // }
        });

        function deleteProduct() {
            if ($scope.readOnly) return;

            if (!$scope.currentProduct.id) {
                $scope.cancel();
                return;
            }

            MessageService.confirm('Do you really want to delete this project?', function() {
                if (!$scope.currentProduct.id) {
                    $location.url('/orders');
                } else {

                    Product.delete({id:$scope.currentProduct.id}, function() {
                        $rootScope.$broadcast('product-deleted', { id:$scope.currentProduct.id });
                        $scope.currentProduct = null;
                        $state.go('^');
                    });

                }
            });
        }


        // $scope.toggleOption = function(code) {
        //     $scope.currentProduct.options[code] = !$scope.currentProduct.options[code];
        //     $scope.productForm.$setDirty();
        // };


        function onSave(product) {
            $scope.productForm.$setPristine();
            var isNew = !product.id;
            $rootScope.$broadcast('product-saved', { isNew:isNew, product:product });
        }

        function onDirty(product) {
            if (!product.id && product.prototypeId && !$scope.saving) {
                refreshPrice();
            }
            $scope.currentProductView = ProductService.getProductViewModel(product);
        }

        autoSaver = new ProductAutoSaveService($scope, onSave, onDirty);

        $scope.handleTabClose = function (index) {
            if (index===0)
                deleteProduct();
            else
                deleteChild(index - 1);
        };

        // $scope.toggleLinkLayout = function (index) {
        //     $scope.currentProduct.children[index - 1].linkLayout = !$scope.currentProduct.children[index - 1].linkLayout;
        //     $scope.save();
        // };

       // $scope.deleteProduct = deleteProduct;

        $scope.onReorderClick = function($event) {
            $event.preventDefault();
            $scope.onProductMenuClick('reorder');
        };

        $scope.onReprintClick = function($event) {
            $event.preventDefault();
            console.debug('[onReprintClick]', $scope);
            $scope.onProductMenuClick('reprint');
        };

        $scope.onGenerateClick = function(optionItem) {
            $scope.onProductMenuClick(optionItem.id);
        };

        // $scope.generateOptions = [
        //     {id: 'generateJpegCover', label: "JPEG Cover", callback: $scope.onGenerateClick},
        //     {id: 'generateHiResJpeg', label: "JPEG Spreads", callback: $scope.onGenerateClick},
        //     {id: 'sep-1', label: "--------------------", disabled: true},
        //     //{id: 'generateHiResPdf', label: "PDF", callback: $scope.onGenerateClick},
        //     //{id: 'generatePdfCover', label: "PDF Cover", callback: $scope.onGenerateClick},
        //     {id: 'generateLowResPdf', label: "PDF Proof", callback: $scope.onGenerateClick},
        //     {id: 'sep-2', label: "--------------------", disabled: true},
        //     {id: 'generateHiResTiff', label: "TIF Spreads", callback: $scope.onGenerateClick},
        //     {id: 'generateTiffCover', label: "TIF Cover", callback: $scope.onGenerateClick},
        //     //{id: 'sep-3', label: "--------------------", disabled: true},
        //     //{id: 'generateBinderyForm', label: "Bindery Forms", callback: $scope.onGenerateClick},
        //     //{id: 'generateProdSheet', label: "Production Forms", callback: $scope.onGenerateClick},
        // ];

        function updateUI() {
            var contextMenu = StoreConfig.adminOrders.contextMenu.generate;
            var options = [];
            _.each(contextMenu, function(ci, key) {

                var item;
                if (ci.separator) {
                    item = {id: key, label: "--------------------", disabled: true};
                } else {
                    item = {id: key, label: ci.label, callback: $scope.onGenerateClick};
                }
                if (!ci.cover || (ci.cover && $scope.currentProduct && $scope.currentProduct.coverLayoutId)) {
                    options.push(item);
                }
                
            });
            $scope.generateOptions = options;
        }
        
        $scope.onMailClick = function($event) {
            $event.preventDefault();
            // TODO: send mail
        };

        

    }]);
