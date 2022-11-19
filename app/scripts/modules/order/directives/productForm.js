'use strict';

angular.module('pace.order')
.directive('productForm', [
        '$compile', '$http', '$templateCache', 'Product', 'ProductPrototype', '_', 'BuildService',
        '$timeout', '$parse', 'ProductPageType', 'AuthService', 'ProductService', '$animate', '$state', 'ProductFormService',
    function (
         $compile ,  $http ,  $templateCache ,  Product ,  ProductPrototype ,  _ ,  BuildService,
         $timeout ,  $parse ,  ProductPageType ,  AuthService ,  ProductService, $animate, $state, ProductFormService) {
        return {
            template: '<ng-form novalidate class="product-container"></ng-form>',
            restrict: 'E',
            replace:true,
            require:'form',
            scope: {
                product:'=product',
                readOnly:'=readOnly'
            },
            link: function postLink($scope, $element, $attrs, formController) {

                var model = $scope.model = {
                        product: $scope.product,
                        readOnly: $scope.readOnly,
                        currentUser: AuthService.getCurrentUser()
                    },
                    prototypeChanged = false,
                    productChanged = false,
                    lastFieldName,
                    firstTime = true;

                $scope.currentUser = AuthService.getCurrentUser();
                $scope.form = formController;

                var domCache = {},
                    optionCache = {};

                function expandCurrentSection() {
                    if (firstTime && $state.params.section) {
                        var formElement = angular.element("*[name=form_" + $state.params.section + "]"),
                        panel = formElement.closest('.ui-panel');
                        expandPanel(panel, true);
                        firstTime = false;
                    } else if ($state.params.prototypeId || $state.params.reprint) {
                        var panels = angular.element('.ui-panel');
                        expandPanel(panels.eq(0), true);
                    }
                }

                function postTemplateLoad() {

                    if (prototypeChanged) {
                        prototypeChanged = false;

                        var panels = angular.element('.ui-panel'),
                            firstPanel = panels.eq(1),
                            firstForm = firstPanel.find('ng-form'),
                            formName = firstForm.attr('name');

                        expandPanel(firstPanel, true);

                        //make first form dirty
                        formController[formName].$setDirty();
                        expandPanel(panels.eq(0), true);
                    }

                    expandCurrentSection();
                    if (model.product.onHold) {
                        var panels = angular.element('.ui-panel');
                        //expand last panel
                        expandPanel(panels.eq(0), true);
                    }

                    if (model.product.isReprint && !model.product.options._reprintPages) {
                        var formElement = angular.element("*[name=product__reprintPages]"),
                            panel = formElement.closest('.ui-panel');
                        expandPanel(panel, true);
                        formElement.focus();
                    }
                }

                function loadTemplate(url) {
                    var container = $element;

                    //$animate.enabled(false);

                    //remove nested form controllers
                    _.each(formController, function(field, name) {
                        if (typeof(field)==='object' && Object.getPrototypeOf(field)===Object.getPrototypeOf(formController)) {
                            //console.log('remove ctrl', name);
                            formController.$removeControl(field);
                        }
                    });

                    var cachedElement = domCache[url];
                    if (cachedElement) {

                        if (container[0].firstChild) {
                            container[0].removeChild(container[0].firstChild);
                        }

                        container.append(cachedElement);
                        //console.log('DOM from cache', url);

                         //add nested form controllers
                        container.find('ng-form').each(function() {
                            var formCtrl = $(this).controller('form');

                            if (formCtrl && formCtrl.$name) {
                                formController.$addControl(formCtrl);
                                //console.log('add ctrl', formCtrl.$name);
                            }
                        });

                        var scope = $(cachedElement).scope();
                        scope.$$nextSibling = null;
                        scope.$$prevSibling = null;

                        $scope.$$childHead = scope;
                        $scope.$$childTail = scope;

                        //console.log('cached scope', scope);

                        //clean up form controller errors
                        _.each(formController.$error, function(queue, validationToken) {
                            if (!queue) return;
                            _.each(queue.concat(), function(control) {
                                formController.$setValidity(validationToken, true, control);
                            });
                        });
                        formController.$setPristine();
                        model.product = $scope.product;

                        $timeout(postTemplateLoad);

                    } else {
                        $http.get(url, {cache: $templateCache}).success(function(response) {

                            var template = response,
                                element = angular.element(template),
                                scope = $scope.$new();

                            if (container[0].firstChild) {
                                container[0].removeChild(container[0].firstChild);
                            }

                            container.append(element);
                            $compile(element)(scope);
                            domCache[url] = element[0];

                            scope.$$nextSibling = null;
                            scope.$$prevSibling = null;

                            $scope.$$childHead = scope;
                            $scope.$$childTail = scope;

                            //clean up form controller errors
                            _.each(formController.$error, function(queue, validationToken) {
                                if (!queue) return;
                                _.each(queue.concat(), function(control) {
                                    formController.$setValidity(validationToken, true, control);
                                });
                            });
                            formController.$setPristine();

                            model.product = $scope.product;
                            //console.log('caching dom', scope);

                            $timeout(postTemplateLoad);

                        });
                    }

                    //collapse all panels

                    var idx = 0;
                    container.find('.panel-group > .ui-panel > .ui-panel-content').each(function() {
                        var panel = $(this),
                            panelScope = panel.scope();

                        if (idx>0 && panelScope && panelScope.panelCtrl) {
                            panelScope.panelCtrl.collapse();
                            panelScope.panelCtrl.setActive(false);
                            panel.addClass('collapsed');
                        }
                        idx++;
                    });

                    // var idx = 0;
                    // _.each(container.find('.panel-group > .ui-panel > .ui-panel-content'), function(el) {
                    //     var panel = $(el),
                    //         panelScope = panel.scope();

                    //     if (idx>0 && panelScope && panelScope.panelCtrl) {
                    //         panelScope.panelCtrl.collapse();
                    //         panelScope.panelCtrl.setActive(false);
                    //         panel.addClass('collapsed');
                    //     }
                    //     idx++;
                    // });

                }

                function getActiveForm() {
                    var panels = $element.find('.panel-group > .ui-panel.active-panel'),
                        firstPanel = panels.eq(0),
                        firstForm = firstPanel.find('ng-form'),
                        formName = firstForm.attr('name');
                    return formName;
                }

                formController.getActiveForm = getActiveForm;
                formController.getLastField = function() { return lastFieldName; };

                function expandForm(formController) {
                    var formElement = angular.element("*[name='" + formController.$name + "']"),
                        panel = formElement.closest('.ui-panel');
                    expandPanel(panel, true);
                }

                function expandPanel(panelContentElement, expand) {
                    var scope = panelContentElement.find('.ui-panel-content').scope();

                    if (scope && scope && scope.panelCtrl) {
                        var ctrl = scope.panelCtrl;
                        if (expand) {
                            var form = panelContentElement.find('ng-form');
                            $scope.model.currentForm = form.attr('name');
                            ctrl.expand();
                        } else
                            ctrl.collapse();
                    }
                }

                function setupProduct() {
                    if (!$scope.product)
                        return;

                    var onProductPrototypeLoaded = function(productPrototype) {
                        model.productPrototype = productPrototype;
                        createProductOptions();
                        productChanged = true;
                        //$($element[0].firstChild).fadeOut(0).fadeIn(500);
                    }

                    if ($scope.product.prototypeId) {
                        ProductPrototype.get({ id:$scope.product.prototypeId }, onProductPrototypeLoaded);
                    } else {
                        ProductPrototype.getDefault(onProductPrototypeLoaded);
                    }
                    model.isNew = !$scope.product.id;
                    lastFieldName = null;
                }

                function createProductOptions() {
                    var product = $scope.product;
                    var url = 'product-form-template-' + model.productPrototype.id;
                    if (product.isReprint) url += '-reprint';

                    ProductFormService.prepareProductFormTemplate(model.productPrototype, product.isReprint);

                    loadTemplate(url);
                    var cache = optionCache[url];

                    if (cache) {
                        model.productOptions = cache.productOptions;
                        model.productOptionValues = cache.productOptionValues;
                        //console.log('product options from cache');
                        return;
                    }

                    model.isReprint = !!product.isReprint;
                    model.productOptions = {};
                    model.productOptionValues = {};
                    product.prototypeId = model.productPrototype.id;

                    for (var i = 0; i < model.productPrototype.prototypeProductOptions.length; i++) {
                        var option = angular.copy(model.productPrototype.prototypeProductOptions[i]);
                        var code = option.effectiveCode;

                        model.productOptions[code] = option;
                        model.productOptionValues[code] = {};

                        angular.forEach(option.prototypeProductOptionValues, function(value, index) {
                        //hiding atmosphere and size 16x12 in the frontend as a quick fix
                        //to-do remove them from the backend
                        if(value.productOptionValue.code == "atmosphere" || value.productOptionValue.code == "16x12" || value.productOptionValue.code == "pearl" || value.productOptionValue.code == "velvet"){
                                option.prototypeProductOptionValues.splice(index, 1);
                        } else {
                            var childrenInfo = model.productPrototype.getPrototypeProductOptionValueChildren(code, value.productOptionValue.code);
                            if (childrenInfo)
                                value.children = childrenInfo.children;
                            model.productOptionValues[code][value.productOptionValue.code] = value.productOptionValue.displayName;
                            value.displayOrder = value.displayName;
                        }});

                        if (!option.isRequired) {
                            option.prototypeProductOptionValues.unshift({
                                code: null,
                                displayName: 'Please select',
                                displayOrder: 'AAAAAAAAAAAAAAAAAAAAA'
                            })
                        }
                    }

                    optionCache[url] = {
                        productOptions: model.productOptions,
                        productOptionValues: model.productOptionValues
                    };
                }

                function fillDefaultValues() {
                    var product = model.product;
                    ProductService.validateProduct(product, model.productPrototype);
                    ProductService.fillDefaultValues(product, model.productPrototype);
                    ProductService.validateProduct(product, model.productPrototype);
                }

                function getNestedFormControllers() {
                    var result = [];
                    angular.forEach(formController, function(field, name) {
                        if (typeof(field)==='object' && Object.getPrototypeOf(field)===Object.getPrototypeOf(formController)) {
                            result.push(field);
                        }
                    });
                    return result;
                }

                function checkForInvalidForms(currentForm, includePristineForms) {
                    if (!model.productPrototype || model.productPrototype.isDefault)
                        return;

                    var forms = getNestedFormControllers();

                    //find invalid subforms and expand them
                    angular.forEach(forms, function(form) {
                        if (form!==currentForm) {
                            if (!form.$valid && (!form.$pristine || includePristineForms)) {
                                var formElement = angular.element("*[name='" + form.$name + "']"),
                                    panel = formElement.closest('.ui-panel');
                                expandPanel(panel, true);

                                //add blurred class
                                formElement.find('.dropdown-button, input').addClass('ng-blurred');
                            }
                        }
                    });
                }

                function resetProduct() {
                    if (!model.product)
                        return;

                    //remove all options that don't exist in the prototype
                    for(var prop in model.product.options) {
                        var option = model.productPrototype.getPrototypeProductOption(prop);
                        if (!option && prop!=='_pageCount')
                            delete model.product.options[prop];
                    }
                }

                $scope.$watch('product', function(value) {
                    setupProduct();
                });

                $scope.$watch('readOnly', function(value) {
                    model.readOnly = value;
                });

                $scope.getOptionInfo = function(options, product) {
                    product = product || model.product;

                    if (!model.productOptions || !product || !model.productOptionValues || !model.productPrototype)
                        return '';
                    var res = [];
                    var productView = ProductService.getProductViewModel(product, model.productPrototype, true);
                    _.each(options, function(code) {
                        if (code==='_productNumber' && model.product.productNumber) {
                            res.push(product.productNumber);
                        }
                        var value = productView.options[code];
                        if (value) res.push(value);
                    });
                    return res.join(' <span class="spacer-bullet">•</span> ');
                };

                $scope.toggleOptionalAddon = function(code, enabled) {

                    var option = model.productPrototype.getPrototypeProductOption(code);
                    console.log('toggleOptionalAddon', option);
                    if (enabled) {
                        //$scope.$broadcast('option-enabled', code);
                        $timeout(function() {
                            $scope.$broadcast('option-enabled', code);
                        });

                    }

                    if (!enabled) {
                        model.product.options[code] = null;
                        formController.$setDirty();
                    } else if (option.systemAttribute==='StudioSample') {
                        //TODO: make it work for all boolean options
                        model.product.options[code] = true;
                        formController.$setDirty();
                    }
                };

                $scope.toggleOption = function(product, code) {
                    product.options[code] = !product.options[code];
                    formController.$setDirty();
                };

                $scope.isVisible = function(code) {
                    if (!model.productOptions[code]) return false;

                    if (model.productOptions[code].visibilityExpression) {
                        //check visibility
                        var getter = $parse(model.productOptions[code].visibilityExpression);
                        return getter(model);
                    }
                    return true;
                };

                $scope.changeProductPrototype = function() {
                    if (!model.product) return;

                    var productPrototypeCode = model.product.options._productPrototype;

                    //remember dirty form names
                    var nestedFormControllers = getNestedFormControllers();

                    //mark form as invalid while the new product prototype is being loaded
                    formController.$setValidity('required', false, nestedFormControllers[0]);

                    ProductPrototype.getByCode({code:productPrototypeCode}, function(productPrototype) {

                        var product = model.product;
                        product.prototypeId = productPrototype.id;

                        var pageCount = product.options._pageCount;
                        if (pageCount>0 && model.productPrototype.productPageType!==productPrototype.productPageType) {
                            if (productPrototype.productPageType==='SpreadBased') {
                                product.options._pageCount = (product.options._pageCount / 2) + 1;
                            } else {
                                product.options._pageCount *= 2;
                            }
                        }

                        model.productPrototype = productPrototype;
                        model.coverLayout = null;
                        prototypeChanged = true;
                        expandPanel(angular.element('.ui-panel').first(), false);
                        resetProduct();
                        createProductOptions();
                        fillDefaultValues();
                    });
                };

                $scope.onFieldChange = function(code) {

                    var fieldElement = angular.element("*[name='product_" + code + "']"),
                        fieldWrapper = fieldElement.closest('.form-element'),
                        formElement = fieldElement.closest('ng-form'),
                        formController = formElement.controller('form'),
                        skipAnnoyingAutoClose;

                    lastFieldName = fieldWrapper.attr('name');

                    if (code!=='_productPrototype') {
                        var panel = fieldElement.closest('.ui-panel');

                        //use timeout here to make sure we have a correct formController.$valid value

                        if (model.isNew) {
                            $timeout(function(){

                                if (formController.$valid) {
                                    //expandPanel(panel, false);

                                    do {
                                        var valid = false;
                                        var nextPanel = panel.next();
                                        if (nextPanel.length>0) {
                                            formElement = nextPanel.find('ng-form');
                                            formController = formElement.controller('form');
                                            valid = formController.$valid;
                                            expandPanel(nextPanel, true);
                                            panel = nextPanel;
                                        }
                                    } while(valid);

                                }
                            });
                        }
                        fillDefaultValues();
                    }

                    var productPrototypeCode = model.product.options._productPrototype;
                    //detect when user changes selection so that a product prototype field becomes unselected
                    //we need to load the default prototype in this case
                    if (!productPrototypeCode && model.productPrototype && !model.productPrototype.isDefault) {
                        model.product.prototypeId = null;
                        //reset product;
                        model.product.options = _.pick(model.product.options, code, '_name', '_dateCreated', '_quantity');
                        setupProduct();
                    }

                    $timeout(function() {
                        checkForInvalidForms(formController);
                    });

                };
            }
        };
}]);
