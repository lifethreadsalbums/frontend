'use strict';

angular.module('pace.order')
    .controller('ProductListCtrl', ['$scope', 'products', 'title', '$state', '$location', '_', '$rootScope', 
        'Product', '$timeout', 'NotificationEvent', 'Task', 'AuthService',
        function ($scope, products, title, $state, $location, _, $rootScope, 
            Product, $timeout, NotificationEvent, Task, AuthService) {


            var destroyed = false,
                pageSize = 10,
                pageIndex = -1,
                loadProductsFn,
                isLoading = false;;

            if (angular.isFunction(products)) {
                loadProductsFn = products;
                products = [];
                loadNextPage();
                $scope.canLoadNextPage = true;
            } else {
                $scope.canLoadNextPage = false;
            }

            $scope.products = products;
            $scope.title = title;
            $scope.selectedProducts = [];

            function loadNextPage() {
                if (isLoading) return;
                //console.log('loadNextPage', pageIndex);
                isLoading = true;
                var result = loadProductsFn(pageSize, pageIndex + 1);
                result.$promise.then(function(results) {
                    if (results && results.length>0) {
                        $scope.products = $scope.products.concat(results);
                        
                        pageIndex++;
                    } 
                    if (!results || results.length<pageSize) {
                        $scope.canLoadNextPage = false;
                    } 

                    if ($state.params.id && $scope.selectedProducts.length===0) {
                        initProducts($scope.products);
                        if ($scope.canLoadNextPage && $scope.selectedProducts.length===0) {
                            $timeout(loadNextPage);
                        }
                    }

                    isLoading = false;
                }, function(error) {
                    $scope.canLoadNextPage = false;
                    isLoading = false;
                });

            }


            //TODO: find a better way to navigate to the first product
            function initProducts(products) {
                if (destroyed) return;

                var id = $state.params.id ? parseInt($state.params.id) : (products.length>0 ? products[0].id : undefined),
                    duplicateId = $state.params.duplicateId ? parseInt($state.params.duplicateId) : null,
                    product;

                if (duplicateId) {
                    product = _.findWhere(products, {id:id});
                    if (product && product.children) {
                        product = _.findWhere(product.children, {id:duplicateId});
                        if (product) $scope.selectedProducts = [ product ];
                    }
                } else if (id) {
                    product = _.findWhere(products, {id:id});
                    if (product) {
                        $scope.selectedProducts = [ product ];
                        //console.log('product selected')
                    }

                }

                if (!$state.params.id && id) {
                    $state.go($state.current.name + '.details', {id:id});
                }
                
            }

            if (products.$promise) {
                products.$promise.then(initProducts); 
            } else {
                initProducts(products);
            }

            $scope.loadNextPage = loadNextPage;

            $scope.$on('product-deleted', function(event, args) {
                var product = _.findWhere($scope.products, {id:args.id});
                if (product)
                    $scope.products.splice($scope.products.indexOf(product), 1)

            });

            $scope.$on('product-saved', function(event, args) {
                var product = _.findWhere($scope.products, {id:args.product.id});
                if (product) 
                    $scope.products[$scope.products.indexOf(product)] = args.product;

            });
            $scope.$on('product-moved', function(event, args) {
                var product = _.findWhere($scope.products, {id:args.id});
                if (product)
                    $scope.products.splice($scope.products.indexOf(product), 1)

            });

            $scope.$on('products-moved', function(event, products) {
                _.each(products, function(p) {
                    var product = _.findWhere($scope.products, {id:p.id});
                    if (product) {
                        $scope.products.splice($scope.products.indexOf(product), 1)
                    }
                });
            });


            $scope.$on('$destroy', function() {
                destroyed = true;
                //console.log('product list destroyed');
            });


            $scope.sortFn = function(product) {
                return product.options[$scope.sort];
            };

            $scope.jobs = [];
            $scope.completedJobs = [];

            $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
                
                var message = JSON.parse(notification.body);
                var user = AuthService.getCurrentUser();
                if (message.user && message.user.id!==user.id) return;

                if (message.modelType==='JobProgressInfo') {
                    
                    //console.log('notification', message);
                    
                    var job = _.findWhere($scope.completedJobs, {jobId:message.jobId});
                    if (job) return;

                    job = _.findWhere($scope.jobs, {jobId:message.jobId});
                    if (!job && message.progressPercent<100) {
                        job = message;
                        $scope.recentJob = job;
                        $scope.jobs.push(job);
                    }
                    if (message.progressPercent>job.progressPercent) {
                        job.progressPercent = message.progressPercent;
                        $scope.recentJob = job;
                    }
                    if (job.progressPercent===100) {
                        $scope.completedJobs.push(job);
                        $scope.jobs = _.without($scope.jobs, job);
                        $scope.recentJob = null;
                    }
                    //console.log('jobs', $scope.jobs);
                    $scope.$apply();
                }
            });

            $scope.genHiResPdf = function() {
                if ($scope.selectedProducts.length===1) {
                    Task.generateHiResPdf({id:$scope.selectedProducts[0].id});
                }
            };

            $scope.task = function(task) {
                if ($scope.selectedProducts.length===1) {
                    Task[task]({id:$scope.selectedProducts[0].id});
                }
            };

            $scope.onProductMenuClick = function(key) {
                if (key==='sendToBatch') 
                    $scope.sendToBatch();
                else
                    $scope.task(key);
            }

            $scope.cancelJob = function(job) {
                //console.log('cancelJob', job);
                Task.cancelJob({id:job.jobId});
            }

    }]);
