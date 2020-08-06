'use strict';

angular.module('paceApp')
.factory('ProductAutoSaveService', ['ProductPrototype', '$debounce', 'MessageService', 'AuthService', 
    function ProductAutoSaveService(ProductPrototype, $debounce, MessageService, AuthService) {

        var ProductAutoSaver = function($scope, onSave, onDirty, onError) {
            
            var product,
                productPrototype,
                watcher,
                prevOptions,
                lastSavePromise,
                layoutSizeOptionCode,
                enabled = true,
                savingEnabled = true,
                isSaving = false,
                isDirty,
                destroyed = false,
                autoSaverID,
                sizeDetection = true,
                pagesDetection = true,
                linkingDetection = true;

            this.setSizeDetection = function(val) { sizeDetection = val; };

            this.setPagesDetection = function(val) { pagesDetection = val; };

            this.setLinkingDetection = function(val) { linkingDetection = val; };

            this.setEnabled = function(val) {
                enabled = val;
                //console.debug('Auto saver enabled', enabled);
            };

            this.setProduct = function(prod, prototype) {
                product = prod;
                productPrototype = prototype;
                var layoutSizeOption = productPrototype.getOptionWithAssociatedEntity('layoutSize') || {};
                layoutSizeOptionCode = layoutSizeOption.effectiveCode;
                prevOptions = null;
            };

            this.isDirty = function() {
                return isDirty;
            };

            this.isSaving = function() {
                return isSaving;
            };

            this.save = function() {
                if (isSaving) return lastSavePromise;
                save();
                return lastSavePromise;
            };

            this.setDirty = function() {
                isDirty = true;
                saveDebounced();
                if (onDirty) onDirty(product);
            };

            function save() {
                if (!savingEnabled || isSaving || !product) return;
                
                var saveCmd = new PACE.SaveProductCommand(product);

                if (product.id) {
                    isSaving = true;

                    console.debug('ProductAutoSaver: saving', autoSaverID);
                    lastSavePromise = saveCmd.execute();
                    lastSavePromise.then(function() {
                        if (destroyed) return;
                        lastSavePromise = null;
                        isDirty = false;
                        isSaving = false;
                        if (onSave) onSave(product);
                    }, function(error) {
                        if (destroyed) return;
                        lastSavePromise = null;
                        isDirty = false;
                        isSaving = false;
                        if (onError) onError(error);
                    });
                }
            }

           
            var saveDebounced = $debounce(save, 500);

            function getOptionsSnapshot(product) {
                var snapshot = {};
                for(var key in product.options) {
                    var val = product.options[key];
                    snapshot[key] = _.isObject(val) ? _.omit(angular.copy(val), 'id', 'version', '_id') : val;
                }

                snapshot.productNumber = product.productNumber;
                snapshot.linkLayout = product.linkLayout;
                snapshot.layoutId = product.layoutId;
                snapshot.childIndex = product.childIndex;
                return snapshot;
            }

            function getSnapshot(product) {
                var result = [ getOptionsSnapshot(product) ];
                _.each(product.children, function(child) {
                    result.push(getOptionsSnapshot(child));
                });
                return result;
            }

            var changeWatcherEnabled = true;
            
            watcher = $scope.$watch(function() {
                if (!enabled || !product || !productPrototype || !changeWatcherEnabled) return;

                if (!prevOptions) {
                    prevOptions = getSnapshot(product);
                } else {
                    var options = getSnapshot(product);
                    if (!angular.equals(options, prevOptions)) {

                        //console.log('options changed', options, prevOptions);
                        var doSave = function() {
                            isDirty = true;
                            saveDebounced();
                            if (onDirty) onDirty(product);
                            console.debug('ProductAutoSaver: isDirty', autoSaverID);
                        };

                        if (linkingDetection) {
                            for (var i = 0; i < product.children.length; i++) {
                                var prevValue = prevOptions[i+1] ? prevOptions[i+1].linkLayout : true,
                                    newValue = product.children[i].linkLayout,
                                    childIndex = i;

                                if (product.layoutId && prevValue!==newValue) {

                                    savingEnabled = false;
                                    changeWatcherEnabled = false;

                                    var dupName = productPrototype.duplicateDisplayName,
                                        bookName = productPrototype.singularDisplayName || 
                                            (productPrototype.productPageType==='PageBased' ? 'book' : 'album');


                                    var msg = newValue ?
                                        'You are about to re-link this '+dupName+' to the main '+bookName+'. Any differences in the layout designs will now be reset to match the main '+bookName+'. In addition, any future design changes will now be synced between all copies. Do you want to proceed?'
                                        : 'You are about to unlink the layouts from the main '+bookName+' to this '+dupName+'. Any future design changes made in the main '+bookName+' will not show up in this '+dupName+'. Do you want to proceed?';
                                    
                                    if (product.children[i].coverLayoutId) {
                                        msg = newValue ? 'You are about to re-link this '+dupName+' to the main '+bookName+'. Any differences in the layout designs including the cover design will now be reset to match the main '+bookName+'. In addition, any future design changes will now be synced between all copies. Do you want to proceed?'
                                        : 'You are about to unlink the layouts and cover design from the main '+bookName+' to this '+dupName+'. Any future design changes made in the main '+bookName+' will not show up in this '+dupName+'. Do you want to proceed?'
                                    }

                                    MessageService.confirm(msg,
                                        function() {
                                            savingEnabled = true;
                                            changeWatcherEnabled = true;
                                            //apply the changes
                                            doSave();
                                        },
                                        function() {
                                            savingEnabled = true;
                                            changeWatcherEnabled = true;
                                            prevOptions = null;
                                            product.children[childIndex].linkLayout = prevValue;
                                            doSave();
                                        }
                                    );
                                    prevOptions = options;
                                    return;
                                }
      
                            }
                        }

                        

                        var oldPageCount = prevOptions[0]._pageCount,
                            oldLayoutSize = prevOptions[0][layoutSizeOptionCode];


                        if (sizeDetection && product.layoutId && oldLayoutSize && oldLayoutSize!==product.options[layoutSizeOptionCode]) {
                            savingEnabled = false;
                            var oldOptions = angular.copy(prevOptions[0]),
                                newOptions = angular.copy(options[0]);

                            console.log('size changes', oldLayoutSize, product.options[layoutSizeOptionCode])

                            //revert the changes
                            _.extend(product.options, oldOptions);
                            changeWatcherEnabled = false;
                            MessageService.confirm('You are attempting to change the size of your book. This will cause all your layouts to move and you will have to fix them. Do you wish to continue?',
                                function() {
                                    savingEnabled = true;
                                    changeWatcherEnabled = true;
                                    //apply the changes
                                    _.extend(product.options, newOptions);
                                    doSave();
                                },
                                function() {
                                    savingEnabled = true;
                                    changeWatcherEnabled = true;
                                    prevOptions = null;
                                    doSave();
                                }
                            );
                            prevOptions = options;
                            return;
                        }

                        //check if user is going to delete pages
                        if (pagesDetection && product.layoutId && oldPageCount>product.options._pageCount) {
                            savingEnabled = false;
                            var oldOptions = angular.copy(prevOptions[0]),
                                newOptions = angular.copy(options[0]);
                            var changedOption = '_pageCount';
                            _.each(prevOptions[0], function(optVal, optCode) {
                                var currVal = product.options[optCode];
                                if (optVal!==currVal && optCode!=='_pageCount') {
                                    changedOption = optCode;
                                }
                            });

                            var msg = 'You are about to delete pages. Do you wish to continue?';
                            if (changedOption!=='_pageCount') {
                                var protoOption = productPrototype.getPrototypeProductOption(changedOption);
                                var oldVal = productPrototype.getPrototypeProductOptionValue(changedOption, oldOptions[changedOption]),
                                    newVal = productPrototype.getPrototypeProductOptionValue(changedOption, product.options[changedOption]);

                                if (oldVal && newVal) {
                                    var pages = (productPrototype.productPageType==='SpreadBased' ? ' spreads' : ' pages');
                                    msg = 'You are attempting to change from ' + oldVal.displayName +
                                        ' to ' + newVal.displayName + ' which only supports ' + product.options._pageCount + pages +
                                        '. All' + pages + ' after ' + product.options._pageCount + ' will be deleted. Do you wish to continue?'
                                }
                            }

                            //revert the changes
                            changeWatcherEnabled = false;
                            //_.extend(product.options, oldOptions);
                            MessageService.confirm(msg,
                                function() {
                                    savingEnabled = true;
                                    changeWatcherEnabled = true;
                                    //apply the changes
                                    _.extend(product.options, newOptions);
                                    doSave();
                                },
                                function() {
                                    _.extend(product.options, oldOptions);
                                    savingEnabled = true;
                                    changeWatcherEnabled = true;
                                    prevOptions = null;
                                    doSave();
                                }
                            );

                            prevOptions = options;
                            return;
                        }

                        doSave();

                    }
                    prevOptions = options;
                }

            });

            $scope.$on('$destroy', function() {
                if (isDirty) {
                    //console.debug('ProductAutoSaver '+autoSaverID +' being destroyed, saving...');
                    save();
                }
                destroyed = true;
                product = null;
                productPrototype = null;
                prevOptions = null;
                
                watcher();
                //console.debug('ProductAutoSaver destroy', autoSaverID);
            });

            autoSaverID = _.uniqueId('AutoSaver-');
            //console.debug('ProductAutoSaver created', autoSaverID);

        };

        return ProductAutoSaver;
    }]);