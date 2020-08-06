'use strict';

angular.module('pace.dashboard')
    .directive('projectOverview', ['$parse', '$timeout', 'Product', 'ImageUploadService', '$state', 'DataCacheService', 'StoreConfig', 'ProoferService',
    function ($parse, $timeout, Product, ImageUploadService, $state, DataCacheService, StoreConfig, ProoferService) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                project:'=',
                index: '@',
                indexTotal: '@',
                isSelected: '='
            },
            templateUrl: 'views/dashboard/projectOverview.html',
            link: function postLink(scope, element, attrs, ctrl) {

                var flipContainer = element.find('.flip__container'),
                    fileInput = element.find('input[type=file]'),
                    layoutCached = false;

                scope.isSaving = false;

                element.find('.flip__area').on('mouseover', function(e) {
                    if (scope.project.children.length && !scope.project.childToggle && scope.project.productType !== 'SinglePrintProduct') {
                        return;
                    }

                    flipContainer.addClass('flip__container--fliped');
                    if (scope.project.layoutId && !layoutCached) {
                        DataCacheService.getLayoutViewData(scope.project.id);
                        layoutCached = true;
                    }

                }).on('mouseleave', function(e) {
                    flipContainer.removeClass('flip__container--fliped');
                });

                fileInput.on('change', function(e) {
                    ImageUploadService.filesToBeUploaded = fileInput[0].files;
                    $state.go('layout', { productId: scope.project.id });
                });

                scope.showPrice = function() {
                    scope.$emit('dashboard:price-button-click', { project: scope.project });
                };

                scope.onMenuClick = function(index) {
                    scope.$emit('dashboard:project-menu-click', { project: scope.project, index: index });
                };

                scope.upload = function() {
                    if (scope.project.state!=='New' || !scope.project.layoutId) return;

                    $timeout(function() {
                        fileInput.trigger('click');
                    });
                };

                scope.gotoProjects = function() {
                    var section = 'current';
                    if (scope.project.state==='Completed') {
                        section = 'completed';
                    } else if (scope.project.state!=='New') {
                        section = 'production';
                    }
                    $state.go('orders.' + section + '.details', { id: scope.project.id});
                };

                scope.goOrderHistory = function() {
                    $state.go('orders.history.details', { id: scope.project.orderId});
                };

                scope.toggleLinkLayout = function (project) {
                    if (scope.isSaving) return;

                    project.linkLayout = !project.linkLayout;

                    scope.isSaving = true;

                    new Product(project).$save(function() {
                        scope.isSaving = false;
                    }, function() {
                        // revert change (optimistic update) on error
                        project.linkLayout = !project.linkLayout;

                        scope.isSaving = false;
                    });
                };

                scope.reorder = function() {
                    scope.$parent.$parent.$parent.$parent.$parent.reorder(scope.project);
                };

                //scope.thumbUrl = StoreConfig.imageUrlPrefix + 'product-thumb/' + scope.project.id + '.jpg';// Product.getThumbUrl({id:scope.project.id});
                scope.thumbUrl = Product.getThumbUrl({id:scope.project.id});

                scope.proofStatus = 'Designing';

                function refreshProoferStatus() {
                    ProoferService.getProofStatus(scope.project)
                        .then(function(result) {
                            if (result==='WaitingOnDesigner') 
                                scope.proofStatus = 'Waiting on me';
                            else if (result==='WaitingOnClient')
                                scope.proofStatus = 'Waiting on client';
                            else if (result==='Approved')
                                scope.proofStatus = 'Approved'; 
                        });
                }

                if (scope.project.layoutId) {
                    refreshProoferStatus();

                    scope.$on('dashboard:comment-received', function(e, comment) {
                        if (comment.layout.id===scope.project.layoutId) {
                            refreshProoferStatus();
                        }
                    });
                }
            }
        };
    }]);
