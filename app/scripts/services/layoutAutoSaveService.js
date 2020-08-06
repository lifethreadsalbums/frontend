'use strict';

angular.module('paceApp')
.factory('LayoutAutoSaveService', ['ProductPrototype', '$debounce', 'MessageService', 'AuthService', 'Layout', 'LayoutSnapshot', '$q',
    function LayoutAutoSaveService(ProductPrototype, $debounce, MessageService, AuthService, Layout, LayoutSnapshot, $q) {

        return function($scope, onSave) {

            var SNAPSHOT_INTERVAL = 2 * 60 * 1000, //2 minutes,
                ONLINE_CHECK_INTERVAL = 30 * 1000,
                SAVE_INTERVAL = 1000; //1 sec

            var that = this,
                lastSnapshotTime = 0,
                lastSaveTime = 0,
                lastOnlineCheckTime = 0,
                intervalId = 0,
                isDirty = false,
                isSaving = false,
                isOnline = true,
                enabled = true,
                numOfflineSaves = 0,
                viewStateSaving = true,
                originalViewState = null,
                lastSavePromise = null,
                layouts = [];

            if ($scope) {
                $scope.savingStatus = 'Saved.';
            }

            function updateTree(oldEntity, newEntity, treeInfo, level) {
                level = level || 0;
                _.extend(oldEntity, _.pick(newEntity, 'id', 'version'));

                if (level<treeInfo.length) {
                    var prop = treeInfo[level];
                    _.each(newEntity[prop], function(item) {
                        var oldItem = _.findWhere(oldEntity[prop], {_id:item._id});
                        if (oldItem) {
                            updateTree(oldItem, item, treeInfo, level + 1);
                        } else {
                            console.debug('Cannot assign ID, item not found', item);
                        }
                    });
                }
            }

            function saveLayout(layout, deferred, numSavingErrors) {
                if (!deferred) deferred = $q.defer();
                numSavingErrors = numSavingErrors || 0;

                //assign internal IDs
                _.each(layout.spreads, function(spread) {
                    spread._id = spread._id || _.uniqueId('spread-') + _.now();
                    _.each(spread.elements, function(element) {
                        element._id = element._id || _.uniqueId('element-') + _.now();
                    });
                });

                //make current layout snapshot
                var layoutSnapshot = new Layout(angular.copy(layout));
                if (layoutSnapshot.viewState && !viewStateSaving) {
                    layoutSnapshot.viewState = originalViewState;
                }

                _.each(layoutSnapshot.spreads, function(spread) {
                    //filter out elements which have references to images not being saved yet
                    if (spread.elements) {

                        var isValid = function(val) { return _.isNumber(val) && !_.isNaN(val); };
                        spread.elements = _.filter(spread.elements, function(el) {

                            var imageFileValid = (el.imageFile && el.imageFile.id) || !el.imageFile;
                            var frameValid = _.every([el.x, el.y, el.width, el.height], isValid);
                            var imageFrameValid = true;
                            if (el.type==='ImageElement' && el.imageFile &&
                                !_.every([el.imageX, el.imageY, el.imageWidth, el.imageHeight], isValid) ) {

                                imageFrameValid = false;
                            }

                            return imageFileValid && frameValid && imageFrameValid;
                        });

                        spread.numLowResErrorsLeft = 0;
                        spread.numLowResErrorsRight = 0;
                        _.each(spread.elements, function(el) {
                            if (el.imageFile) {
                                el.imageFile = _.pick(el.imageFile, 'id', 'version', 'type');
                            }
                            if (_.some(el.errors, function(err) { return err.type==='LowResLayoutError'; })) {
                                var spreadInfo = PACE.Spread.create(spread, layoutSnapshot);
                                var page = spreadInfo.getPage(el);
                                if (page.isLeft()) spread.numLowResErrorsLeft++;
                                if (page.isRight()) spread.numLowResErrorsRight++;
                            }
                        });
                    }
                });

                //remove filmstrip items which have references to images not being saved yet
                if (layoutSnapshot.filmStrip) {
                    layoutSnapshot.filmStrip.items = _.filter(layoutSnapshot.filmStrip.items, function(filmstripItem) {
                        return (filmstripItem.image && filmstripItem.image.id) || !filmstripItem.image;
                    });

                    _.each(layoutSnapshot.filmStrip.items, function(item) {
                        if (item.image) {
                            item.image = _.pick(item.image, 'id', 'version', 'type');
                        }
                        delete item.occurrences;
                    });
                }

                layoutSnapshot.$save(function(value) {

                    updateTree(layout, value, ['spreads', 'elements']);
                    if (layout.filmStrip) {
                        updateTree(layout.filmStrip, value.filmStrip, ['items']);
                    }

                    deferred.resolve(layout);

                }, function(error) {
                    console.error('Error while saving layout', error);

                    var tryAgain = function() {
                        numSavingErrors++
                        //console.debug('Trying to save again...' + numSavingErrors);
                        saveLayout(layout, deferred, numSavingErrors);
                    }

                    if (numSavingErrors>=2) {
                        deferred.reject(error);
                        return;
                    }

                    if (error.data && error.data.type==='org.springframework.orm.ObjectOptimisticLockingFailureException') {

                        var promise = Layout.get({id:layout.id}).$promise;
                        promise.then(function(value) {
                            //recover from hibernate exception
                            //delete all spread and elements IDs
                            //and save it again
                            console.debug('Cleaning up and saving again...');
                            _.each(layout.spreads, function(spread) {
                                delete spread.id;
                                delete spread.version;
                                _.each(spread.elements, function(el) {
                                    delete el.id;
                                    delete el.version;
                                });
                            });

                            if (layout.filmStrip) {
                                _.each(layout.filmStrip.items, function(item) {
                                    delete item.id;
                                    delete item.version;
                                });
                                layout.filmStrip.version = value.filmStrip.version;
                            }
                            layout.version = value.version;
                            tryAgain();

                        }, function(error) {

                            tryAgain();

                        });

                    } else {
                        tryAgain();
                    }
                });

                return deferred.promise;
            }

            function saveSnapshot() {
                if (Date.now() - lastSnapshotTime > SNAPSHOT_INTERVAL) {

                    console.debug('LayoutAutoSaveService -> Saving layout snapshot');
                    var promises = _.map(layouts, function(layout) {
                        var layoutCopy = angular.copy(layout);
                        var currentSnapshot = new LayoutSnapshot({layoutId:layout.id, layout:layoutCopy});
                        return currentSnapshot.$save();
                    });
                    $q.all(promises).then(function() {
                        lastSnapshotTime = Date.now();
                    });
                }
            }

            function handleOfflineSavingError() {
                var msg = 'We cannot save to offline storage. Please reconnect to the internet and refresh your browser.';
                MessageService.ask(msg, 'alert', [{ label: 'Ok' }], true);
            }

            function saveOffline() {
                console.debug('LayoutAutoSaveService -> saving offline');
                try {
                    //throw new Error("simulate error");

                    _.each(layouts, function(layout) {
                        var json = JSON.stringify(layout);
                        var binaryString = pako.deflate(json, { to: 'string' });

                        localStorage.setItem('layout-' + layout.id, binaryString);
                        console.debug('LayoutAutoSaveService -> layout ID='+layout.id + ' saved to localStorage.');
                    });

                    numOfflineSaves++;
                    $scope.savingStatus = 'Saved offline.';
                } catch(error) {
                    handleOfflineSavingError();
                    console.error('LayoutAutoSaveService -> cannot save to localStorage.', error);
                }
            }

            function clearLocalStorage() {
                _.each(layouts, function(layout) {
                    localStorage.removeItem('layout-' + layout.id);
                });
            }

            function saveOnline() {
                console.debug('LayoutAutoSaveService -> saving');
                isSaving = true;
                var promises = _.map(layouts, function(layout) {
                    return saveLayout(layout);
                });

                lastSavePromise = $q.all(promises);
                lastSavePromise.then(onSaveSuccess, onSaveError);
            }

            function onSaveSuccess(values) {
                isSaving = false;
                isDirty = false;
                $scope.savingStatus = 'Saved.';
                lastSaveTime = Date.now();
                numOfflineSaves = 0;
                lastSavePromise = null;
                isOnline = true;
                clearLocalStorage();
                if (onSave) onSave(layouts);
                console.debug('LayoutAutoSaveService -> saved');
            }

            function onSaveError(error) {
                console.debug('LayoutAutoSaveService -> switching to offline mode');
                isSaving = false;
                saveOffline();
                isOnline = false;
                lastSavePromise = null;
            }

            function onInterval() {
                if (isDirty && !isSaving) {
                    //isDirty = false;

                    if (isOnline) {
                        saveOnline();
                        saveSnapshot();
                    } else {
                        saveOffline();
                        $scope.$apply();
                    }
                }

                if (!isOnline && numOfflineSaves>0 && (Date.now() - lastOnlineCheckTime > ONLINE_CHECK_INTERVAL)) {
                    //try to save to the server
                    console.debug('LayoutAutoSaveService -> trying to save online');
                    saveOnline();
                    lastOnlineCheckTime = Date.now();
                }
            }

            function onOffline(e) {
                isOnline = false;
                //console.debug('LayoutAutoSaveService -> offline event');
            }

            function onOnline(e) {
                isOnline = true;
                //console.debug('LayoutAutoSaveService -> online event');
            }

            this.isDirty = function() {
                return isDirty;
            };

            this.isSaving = function() {
                return isSaving;
            };

            this.isOnline = function() {
                return isOnline;
            };

            this.reset = function() {
                numOfflineSaves = 0;
                isSaving = false;
                isDirty = false;
                isOnline = true;
            };

            this.setEnabled = function(value) {
                clearInterval(intervalId);
                enabled = value;
                if (enabled) {
                    intervalId = setInterval(onInterval, SAVE_INTERVAL);
                }
                //console.debug('LayoutAutoSaveService -> ' + (enabled ? 'Enabled' : 'Disabled'));
            };

            this.setLayouts = function(value) {
                layouts = value;
                if (layouts.length>0 && layouts[0].viewState) {
                    originalViewState = angular.copy(layouts[0].viewState);
                } else {
                    originalViewState = null;
                }
                this.reset();
            };

            this.setDirty = function() {
                isDirty = true;
                $scope.savingStatus = 'Saving...';
                console.debug('LayoutAutoSaveService -> setDirty');
            };

            this.saveNow = function() {
                if (isSaving) return lastSavePromise;
                console.debug('LayoutAutoSaveService -> saveNow');

                var promises = _.map(layouts, function(l) {
                    saveLayout(l);
                });
                isSaving = true;
                lastSavePromise = $q.all(promises).then(onSaveSuccess, onSaveError);
                return lastSavePromise;
            };

            this.setViewStateSaving = function(value) {
                viewStateSaving = value;
            };

            this.destroy = function() {
                layouts = null;
                clearInterval(intervalId);
            };

            window.addEventListener('online', onOnline);
            window.addEventListener('offline', onOffline);

        };

    }
]);
