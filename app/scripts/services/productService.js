'use strict';

angular.module('paceApp')
.service('ProductService', ['ProductPrototype', '$parse', 'ProductPageType', '$cacheFactory', 'AuthService', 'AppConstants',
    function ProductService(ProductPrototype, $parse, ProductPageType, $cacheFactory, AuthService, AppConstants) {

    var productInfo = {},
        self = this,
        layoutSizeRatioTolerance = 0.01;

    var expressionCache = $cacheFactory('ExpressionCache');

    this.productTemplateCache = $cacheFactory('ProductTemplateCache');

    function cacheProductInfo(productPrototype) {
        if (productInfo[productPrototype.code]) return;
            
        var info = {
            productOptions: {},
            productOptionValues: {}
        };
                
        for (var i = 0; i < productPrototype.prototypeProductOptions.length; i++) {
            var option = productPrototype.prototypeProductOptions[i];
            var code = option.effectiveCode;
            info.productOptions[code] = option;
            info.productOptionValues[code] = {};

            _.each(option.prototypeProductOptionValues, function(value) {
                info.productOptionValues[code][value.code] = value;
            });

        };
        productInfo[productPrototype.code] = info;
    }

    function getOptionValue(product, productPrototype, code, skipChildren) {
        
        var visible = true,
            info = productInfo[productPrototype.code],
            values = info.productOptionValues[code],
            productValue = product.options[code],
            value = values ? values[productValue] : null,
            label = value ? value.displayName : productValue,
            result = {},
            option = info.productOptions[code];

        if (!option) return result;

        if (option.visibilityExpression) {
            //check visibility
            visible = self.evalExpression(option.visibilityExpression, product);
        }

        if (!(option.effectiveIncludeInBuild || option.effectiveIncludeInOrders)) {
            visible = false;
        } 

        result.required = option.isRequired && !option.includeInReprint;
        result.visible = visible;
        if (visible) {
            //TODO: introduce option label format or something like this
            if (productValue && code==='_pageCount') {
                if (product.isReprint) {
                    label = product.options._reprintPageCount || '0';
                }
                label = label + (productPrototype.productPageType===ProductPageType.PageBased ? ' pp' : ' sp');
            } else if (productValue===true) {
                //label = info.productOptions[code].effectiveDisplayLabel;
                label = option.effectiveParams && option.effectiveParams.yesNo ? 'Yes' : 'On'; 
            } else if (productValue===false) {
                label = option.effectiveParams && option.effectiveParams.yesNo ? 'No' : 'Off'; 
            } else if (productValue && productValue.type) {
                if (productValue.type==='CameoSetElement') {
                    label = 'Cameo';
                    var positionOptionCode = option.effectiveParams.cameoListOption,
                        positionOption = info.productOptions[positionOptionCode];
                        
                    if (positionOption) {
                        var positionValues = info.productOptionValues[positionOptionCode],
                            val = positionValues[productValue.positionCode];
                        if (val) label = val.displayName;
                    }                    
                } else if (productValue.type==='TextStampElement') {
                    label = productValue.text;
                } else if (productValue.type==='ImageStampElement') {
                    label = productValue.imageFile ? productValue.imageFile.filename : undefined;
                }
            } else if (code==='_dateCreated') {
                label = moment(productValue).format(AppConstants.DATE_FORMAT);
            } else if (productPrototype.productType==='SinglePrintProduct' && code==='printsSizes') {
                var sizeValues = info.productOptionValues.size;

                var sizes = _.map(product.children, function(child) {
                    var val = sizeValues[child.options.size];
                    return val ? val.displayName : null;
                });
                label = sizes.join(' • ');
            }
            if (!skipChildren && value && option.systemAttribute!=='ProductCategory') {
                var childInfo = productPrototype.getPrototypeProductOptionValueChildren(code, value.code);
                if (childInfo && childInfo.children.length>0) {
                    var childValue = getOptionValue(product, productPrototype, childInfo.option.effectiveCode);
                    label = label + (childValue.value ? ' • ' + childValue.value : '');
                }
            }
            result.value = label;
        }

        return result;
        
    }

    function fillProductViewModel(viewModel, product, productPrototype, skipChildren) {
        cacheProductInfo(productPrototype);
        var categoryOption = _.findWhere(productPrototype.prototypeProductOptions, { systemAttribute:'ProductCategory' }),
            prototypeOption = _.findWhere(productPrototype.prototypeProductOptions, { systemAttribute:'ProductPrototype' });
              
        viewModel.id = product.id;
        viewModel.prototypeId = product.prototypeId;
        viewModel.name = product.options._name;
        viewModel.categoryName = categoryOption ? getOptionValue(product, productPrototype, categoryOption.effectiveCode ) : null;
        viewModel.prototypeName = prototypeOption ? getOptionValue(product, productPrototype, prototypeOption.effectiveCode ) : null;
        viewModel.options = {};
        viewModel.errors = [];
        var numRequired = 0;
        _.each(product.options, function(value, code) {
            var val = getOptionValue(product, productPrototype, code, skipChildren);
            viewModel.options[code] = val.value;
            if (val.required && val.visible && !val.value && val.value!==false) {
                numRequired++;

                var info = productInfo[productPrototype.code],
                    optionInfo = info.productOptions[code];

                viewModel.errors.push(optionInfo);
            }
        });
        viewModel.numRequired = numRequired;
        var dupInfo = [];
        _.each(product.children, function(dup) {
            var dupView = self.getProductViewModel(dup, productPrototype);
            dupInfo.push('(' + dupView.options._quantity + ') ' + dupView.options.size);
        });
        viewModel.options._duplicates = dupInfo.join(' • ');
    }

    this.getProductViewModel = function (product, productPrototype, skipChildren) {
        var viewModel = {};
        
        if (productPrototype) {
            fillProductViewModel(viewModel, product, productPrototype, skipChildren);
        } else {
            var promise = ProductPrototype.get({id:product.prototypeId}).$promise;
            viewModel.$promise = promise.then(function(proto) {
                fillProductViewModel(viewModel, product, proto, skipChildren);
                return viewModel;
            });
        } 
        
        return viewModel;
    };

    this.fillDefaultValues = function(product, productPrototype) {
        var n = productPrototype.prototypeProductOptions.length;
        product.defaultValues = product.defaultValues || {};
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                var option = productPrototype.prototypeProductOptions[i],
                    code = option.effectiveCode,
                    currentValue = product.options[code];

                if (!currentValue && option.effectiveDefaultValue) {
                    var defaultValue = self.evalExpression(option.effectiveDefaultValue, product);
                
                    if (defaultValue || defaultValue===false) {
                        product.options[code] = defaultValue;
                        product.defaultValues[code] = true;
                    }
                } 

            }
        }
    };

    this.evalExpression = function(expression, product, context) {
        var productContext = {
                product: product,
                currentUser: AuthService.getCurrentUser(),
                storeConfig: PACE.StoreConfig 
            },
            getter = expressionCache.get(expression);
        if (context) {
            _.extend(productContext, context);
        }
        if (!getter) {
            try {
                getter = $parse(expression);
                expressionCache.put(expression, getter);
            } catch(error) {
                console.warn('Cannot parse expression ' + expression, error);
                return undefined;
            }
        }
        var value = getter(productContext);
        return value;
    };

    this.validateChild = function(child, parent, productPrototype) {
        this.validateProduct(child, productPrototype);

        //validate layoutSize
        /*
        var layoutSizeOption = productPrototype.getLayoutSizeOption();
        if (layoutSizeOption) {
            var code = layoutSizeOption.effectiveCode,
                childSizeVal = productPrototype.getPrototypeProductOptionValue(code, child.options[code]),
                parentSizeVal =  productPrototype.getPrototypeProductOptionValue(code, parent.options[code]);

            if (childSizeVal && parentSizeVal && 
                childSizeVal.code!==parentSizeVal.code) {
                var childLayoutSize = childSizeVal.layoutSize,
                    parentLayoutSize = parentSizeVal.layoutSize,
                    childRatio = childLayoutSize.width / childLayoutSize.height,
                    parentRatio = parentLayoutSize.width / parentLayoutSize.height,
                    diff = Math.abs(childRatio - parentRatio);

                if (diff>layoutSizeRatioTolerance) {
                    var layoutSizes = _.pluck(layoutSizeOption.prototypeProductOptionValues, 'layoutSize'),
                        childArea = childLayoutSize.width * childLayoutSize.height,
                        minAreaDiff = Number.MAX_VALUE,
                        layoutSizeVal;

                    _.each(layoutSizeOption.prototypeProductOptionValues, function(val) {
                        var ratio = val.layoutSize.width / val.layoutSize.height,
                            area = val.layoutSize.width * val.layoutSize.height,
                            areaDiff = Math.abs(childArea - area);
                        if (Math.abs(ratio - parentRatio)<=layoutSizeRatioTolerance && areaDiff<minAreaDiff) {
                            minAreaDiff = areaDiff;
                            layoutSizeVal = val;
                        }
                    });

                    if (layoutSizeVal) {
                        console.debug('fix duplicate size to ' + layoutSizeVal.code);
                        child.options[code] = layoutSizeVal.code;
                        
                        var valueParent = layoutSizeVal.parent,
                            optionParent = layoutSizeOption.parent;
                        while(valueParent) {
                            child.options[optionParent.effectiveCode] = valueParent.code;
                            var valueInfo = productPrototype.getPrototypeProductOptionValueInfo(optionParent.effectiveCode, valueParent.code);
                            valueParent = valueInfo.value.parent;
                        }

                    }
                }
            }
        }
        */
        //sync stamp text
        _.each(child.options, function(value, optionCode) {
            if (value && value.type==='TextStampElement') {
                var parentStamp = parent.options[optionCode];
                if (parentStamp.type===value.type && value.text!==parentStamp.text) {
                    //update duplicate stamp
                    var stamp = angular.copy(parentStamp);
                    delete stamp._id;
                    delete stamp.id;
                    delete stamp.version;
                    child.options[optionCode] = stamp;
                    console.debug('Update duplicate stamp.');
                }
            }
        });

        if (child.linkLayout) {
            child.options._pageCount = parent.options._pageCount;
        }

    };

    this.validateProduct = function(product, productPrototype) {

        _.each(product.options, function(value, optionCode) {

            if (value) {
                var option = productPrototype.getPrototypeProductOption(optionCode);
                if (!option) return;
                
                //TODO: solve the case with options visible for admin only - should we have another flag for admin only options?
                var optionVisible = true,
                    optionEnabled = true;
                if (option.visibilityExpression) {
                    optionVisible = self.evalExpression(option.visibilityExpression, product);
                }
                if (option.enabledExpression) {
                    optionEnabled = self.evalExpression(option.enabledExpression, product);
                }

                //if (!optionVisible || !optionEnabled) {
                if (!optionEnabled) {
                    product.options[optionCode] = null;
                    console.debug('Value '+value+' not allowed for option '+optionCode + ', option not visible');
                    return;
                }

                if (option.prototypeProductOptionValues && option.prototypeProductOptionValues.length>0) {
                    var valItem = _.find(option.prototypeProductOptionValues, function(item) {
                        if (item.code!==value) return false;

                        //check against parent
                        if (item.parent) {
                            var parentCode = option.parent.effectiveCode,
                                parentValueCode = item.parent.code,
                                productParentValue = product.options[parentCode];

                            if (parentValueCode!==productParentValue) return false;
                        }
                        
                        var visible = true;
                        if (item.visibilityExpression) {
                            visible = self.evalExpression(item.visibilityExpression, product);
                        }

                        if (visible) {
                            var childInfo = productPrototype.getPrototypeProductOptionValueChildren(option.effectiveCode, item.code);
                            if (childInfo && childInfo.children.length>0) {
                                var children = _.filter(childInfo.children, function(child) {
                                    var childVisible = true;
                                    if (child.visibilityExpression) 
                                        childVisible = self.evalExpression(child.visibilityExpression, product);
                                    return childVisible;
                                });
                                return children.length>0;
                            }
                        }

                        return visible;
                    });

                    if (!valItem) {
                        product.options[optionCode] = null;
                        console.debug('Value not allowed for option ' + optionCode, value);
                    }
                } else if (option.params) {
                    var valid = true,
                        params = option.params;
                    if (params.min) {
                        var min = self.evalExpression(params.min, product);
                        if (value<min) {
                            product.options[optionCode] = min;
                            valid = false;
                        }
                    }
                    if (params.max) {
                        var max = self.evalExpression(params.max, product);
                        if (value>max) {
                            product.options[optionCode] = max;
                            valid = false;
                        }
                    }
                    if (!valid) {
                        console.debug('Value not allowed for option '+optionCode, value);
                    }
                }
            }
        });

    };

    this.setProductOption = function(product, productPrototype, optionCode, value) {
        var option = productPrototype.getPrototypeProductOption(optionCode),
            params = option.effectiveParams;

        //reset dependent options
        if (params && params.dependencies) {
            _.each(params.dependencies, function(code) {
                if (product.defaultValues && product.defaultValues[code]) {
                    //console.log('Reset value', code);
                    product.options[code] = null;
                }
            });
        }

        product.options[optionCode] = value;
        product.defaultValues = product.defaultValues || {};
        product.defaultValues[optionCode] = false;
       
    };

    this.createDuplicate = function(product) {
        var promise = ProductPrototype.get({id:product.prototypeId}).$promise;

        return promise.then(function(productPrototype) {
            var dup = {
                parentId: product.id,
                prototypeId: product.prototypeId,
                layoutId: product.layoutId,
                linkLayout: true,
                state: product.state,
                options: angular.copy(product.options)
            };

            var n = productPrototype.prototypeProductOptions.length;
            for (var i = 0; i < n; i++) {
                var option = productPrototype.prototypeProductOptions[i],
                    code = option.effectiveCode,
                    currentValue = product.options[code],
                    optionEnabled = true;

                if (option.enabledExpression) {
                    optionEnabled = self.evalExpression(option.enabledExpression, dup);
                }

                if (optionEnabled && option.params && option.params.duplicateDefaultValue) {
                    var defaultValue = self.evalExpression(option.params.duplicateDefaultValue, dup);
                
                    if (defaultValue) {
                        dup.options[code] = defaultValue;
                    }
                } 
            }

            _.each(dup.options, function(option) {
                if (_.isObject(option)) {
                    delete option.id;
                    delete option.version;
                    delete option._id;
                    if (option.type==='CameoSetElement') {
                        _.each(option.shapes, function(shape) {
                            delete shape.id;
                            delete shape.version;
                            delete shape._id;
                        });
                    }
                }
            });

            dup.options._name = dup.options._name + '-' + (product.children.length + 2);
            dup.options._quantity = 1;

            self.validateProduct(dup, productPrototype);
            self.fillDefaultValues(dup, productPrototype);
            self.validateProduct(dup, productPrototype);

            return dup;
        });

    }

}]);