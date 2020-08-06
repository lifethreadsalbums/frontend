'use strict';

angular.module('pace.build', [])

.config(['$stateProvider', function($stateProvider) {

    $stateProvider

        .state('cover-test', {
            url: '/cover-test',
            templateUrl: 'views/build/cover-test.html',
        })

        .state('build', {
            url: '/build/:productId?category&name&prototypeId&projects&screenshot',
            abstract: false,
            data: {
                spinner: 'build',
                leftPanelHidden: true
            },
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                product:['$stateParams', 'Product', 'BuildService', function($stateParams, Product, BuildService) {

                    if ($stateParams.productId==='new') {
                        return BuildService.createProduct($stateParams.category,
                            $stateParams.name, $stateParams.prototypeId);
                    }

                    return Product.get({id:$stateParams.productId}).$promise;
                }],
                sections: ['product', 'BuildService', function(product, BuildService) {
                    return BuildService.getSectionsByPrototypeId(product.prototypeId);
                }],
                productPrototype:['product', 'ProductPrototype', function(product, ProductPrototype) {
                    return ProductPrototype.get({id:product.prototypeId}).$promise;
                }],
                userSettings: ['$stateParams', 'Settings', function($stateParams, Settings) {
                    if ($stateParams.productId==='new')
                        return Settings.get().$promise;
                    return null;
                }],
                user: ['User', function(User) {
                    return User.getCurrent().$promise;
                }],
            },
            views: {
                '': {
                    templateUrl: 'views/build/build.html',
                    controller:'BuildCtrl',
                },
                'right2@build': {

                    resolve: {
                        productPrototype: ['productPrototype', 'BuildService',
                            function(productPrototype, BuildService) {
                                BuildService.currentProductPrototype = productPrototype;
                                BuildService.resolveRight2ViewTemplate(productPrototype);
                                return productPrototype;
                            }
                        ],
                        layoutSizeOption:['product', 'BuildService', function(product, BuildService) {
                            return BuildService.getLayoutSizeOption(product);
                        }],

                        layoutViewData:['productPrototype', '$stateParams', 'LayoutViewData', function(productPrototype, $stateParams, LayoutViewData) {
                            if (productPrototype.productType==='SinglePrintProduct' && $stateParams.productId!='new') {
                                return LayoutViewData.get({id:$stateParams.productId}).$promise;
                            }
                        }],

                        layout:['layoutViewData', function(layoutViewData) {
                            if (layoutViewData) {
                                return layoutViewData.layout;
                            }
                        }],

                        layouts: ['productPrototype', 'product', '$q', 'Layout', function(productPrototype, product, $q, Layout) {

                            if (productPrototype.productType==='SinglePrintProduct') {
                                var promises = [];
                                _.each(product.children, function(child) {
                                    if (child.layoutId) {
                                        promises.push( Layout.get({id:child.layoutId}).$promise );
                                    }
                                });

                                if (promises.length>0)
                                    return $q.all(promises);
                                else
                                    return [];
                            }
                        }],
                    },

                    templateProvider: [ "$stateParams", '$templateFactory', 'BuildService', function( $stateParams, $templateFactory, BuildService) {

                        return BuildService.getRight2ViewTemplate()
                            .then(function(view) {
                                if (view)
                                    return $templateFactory.fromUrl(view);
                                else
                                    return '<div></div>';
                            });

                    }],

                    controllerProvider: ['$stateParams', 'BuildService', function($stateParams, BuildService) {
                        if (BuildService.currentProductPrototype.productType==='SinglePrintProduct' && $stateParams.productId!='new') {
                            return 'PrintsCtrl';
                        }
                    }]

                }
            }
        })

        .state('build.section', {
            url: '/:section',
            resolve: {

                section: ['$stateParams', 'sections', 'BuildService', function($stateParams, sections, BuildService) {

                    var section = _.findWhere(sections, { url:$stateParams.section });
                    BuildService.currentSection = section;
                    return section;

                }],
                nextSection: ['sections', 'section', function(sections, section){
                    var idx = sections.indexOf(section);
                    return (idx + 1)<sections.length ? sections[idx + 1] : null;
                }],
                prevSection: ['sections', 'section', function(sections, section){
                    var idx = sections.indexOf(section);
                    return (idx - 1)>=0 ? sections[idx - 1] : null;
                }],

                product: ['product', function(product) { return product; }],
                productPrototype: ['productPrototype', function(productPrototype) { return productPrototype; }]
            },
            views: {
                'left@build': {
                    templateUrl: 'views/build/section-item-list.html',
                    resolve: {

                        items: ['$stateParams', 'section', 'product', function($stateParams, section, product) {

                            var items = [],
                                index = 1;

                            angular.forEach(section.children, function(child) {

                                items.push({ id:index++,
                                    label: child.displayLabel,
                                    description: child.displayPrompt,
                                    absoluteUrl: '#/build/' + $stateParams.productId + '/' + section.url + '/' + child.url,
                                    type: child.type,
                                    optionCode: child.prototypeProductOption.effectiveCode,
                                    prototypeProductOption: child.prototypeProductOption
                                });

                            });
                            return items;

                        }],

                    },

                    controller: 'SectionItemListCtrl'
                },
                'right@build': {
                    //templateUrl: 'views/build/section-summary.html',
                    templateProvider: [ "$stateParams", '$templateFactory', 'BuildService', function( $stateParams, $templateFactory, BuildService) {

                        // if (BuildService.currentProductPrototype.productType!=='SinglePrintProduct') {
                        //     return $templateFactory.fromUrl('views/build/section-summary.html');
                        // }

                        return BuildService.getSectionViewTemplate()
                            .then(function(view) {
                                if (view)
                                    return $templateFactory.fromUrl(view);
                                else
                                    return '<div></div>';
                            });

                    }],
                    controllerProvider: ['$stateParams', 'BuildService', function($stateParams, BuildService) {
                        if (BuildService.currentProductPrototype.productType!=='SinglePrintProduct') {
                            return 'SectionSummaryCtrl';
                        }
                    }],

                    resolve: {
                        product: ['product', function(product) { return product; }],
                            productPrototype: ['productPrototype', 'BuildService',
                        function(productPrototype, BuildService) {
                            BuildService.currentProductPrototype = productPrototype;
                            BuildService.resolveSectionViewTemplate(productPrototype);
                            return productPrototype;
                        }
                    ]

                    },
                    //controller: 'SectionSummaryCtrl'
                }
            }

        })


        .state('build.section.option', {
            url:'/:optionUrl',
            resolve: {
                section: ['section', function(section) { return section; }],
                nextSection: ['nextSection', function(nextSection) { return nextSection; }],
                product: ['product', function(product) { return product; }],
                productPrototype: ['productPrototype', function(productPrototype) { return productPrototype; }],
                sectionItem: ['$stateParams','section', function($stateParams, section) {
                    return _.findWhere(section.children, { url:$stateParams.optionUrl });
                }],
                coverLayout: ['BuildService', 'product', 'Layout', 'sectionItem', function(BuildService, product, Layout, sectionItem) {
                    if (sectionItem.type==='BuildSlideshowViewWidget' || sectionItem.type==='BuildPrintsSizeOptionWidget' ||
                        sectionItem.type==='BuildPrintsOptionWidget') {
                        return null;
                    } else {
                        var p = angular.copy(product);
                        //TODO: warning, iris-only hack
                        if (['qbic', 'fic'].indexOf(p.options.bookMaterial)>=0 && sectionItem.type==='BuildStampWidget') {
                            p.options.bookMaterial = 'silk';
                        }

                        return Layout.getCoverLayout(p).$promise;
                    }
                }],
                secondaryOption: ['sectionItem', function(sectionItem) {
                    return {
                        optionCode: sectionItem.optionCode,
                        items:[]
                    };
                }]
            },

            views: {
                'left@build': {
                    resolve: {

                        items: ['BuildService', '$stateParams', 'section', 'sectionItem', 'product',
                            function(BuildService, $stateParams, section, sectionItem, product) {

                                return BuildService.getProductOptionValuesAsItemList(
                                    product,
                                    sectionItem.prototypeProductOption.effectiveCode);

                            }
                        ],

                        layoutSizeOption:['product', 'BuildService', function(product, BuildService) {
                            return BuildService.getLayoutSizeOption(product);
                        }],

                        sectionItem: ['sectionItem', 'BuildService', function(sectionItem, BuildService) {
                            BuildService.resolveLeftViewTemplate(sectionItem);
                            BuildService.resolveRightViewTemplate(sectionItem);
                            BuildService.sectionItem = sectionItem;
                            return sectionItem;
                        }],

                    },

                    templateProvider: [ "$stateParams", '$templateFactory', 'BuildService', function( $stateParams, $templateFactory, BuildService) {

                        return BuildService.getLeftViewTemplate()
                            .then(function(view) {
                                if (view) {
                                    return $templateFactory.fromUrl('views/build/' + view);
                                } else {
                                    return '';
                                }
                            });

                    }],

                    controllerProvider: ['$stateParams', 'BuildService', function($stateParams, BuildService) {

                        var ctrl = {
                            'BuildCoverViewWidget':               'ItemListCtrl',
                            'BuildBoxViewWidget':                 'ItemListCtrl',
                            'BuildEndPapersViewWidget':           'ItemListCtrl',
                            'BuildSlideshowViewWidget':           'ItemListCtrl',
                            'BuildDuplicatesViewWidget':          'DuplicatesSidebarCtrl',
                            'BuildStampWidget':                   'DebossingSidebarCtrl',
                            'BuildCustomDieWidget':               'DebossingSidebarCtrl',
                            'BuildNumericOptionSubsectionWidget': 'NumericOptionSubsectionCtrl',
                            'BuildStudioSampleWidget':            'BooleanOptionSubsectionCtrl',
                            'BuildBooleanOptionSubsectionWidget': 'BooleanOptionSubsectionCtrl',
                            'BuildCameoWidget':                   'CameoSidebarCtrl',
                            'BuildPrintsSizeOptionWidget':        'PrintsSizesSidebarCtrl',
                            'BuildPrintsOptionWidget':            'ItemListCtrl',
                            'BuildPrintsBooleanOptionWidget':	  'BooleanOptionSubsectionCtrl',
                        }
                        return ctrl[BuildService.sectionItem.type];
                    }]
                },

                'right@build': {

                    templateProvider: [ "$stateParams", '$templateFactory', 'BuildService', function( $stateParams, $templateFactory, BuildService) {

                        return BuildService.getRightViewTemplate()
                            .then(function(view) {
                                if (view) {
                                    return $templateFactory.fromUrl('views/build/' + view);
                                } else {
                                    return '';
                                }
                            });

                    }],

                    controllerProvider: ['$stateParams', 'BuildService', function($stateParams, BuildService) {

                        var ctrl = {
                            'BuildCoverViewWidget':               'CoverViewCtrl',
                            'BuildBoxViewWidget':                 'CoverViewCtrl',
                            'BuildEndPapersViewWidget':           'CoverViewCtrl',
                            'BuildSlideshowViewWidget':           'SlideshowViewCtrl',
                            'BuildStampWidget':                   'DebossingViewCtrl',
                            'BuildCustomDieWidget':               'DebossingViewCtrl',
                            'BuildNumericOptionSubsectionWidget': 'SlideshowViewCtrl',
                            'BuildDuplicatesViewWidget':          'CoverViewCtrl',
                            'BuildStudioSampleWidget':            'CoverViewCtrl',
                            'BuildCameoWidget':                   'CameoViewCtrl',
                            'BuildBooleanOptionSubsectionWidget': 'SlideshowViewCtrl',
                            'BuildBooleanOptionWidget':           'SlideshowViewCtrl',
                            'BuildPrintsOptionWidget':            null,
                        }

                        return ctrl[BuildService.sectionItem.type];
                    }]
                }
            }
        })


  }])

