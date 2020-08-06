'use strict';

angular.module('pace.build')
.service('BuildService', ['$rootScope', '$resource', '$q', 'Product', 'ProductPrototype', 'Widget', 'BumpMapService', '$state', '$parse',
        'ProductService', '$timeout', 
    function ($rootScope, $resource, $q, Product, ProductPrototype, Widget, BumpMapService, $state, $parse,
        ProductService, $timeout) {

    this.getProductOption = function(prototypeId, optionCode) {
        var promise = ProductPrototype.get({id:prototypeId}).$promise;
        return promise.then(function(value) {
            return value.getPrototypeProductOption(optionCode);
        });
    };

    this.getProductOptionValuesAsItemList = function(product, optionCode, parentOptionCode) {
        
        var deferred = $q.defer();
        var items = [];

        var promise = this.getProductOption(product.prototypeId, optionCode);
        promise.then(function(option) {

            if (option) {
                angular.forEach(option.prototypeProductOptionValues, function(item) {

                    if (!parentOptionCode && option.parent)
                        parentOptionCode = product.options[option.parent.effectiveCode]

                    if (!parentOptionCode || (item.parent && item.parent.code===parentOptionCode)) {
                        items.push(item);
                    }

                });
                //sort items
                if (option.sortType!=='Default') {
                    items = _.sortBy(items, function(item) { return item.displayName; });
                    if (option.sortType==='AlphabeticDescending') {
                        items = items.reverse();
                    }
                }
            }

            deferred.resolve(items);

        });
    
        return deferred.promise;
    };

    function getOptionWithAssociatedEntity(product, entity) {
        var promise = ProductPrototype.get({id:product.prototypeId}).$promise;
        return promise.then(function(prototype) {
            return prototype.getOptionWithAssociatedEntity(entity);
        });
    };

    this.getLayoutSizeOption = function(product) {
        return getOptionWithAssociatedEntity(product, 'layoutSize');
    };

    this.getCoverTypeOption = function(product) {
        return getOptionWithAssociatedEntity(product, 'coverType');
    };

    //reference to the new product being created in Cover Builder
    var newProduct;

    this.createProduct = function(category, name, prototypeId) {
        if ((!category && !prototypeId) && newProduct)
            return newProduct;

        if (prototypeId) {
            //var promise = ProductPrototype.get({id:prototypeId}).$promise;
            //return promise.then(function(prototype) {
                var product = new Product({ 
                    isCoverBuilderWizardEnabled: true,
                    isNew: true,
                    prototypeId: parseInt(prototypeId),
                    state: 'New',
                    options: { 
                        _name: name, 
                    //    _productPrototype: prototype.code,
                    },
                    children: []
                });
                newProduct = product;
                BumpMapService.lastCoverImage = null;

                return product; 
            //});
        }

        var promise = ProductPrototype.getDefault().$promise;
        return promise.then(function(prototype) {

            var categoryOption = _.findWhere(prototype.prototypeProductOptions, { systemAttribute:'ProductCategory' });
            var product = new Product({ 
                isCoverBuilderWizardEnabled: true,
                isNew: true,
                prototypeId: prototype.id,
                state:'New',
                options: { 
                    _name: name, 
                    //_quantity: 1,
                },
                children: [] 
            });
            if (categoryOption) {
                product.options[categoryOption.effectiveCode] = category;
            }
            newProduct = product;
            BumpMapService.lastCoverImage = null;

            return product;

        });
    };
    
    this.getSectionsByPrototypeId = function(prototypeId) {
        var promise = Widget.get({id:prototypeId}).$promise;

        var promise2 = ProductPrototype.get({id:prototypeId}).$promise;

        return $q.all([promise, promise2]).then(function(result) {

        //return promise.then(function(widget) {
            var widget = result[0],
                prototype = result[1];

            //fake duplicates options
            if (prototype.allowDuplicates && prototype.productType==='DesignableProduct') {
                var dupOptions = {
                    displayLabel: 'Parent Albums',
                    displayPrompt: 'Parent Albums',
                    prototypeProductOption: {
                        effectiveCode: "_duplicates"
                    },
                    type: 'BuildDuplicatesViewWidget',
                    url: 'parent-albums'
                }
                if (widget.children && widget.children.length>0) {
                    var lastSection = widget.children[widget.children.length - 1];
                    lastSection.children.push(dupOptions);
                }
            }

            _.each(widget.children, function(section) {
                var sortType = section.sortType;
                if (!sortType || sortType==='Default') return;

                var items = _.sortBy(section.children, function(item) { return item.displayLabel });
                if (sortType==='AlphabeticDescending') {
                    items = items.reverse();
                }
                section.children = items;
            });

            return widget.children;
        });
    };

    var leftTemplateDeferred,
        rightTemplateDeferred,
        right2TemplateDeferred,
        sectionTemplateDeferred;

    this.getLeftViewTemplate = function() {
        leftTemplateDeferred = $q.defer();
        return leftTemplateDeferred.promise;
    };

    this.resolveLeftViewTemplate = function(sectionItem) {
        var views = {
            'BuildCoverViewWidget':     'item-list.html',
            'BuildBoxViewWidget':       'item-list.html',
            'BuildEndPapersViewWidget': 'item-list.html',
            'BuildSlideshowViewWidget': 'item-list.html',
            'BuildStampWidget':         'debossing-sidebar.html',
            'BuildCustomDieWidget':     'debossing-sidebar.html',
            'BuildNumericOptionSubsectionWidget': 'numeric-option-subsection.html',
            'BuildDuplicatesViewWidget':'duplicates-sidebar.html',
            'BuildStudioSampleWidget':  'boolean-option-subsection.html',
            'BuildBooleanOptionSubsectionWidget': 'boolean-option-subsection.html',
            'BuildCameoWidget':         'cameo-sidebar.html',
            'BuildPrintsSizeOptionWidget':        'prints-sizes-sidebar.html',
            'BuildPrintsOptionWidget':            'item-list.html',
            'BuildPrintsBooleanOptionWidget':     'boolean-option-subsection.html'
        }
        leftTemplateDeferred.resolve(views[sectionItem.type]);
    };

    this.getRightViewTemplate = function() {
        rightTemplateDeferred = $q.defer();
        return rightTemplateDeferred.promise;
    };

    this.getRight2ViewTemplate = function() {
        right2TemplateDeferred = $q.defer();
        return right2TemplateDeferred.promise;
    };

    this.getSectionViewTemplate = function() {
        sectionTemplateDeferred = $q.defer();
        return sectionTemplateDeferred.promise;
    };

    this.resolveSectionViewTemplate = function(productPrototype) {
        var view = null;
        if (productPrototype.productType!=='SinglePrintProduct') {
            view = 'views/build/section-summary.html';
        }

        sectionTemplateDeferred.resolve(view);
    };

    this.resolveRightViewTemplate = function(sectionItem) {
        var views = {
            'BuildStudioSampleWidget':  'cover-view.html',
            'BuildCoverViewWidget':     'cover-view.html',
            'BuildBoxViewWidget':       'box-view.html',
            'BuildEndPapersViewWidget': 'endpapers-view.html',
            'BuildSlideshowViewWidget': 'slideshow-view.html',
            'BuildStampWidget':         'debossing-view.html',
            'BuildCustomDieWidget':     'debossing-view.html',
            'BuildNumericOptionSubsectionWidget': 'slideshow-view.html',
            'BuildBooleanOptionSubsectionWidget': 'slideshow-view.html',
            'BuildDuplicatesViewWidget':'cover-view.html',
            'BuildCameoWidget':         'cameo-view.html',
            'BuildPrintsOptionWidget': null,
            'BuildPrintsBooleanOptionWidget': null
        }
        rightTemplateDeferred.resolve(views[sectionItem.type]);
    };

    this.resolveRight2ViewTemplate = function(productPrototype) {
        var view = null;
        if (productPrototype.productType==='SinglePrintProduct') {
            view = 'views/prints/prints.html'
        }

        right2TemplateDeferred.resolve(view);
    };

    this.goToNextWizardStep = function(sectionItem, section, sections, productPrototype, product, reload, step) {
       
        var found = false,
            nextOption,
            nextIdx,
            nextItem,
            nextItemSection,
            expressionContext = { product: product },
            children;

        step = step || 1;

        function getChildren(section) {
            var requiredItems = [],
                optionalItems = [];

            _.each(section.children, function(item) {
                var prototypeProductOption = productPrototype.getPrototypeProductOption(item.prototypeProductOption.effectiveCode);
                if (prototypeProductOption) {
                    if (prototypeProductOption.isRequired)
                        requiredItems.push(item);
                    else
                        optionalItems.push(item);
                }
            });
            return requiredItems.concat(optionalItems);
        }

        children = getChildren(section);
        if (!sectionItem) {
            sectionItem = step>0 ? children[children.length - 1] : children[0];
        }
        while(!found) {
            
            nextIdx = children.indexOf(sectionItem) + step;
            var sectionIdx = sections.indexOf(section);
            var nextSectionIdx = sectionIdx + step;
            var nextSection = (nextSectionIdx < sections.length && nextSectionIdx>=0) ? sections[nextSectionIdx] : null;

            if ((nextIdx<0 || nextIdx >= children.length) && nextSection) {
                section = nextSection;
                nextSection = null;
                children = getChildren(section);
                nextIdx = step>0 ? 0 : children.length - 1;
            }

            if (nextIdx>=0 && nextIdx < children.length) {
                nextItem = children[nextIdx];
                var option = productPrototype.getPrototypeProductOption(nextItem.prototypeProductOption.effectiveCode);
                var optionValid = true;

                if (option) {
                    if (option.visibilityExpression) {
                        //check visibility
                        var visible = ProductService.evalExpression(option.visibilityExpression, product);
                        if (!visible) 
                            optionValid = false;
                    }
                    if (option.enabledExpression) {
                        //check enabled
                        var enabled = ProductService.evalExpression(option.enabledExpression, product);
                        if (!enabled) 
                            optionValid = false;
                    } 
                    if (option.skipExpression) {
                        //check skip expression
                        var shouldSkip = ProductService.evalExpression(option.skipExpression, product);
                        if (shouldSkip) 
                            optionValid = false;
                    } 
                } else {
                    optionValid = false;
                }

                if (optionValid) {
                    found = true;
                    nextOption = option;
                } else {
                    sectionItem = nextItem;
                }
            } else {
                found = true;
                nextOption = null;
            }
        }

        //console.log('nextOption', nextOption, nextItem);
        var stateOptions = {
            reload: reload
        };

        if (nextOption && (nextOption.isRequired || (nextOption.effectiveParams && nextOption.effectiveParams.forceVisit))  && 
            nextItem.type!=='BuildNumericOptionWidget' &&
            nextItem.type!=='BuildTextOptionWidget' &&
            nextItem.type!=='BuildBooleanOptionWidget') {

            $state.go('build.section.option', {
                section: section.url, 
                productId: product.id,
                optionUrl: nextItem.url,
                category: null,
                name: null,
                prototypeId: null
            }, stateOptions);
            return;
        }

        $state.go('build.section', {
            section: section.url, 
            productId: product.id,
            category: null,
            name: null,
            prototypeId: null
        }, stateOptions);
       
    };




    this.coverLayoutEquals = function(cl1, cl2) {
        if (!cl1 || !cl2) return false;
        
        if (!angular.equals(cl1.layoutSize, cl2.layoutSize)) return false;
        var elFn = function(element) {
            return _.pick(element, 'type', 'x', 'y', 'width', 'height', 'imageX', 'imageY', 'imageWidth', 'imageHeight');
        };
        var elms1 = _.map(cl1.spreads[0].elements, elFn),
            elms2 = _.map(cl2.spreads[0].elements, elFn);

        return angular.equals(elms1, elms2);
    };

    this.redirectToStamp = function(product, productPrototype, sections, event) {
        //redirect to stamp

        for(var prop in product.options) {
            var val = product.options[prop];

            if (val && (val.type==='TextStampElement' || val.type==='ImageStampElement')) {

                var option = productPrototype.getPrototypeProductOption(prop);
                var coverPage = option.effectiveParams ? option.effectiveParams.coverPage : null;

                if (coverPage!=='back') {
                    _.find(sections, function(section) {
                        var sectionItem = _.find(section.children, function(item) {
                            return (item.prototypeProductOption && item.prototypeProductOption.id === option.id);
                        });

                        if (sectionItem) {
                            $state.go('build.section.option', {
                                section: section.url,
                                optionUrl: sectionItem.url
                            });

                            $timeout(function() {
                                $rootScope.$broadcast('build:edit-stamp', {event:event});
                            }, 1000);
                            return true;
                        }
                    });
                    break;
                }
            }
        }
    };

    this.goToCoverBuilder = function(product, optionCode) {

        this.getSectionsByPrototypeId(product.prototypeId).then(
            function(sections) {

                var params = { 
                    productId: product.id,
                    section: 'details' 
                };

                _.each(sections, function(section) {
                    _.each(section.children, function(child) {
                        if (child.prototypeProductOption.effectiveCode===optionCode) {
                            params.section = section.url;

                            if (child.type!=='BuildNumericOptionWidget' &&
                                child.type!=='BuildTextOptionWidget' &&
                                child.type!=='BuildBooleanOptionWidget') {
                                params.optionUrl = child.url;
                            }
                        }
                    });
                });

                if (params.optionUrl) {
                    $state.go('build.section.option', params);
                } else {
                    $state.go('build.section', params);
                }

            }
        );

    };

}]);
