'use strict';

angular.module('pace.layout')
    .controller('FilmstripCtrl', ['$scope', 'StoreConfig', 'ImageUploadService', 'UploadEvent',
        'FilmStripItem', 'UndoService', 'ngDialog', '$timeout', 'TemplateService', 'KeyboardService', 'ImageFileStatus', '$state',
        'MessageService', 'IccProfile', 'ImageFile', '$rootScope', 'IconSet', 'AuthService', 'LoginEvent',
        function ($scope, StoreConfig, ImageUploadService, UploadEvent,
            FilmStripItem, UndoService, ngDialog, $timeout, TemplateService, KeyboardService, ImageFileStatus, $state,
            MessageService, IccProfile, ImageFile, $rootScope, IconSet, AuthService, LoginEvent) {

            var settings = {
                shouldStackItemsAfterDrop: false
            };

            $scope.autoFill = true;
            $scope.numSelectedItems = 0;
            $scope.showInfo = false;
            $scope.uploadStats = {
                numUploads: 0,
                numTotalUploads: 0,
                totalProgress: 0
            };

            var editable = true;
            this.setEditable = function(val) {
                editable = val;
            };

            var showPagesInFileInfo = true;
            this.setShowPagesInFileInfo = function(val) {
                showPagesInFileInfo = val;
            }

//--------------------------------------------------------------------------
//-----------------------  MISC HELPER FUNCTIONS ---------------------------
//--------------------------------------------------------------------------

            function showFileInfo(item) {
                if (ngDialog.latestID) {
                    var el = $('#'+ ngDialog.latestID);
                    if (el.length>0) {
                        ngDialog.close(ngDialog.latestID);
                        return;
                    }
                }
                var items = item ? [item] : getSelectedItems();
                if (items.length===0) return;

                var scope = $rootScope.$new();
                scope.items = items;
                scope.deleteFn = $scope.deleteItems;
                scope.replaceFn = $scope.uploadAndReplaceFilmstripItem;
                scope.layoutController = $scope.layoutController;
                scope.editable = editable;
                scope.showPagesInFileInfo = showPagesInFileInfo;
                scope.isSpreadBased = $scope.productPrototype.productPageType==='SpreadBased';

                ngDialog.open({
                    template: 'views/layout/imageInfo.html',
                    scope: scope,
                    className: 'pace-modal pace-modal-dark',
                    showClose: false,
                    closeByDocument: false,
                    closeByEscape: false,
                    controller: 'ImageInfoCtrl'
                });
            }

            function updateFilmstripVersion() {
                var filmstrip = $scope.layout.filmStrip;
                filmstrip._version = (filmstrip._version || 0) + 1;
            }

            function sortFilmStrip() {
                var cmd = new PACE.SortFilmstripCommand($scope.layout.filmStrip.items, $scope.layout.viewState.filmstripFilter);
                cmd.execute();
                updateFilmstripVersion();
            }

            function getSelectedItems() {
                var selection = _.where($scope.layout.filmStrip.items, {active:true});
                return selection;
            }

            function selectAll(select) {
                _.each($scope.layout.filmStrip.items, function(item) {
                    item.active = select;
                });
                updateFilmstripVersion();
            }

            function selectNone() {
                selectAll(false);
                $scope.rangeSelectionMode = false;
            }

            function selectRange() {
                $scope.rangeSelectionMode = !$scope.rangeSelectionMode;   
                updateFilmstripVersion();
            }

            function isItemStacked(item) {
                return (!!item.stackId);
            }

//--------------------------------------------------------------------------
//-------------------------- UPLOAD & REPLACE ------------------------------
//--------------------------------------------------------------------------

            function createFilmStripItem(imageFile) {
                var filmStripItem = {
                    _id: _.uniqueId('filmstrip-item-') + _.now(),
                    type:'FilmStripImageItem',
                    image:imageFile
                };

                updateOnImageFileUploaded(imageFile);
                $scope.layout.filmStrip.items.push(filmStripItem);
            }

            function updateUploadStats() {
                var numUploads = 0,
                    currentProgress = 0,
                    numUploadsInProgress = 0,
                    uploadStatuses = [ImageFileStatus.New,
                        ImageFileStatus.Preflighted,
                        ImageFileStatus.UploadInProgress];

                _.each($scope.layout.filmStrip.items, function(item) {
                    if (_.contains(uploadStatuses, item.image.status))
                        numUploads++;
                    if (item.image.status===ImageFileStatus.UploadInProgress && item.image.progress>0) {
                        currentProgress += item.image.progress;
                        numUploadsInProgress++;
                    }
                });

                if (numUploads===0) {
                    $scope.uploadStats.numTotalUploads = 0;
                }

                currentProgress = currentProgress / 101;
                if (isNaN(currentProgress)) currentProgress = 0;

                $scope.uploadStats.numUploads = numUploads;
                $scope.uploadStats.numTotalUploads = Math.max($scope.uploadStats.numTotalUploads, numUploads);

                if ($scope.uploadStats.numTotalUploads===0)
                    $scope.uploadStats.totalProgress = 0;
                else {
                    var progress = (($scope.uploadStats.numTotalUploads - numUploads) + currentProgress ) / $scope.uploadStats.numTotalUploads ;

                    $scope.uploadStats.totalProgress = progress * 100;
                }

                //console.log('totalProgress', currentProgress, $scope.uploadStats.numUploads, $scope.uploadStats.numTotalUploads, $scope.uploadStats.totalProgress);
            }

            function updateOnImageFileUploaded(imageFile) {
                imageFile.promise.then(
                    function(value) {
                        //console.log('file ' + value.filename + ' complete');
                        $scope.$apply(updateUploadStats);
                    },
                    function(error) {
                        //console.error(imageFile.filename, error);
                        $scope.$apply(updateUploadStats);
                    },
                    function(event) {
                        if(event.type === UploadEvent.ImageFileSaved) {
                            $scope.layoutController.fireEvent('layout:layout-changed');
                            $scope.layoutController.fireEvent('layout:filmstrip-changed');
                        }
                        $scope.$apply(updateUploadStats);
                    }
                );
            }

            function replaceImage(imageFile, filmstripItemToReplace) {
                updateOnImageFileUploaded(imageFile);

                var cmd = new PACE.ReplaceFilmstripItemCommand(
                    imageFile, filmstripItemToReplace, $scope.layout, $scope.coverLayouts, $scope.layoutController);
                UndoService.pushUndo(cmd);
                cmd.execute();
            }

            function showResolveNamesConflictsDialog(files, conflictIndices) {
                var objToArr = function(obj) {
                    var arr = [];
                    for(var i = 0; i < obj.length; i += 1) {
                        arr.push(obj[i]);
                    }
                    return arr;
                };

                var dialogScope = $scope.$new();
                dialogScope.files = objToArr(files);
                dialogScope.conflictIndices = conflictIndices;
                dialogScope.uploadFiles = uploadFiles;

                ngDialog.open({
                    template: 'views/layout/namesConflictDialog.html',
                    scope: dialogScope,
                    controller: 'NameConflictCtrl',
                    className: 'pace-modal pace-modal-dark pace-modal-wide names-conflict-modal'
                });
            }

            function getNameConflictIndices(files) {
                var conflicts = [];

                for(var i = 0; i < files.length; i += 1) {
                    var name = files[i].name,
                        duplicate = _.find($scope.layout.filmStrip.items, function(item) {
                            if(item.type === 'FilmStripImageItem') {
                                return item.image && item.image.filename === name;
                            } else {
                                return false;
                            }
                        });
                    if (duplicate) {
                        conflicts.push(i);
                    }
                }

                return conflicts;
            }

            function uploadFiles(files) {

                var imageFiles = ImageUploadService.uploadImages(files);

                for (var i = 0; i < imageFiles.length; i++) {
                    var imageFile = imageFiles[i];
                    if(imageFile.replace) {
                        var duplicate = _.find($scope.layout.filmStrip.items, function(item) {
                            return item.type === 'FilmStripImageItem' &&
                                    imageFile.filename === item.image.filename;
                        });
                        if(duplicate) {
                            replaceImage(imageFile, duplicate);
                        }
                    } else {
                        createFilmStripItem(imageFiles[i]);
                    }
                }

                if (!$scope.layout.viewState.filmstripFilter || $scope.layout.viewState.filmstripFilter==='bySize') {
                    $scope.layout.viewState.filmstripFilter = 'alphabetical';
                }

                sortFilmStrip();
                updateUploadStats();
            }

            $scope.toggleInfo = function() {
                $scope.showInfo = !$scope.showInfo;
            };

            $scope.cancelUpload = function() {
                $scope.layout.filmStrip.items = _.filter($scope.layout.filmStrip.items,
                    function(item) {
                        return item.image.status===ImageFileStatus.Uploaded;
                    });
                ImageUploadService.cancelAllUploads();
            };

            function onlineCheck() {
                if (!$scope.autoSaver.isOnline()) {
                    MessageService.ok('Please note you cannot upload images when offline. Please reconnect to the internet.');
                    return false;
                }
                return true;
            }

            $scope.openFileDialog = function() {
                if (!onlineCheck()) return;

                var dialog = angular.element('<input type="file" multiple />');

                dialog.change(function(e) {
                    $scope.$apply(function(scope) {
                        //console.log(e.delegateTarget.files);
                        $scope.uploadFiles(e.delegateTarget.files);
                    });
                });

                dialog.click();
            };

            $scope.uploadFiles = function(files) {
                if (!$scope.editable) return;
                if (!onlineCheck()) return;

                var conflicts = getNameConflictIndices(files);
                if(conflicts.length === 0) {
                    uploadFiles(files);
                } else {
                    showResolveNamesConflictsDialog(files, conflicts);
                }
            };

            $scope.uploadAndReplaceFilmstripItem = function(item) {
                if (!onlineCheck()) return;
                var dialog = angular.element('<input type="file" />');

                dialog.change(function(e) {
                    _.each(e.delegateTarget.files, function(file) {
                        $scope.replaceItem(item, file);
                    });
                });

                dialog.click();
            };

            $scope.replaceItem = function(oldItem, file) {
                var imageFiles = ImageUploadService.uploadImages([file]);
                replaceImage(imageFiles[0], oldItem);
            };

//--------------------------------------------------------------------------
//--------------------------- STACKING & DPS -------------------------------
//--------------------------------------------------------------------------

            function stackImages() {
                if (!$scope.editable) return;

                var items = getSelectedItems();
                if (items && items.length > 1) {
                    if (_.some(items, isItemStacked)) {
                        new PACE.UnstackFilmstripItemsCommand(
                            $scope.layout.filmStrip.items,
                            items).execute();
                        $scope.itemsStacked = false;
                    } else {
                        (new PACE.StackFilmstripItemsCommand($scope.layout.filmStrip, items)).execute();
                        (new PACE.CollapseStackCommand(items)).execute();
                        $scope.itemsStacked = true;
                    }
                    updateFilmstripVersion();
                    $scope.layoutController.fireEvent('layout:layout-changed');
                    $scope.layoutController.fireEvent('layout:filmstrip-changed');

                    if (items[0].occurrences.length>0) {

                        var occur =_.find(items[0].occurrences, function(val) {
                                return val.spread.applyAutoFill;
                            }) || items[0].occurrences[0];

                        var spread = occur.spread,
                            r = _.findWhere($scope.layoutController.renderers, {spread:spread});

                        if (r) r.makeFirstVisible();

                    }
                }
            }

            function makeDoubleSpread() {
                if (!$scope.editable) return;
                var items = getSelectedItems();

                if (_.some(items, isItemStacked)) return;

                var isDoubleSpread = _.some(items, function(item) { return !!item.isDoubleSpread; });
                (new PACE.MakeDoubleSpreadCommand(items, !isDoubleSpread)).execute();

                updateFilmstripVersion();
                $scope.layoutController.fireEvent('layout:layout-changed');
                $scope.layoutController.fireEvent('layout:filmstrip-changed');
            }

            $scope.stackImages = stackImages;
            $scope.group = stackImages;
            $scope.ungroup = stackImages;
            $scope.dps = makeDoubleSpread;

            $scope.canGroup = function() {
                var items = getSelectedItems();
                return items.length>1 && !(_.some(items, isItemStacked));
            };

            $scope.canDps = function() {
                var items = getSelectedItems();
                if (_.some(items, isItemStacked)) return false;

                var isDoubleSpread = _.some(items, function(item) { return !!item.isDoubleSpread; });

                var dps = _.pluck(items, 'isDoubleSpread');
                _.each(items, function(item) {
                    item.isDoubleSpread = !isDoubleSpread;
                });
                (new PACE.FixFilmstripCommand($scope.filmstripModel.autoArrangeOption, $scope.layout)).execute();
                var dps2 = _.pluck(items, 'isDoubleSpread');

                _.each(items, function(item, i) {
                    item.isDoubleSpread = dps[i];
                });

                return _.every(dps2, function(val) { return val===!isDoubleSpread; });

            };

            $scope.canUngroup = function() {
                return (_.some(getSelectedItems(), isItemStacked));
            };

//--------------------------------------------------------------------------
//----------------------- DELETION, FILTERING ETC --------------------------
//--------------------------------------------------------------------------
            $scope.$on('layout:filmstrip-items-dropped', function () {
                if (settings.shouldStackItemsAfterDrop) {
                    stackImages();
                }
            });

            $scope.$on('layout:layout-loaded', function() {
                if (!$scope.editable)
                    $scope.showInfo = true;

                sortFilmStrip();
            });

            $scope.onFileInfoClick = function(item) {
                showFileInfo(item);
            };

            $scope.onSelectionChange = function() {
                var items = getSelectedItems();
                $scope.itemsStacked = _.every(items, isItemStacked);
                $scope.numSelectedItems = items.length;
                $scope.$apply();
            };

            $scope.delete = function() {
                if (!$scope.editable) return;

                $scope.deleteItems(getSelectedItems());
            };

            $scope.canDelete = function() {
                var items = getSelectedItems();
                return items.length>0;
            };

            function deleteItems(items) {
                var cmd = new PACE.RemoveFilmstripItemsCommand(
                        $scope.layout.filmStrip.items,
                        $scope.layout,
                        items);
                UndoService.pushUndo(cmd);
                cmd.execute();
                updateFilmstripVersion();
                $scope.layoutController.renderAll();
                $scope.layoutController.fireEvent('layout:layout-changed');
                $scope.layoutController.fireEvent('layout:filmstrip-changed');

                if (ngDialog.latestID) {
                    var el = $('#' + ngDialog.latestID);
                    if (el.length > 0) {
                        ngDialog.close(ngDialog.latestID);
                    }
                }
            }

            $scope.deleteItems = function(items) {
                if(items.length===0) return;

                MessageService.ask('Do you really want to delete the selected image' + (items.length>1 ? 's' : '') + '?', 'alert', [
                    {
                        label: 'Yes',
                        callback: function() {
                            deleteItems(items);
                        }
                    },
                    { label: 'No' }
                ]);
            };

            $scope.onFilterChange = function() {
                if ($scope.isAdmin) {
                    $scope.layout.adminViewState = $scope.layout.adminViewState || {};
                    $scope.layout.adminViewState.filmstripFilter = $scope.layout.viewState.filmstripFilter;
                }

                var cmd = new PACE.SortFilmstripCommand($scope.layout.filmStrip.items, $scope.layout.viewState.filmstripFilter);
                cmd.execute();
                updateFilmstripVersion();
                $scope.layoutController.fireEvent('layout:layout-changed');
                $scope.layoutController.fireEvent('layout:filmstrip-changed');
            };

//--------------------------------------------------------------------------
//---------------------------- AUTO ARRANGE --------------------------------
//--------------------------------------------------------------------------
            $scope.autoArrange = function() {
                var ctrl = $scope.layoutController;

                if (ctrl.selectedElements.length>0) {
                    ctrl.clearSelection();
                    ctrl.currentRenderer.clearSelection();
                    ctrl.currentRenderer.render();
                }
                var cmd = new PACE.AutoArrangeCommand($scope.filmstripModel.autoArrangeOption, $scope.layout, ctrl);
                cmd.execute();
                UndoService.pushUndo(cmd);
                ctrl.renderAllWithAnimationDelayed();
            };

            $scope.autoArrangeOptionChanged = function() {

                function doStuff() {
                    $scope.layout.autoFillEnabled = $scope.filmstripModel.autoArrangeOption!=='clear';
                    $scope.autoArrange();
                }

                var numElements = _.reduce($scope.layout.spreads, function(count, spread) {
                        return count + spread.elements.length;
                    }, 0);

                if (numElements>0 && $scope.filmstripModel.autoArrangeOption==='clear') {
                    MessageService.confirm('You are about to reset all your pages, and will lose all of your designs. Do you wish to continue?',
                        doStuff,
                        function() {
                            $scope.filmstripModel.autoArrangeOption = IconSet['auto-arrange'][$scope.layout.autoFillVariant].value;
                        }
                    );
                    return;
                }

                if (numElements>0 && $scope.filmstripModel.autoArrangeOption!=='clear') {

                    var variant = _.findWhere(IconSet['auto-arrange'], {value:$scope.filmstripModel.autoArrangeOption});

                    MessageService.confirm('You are about to perform a ' + variant.iconText + ' auto fill. This will cause the designs on your pages to change. Do you wish to continue?',
                        doStuff,
                        function() {
                            $scope.filmstripModel.autoArrangeOption='clear';
                        }
                    );
                    return;
                }

                doStuff();

            };

            $scope.toggleAutoArrange = function() {
                $scope.layout.autoFillEnabled = !$scope.layout.autoFillEnabled;
                $scope.layoutController.fireEvent('layout:layout-changed');
            };

            $scope.$on('layout:filmstrip-changed', function(event, args) {
                // Bug 1746 - turn off dynamic auto fill until we fix it
                // if ($scope.layout.autoFillEnabled && $scope.filmstripModel.autoArrangeOption!=='clear') {
                //     $scope.autoArrange();
                // }
                if ($scope.filmstripModel.autoArrangeOption) {
                    (new PACE.FixFilmstripCommand($scope.filmstripModel.autoArrangeOption, $scope.layout)).execute();
                }

            });

//--------------------------------------------------------------------------
//-------------------------- KEYBOARD HANDLERS -----------------------------
//--------------------------------------------------------------------------

            $scope.onKeyDown = function(e) {
                var shortcut = KeyboardService.getShortcut(e);
                if (shortcut==='CTRL+A') {
                    selectAll(true);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                } else if (shortcut==='CTRL+D') {
                    selectAll(false);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                } else if (shortcut==='G' || shortcut==='CTRL+ALT+SHIFT+G') {
                    stackImages();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                } else if (shortcut==='D') {
                    makeDoubleSpread();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                } else if (shortcut==='DELETE' || shortcut==='BACKSPACE' || shortcut==='SPACE') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            };

            $scope.onKeyUp = function(e) {
                switch(KeyboardService.getShortcut(e)) {
                    case 'DELETE':
                    case 'BACKSPACE':
                        $scope.delete();
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        break;
                    case 'SPACE':
                        showFileInfo();
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        break;
                }
            };

//--------------------------------------------------------------------------
//---------------------------- CONTEXT MENU --------------------------------
//--------------------------------------------------------------------------

            function download(url, filename) {
                var link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            $scope.downloadRgb = function() {
                var items = getSelectedItems(),
                    image = items[0].image;

                var url = PACE.StoreConfig.imageUrlPrefix + 'original/' + image.url;
                download(url, image.filename);
            };

            $scope.downloadCmyk = function() {
                var items = getSelectedItems(),
                    image = items[0].image;
                if (!image.targetIccProfile) {
                    MessageService.ok('This image hasn\'t been converted to CMYK yet');
                    return;
                }
                var url = PACE.StoreConfig.imageUrlPrefix + image.targetIccProfile.code + '/' + image.url;
                download(url, image.filename);

            };

            $scope.onFilmstripMenuClick = function(key) {
                $scope[key]();
            };

            function getImageIds(items) {
                var ids = _.compact(
                    _.map(items, function(item) { return item.image ? item.image.id : null; })
                );
                return ids;
            }

            function regenerate(iccProfileId) {
                ImageFile.regenerate({ids:getImageIds(getSelectedItems()), iccProfileId: iccProfileId});
            }

            function regenerateDefault() {
                ImageFile.regenerate({ids:getImageIds(getSelectedItems()), productId: $scope.product.id});
            }

            function regenerateAllDefault() {
                ImageFile.regenerate({ids:getImageIds($scope.layout.filmStrip.items), productId: $scope.product.id});
            }

            function createMenuOptionsFilmstripItems() {
                $scope.regenerateDefault = regenerateDefault;
                $scope.regenerateAllDefault = regenerateAllDefault;
                IccProfile.query(function(response) {;
                    _.each(response, function(profile) {
                        $scope['regenerateIccProfile' + profile.id] = regenerate.bind(null, profile.id);
                    });
                    
                    var profiles = [];
                    profiles.push("regenerateAllDefault: { name: 'Regenerate All - System Defaults' }");
                    profiles.push("regenerateDefault: { name: 'Regenerate Selected - System Defaults' }");

                    profiles.push("sep2: '-------'");

                    var bwProfiles = _.sortBy(_.filter(response, function(profile) {
                        return profile.label.indexOf('BW')===0 && 
                            StoreConfig.adminDesigner && 
                            StoreConfig.adminDesigner.iccProfiles &&
                            StoreConfig.adminDesigner.iccProfiles.indexOf(profile.code)>=0;
                    }), 'label');

                    var colorProfiles = _.sortBy(_.filter(response, function(profile) {
                        return profile.label.indexOf('BW')===-1 && 
                            StoreConfig.adminDesigner && 
                            StoreConfig.adminDesigner.iccProfiles &&
                            StoreConfig.adminDesigner.iccProfiles.indexOf(profile.code)>=0;
                    }), 'label');


                    profiles = profiles.concat(
                        _.map(bwProfiles, function(profile) {
                            return 'regenerateIccProfile' + profile.id + ": { name: 'Black & White - " + profile.label.replace('BW ','') + "' }";
                        })
                    );
                    profiles.push("sep3: '-------'");
                    profiles = profiles.concat(
                        _.map(colorProfiles, function(profile) {
                            return 'regenerateIccProfile' + profile.id + ": { name: 'Colour - " + profile.label + "' }";
                        })
                    );

                    var contextMenu = [
                        "delete:{ name:'Delete', visible:canDelete()}",
                        "group:{name:'Group', visible:canGroup()}",
                        "ungroup:{name:'Ungroup', visible:canUngroup()}",
                        "dps:{name:'Double Page Spread', visible:canDps()}",
                        "sep1: '---------'",
                        "download:{ name:'Download', visible:isAdmin && numSelectedItems==1, items:{'downloadRgb':{name:'RGB'}, 'downloadCmyk':{name:'CMYK'}} }",
                        "iccProfiles: { name: 'Regenerate ICC Profile', visible: isAdmin, items:{" + profiles.join(',') + "} }"];

                    $scope.contextMenu = '{' + contextMenu.join(', ') + '}';
                });
            }

            $scope.$on(LoginEvent.LoginSuccess, function() {

                createMenuOptionsFilmstripItems();

            });

//--------------------------------------------------------------------------
//---------------------------- INITIAL SETUP -------------------------------
//--------------------------------------------------------------------------

            //check if files have been chosen in the dashboard
            if (ImageUploadService.filesToBeUploaded && ImageUploadService.filesToBeUploaded.length>0) {
                $scope.uploadFiles(ImageUploadService.filesToBeUploaded);
                ImageUploadService.filesToBeUploaded = null;
            }

            // calling in order to have the filmstrip initially sorted/ordered
            // if (!$state.is('layout.arrange')) {
            //     sortFilmStrip();
            // }

            $scope.selectAll = selectAll.bind(null, true);
            $scope.selectNone = selectNone;
            $scope.selectRange = selectRange;

        }])

    .controller('NameConflictCtrl', ['$scope', '_', function($scope, _) {
        var getNextConflict = function() {
            return $scope.files[$scope.conflictIndices.pop()];
        };

        var goToNextConflict = function() {
            var nextConflict = getNextConflict();
            if(nextConflict) { // display next conflict
                $scope.currentFile = nextConflict;
                return false;
            } else { // dismiss dialog
                uploadOnDismiss();
                // returning true, so dialog'll be dismissed
                return true;
            }
        };

        var uploadOnDismiss = function() {
            // upload selected files
            var files = _.filter($scope.files, function(file) {
                return !file.skip;
            });
            $scope.uploadFiles(files);
        };

        $scope.currentFile = getNextConflict();

        // REPLACE - download new files and remove old ones
        $scope.replace = function() {
            $scope.currentFile.replace = true;
            if($scope.applyToAll) {
                _.each($scope.conflictIndices, function(index) {
                    $scope.files[index].replace = true;
                });
                uploadOnDismiss();
                return true;
            } else {
                return goToNextConflict();
            }
        };

        // STOP the upload process
        $scope.stop = function() {
            return true;
        };

        // DON'T REPLACE
        $scope.dontReplace = function() {
            $scope.currentFile.skip = true;
            if($scope.applyToAll) {
                _.each($scope.conflictIndices, function(index) {
                    $scope.files[index].skip = true;
                });
                // upload files
                uploadOnDismiss();
                // returning true, so dialog'll be dismissed
                return true;
            } else {
                return goToNextConflict();
            }
        };
    }])

    .filter('countFilmstripItems', ['_', function() {
        return function(items) {
            return _.reduce(items, function(count, item) {
                return item.type === 'FilmStripImageItem' ? count + 1 : count;
            }, 0);
        };
    }])

    .filter('countUsedFilmstripItems', ['_', function(_) {
        return function(items) {

            var usedItems =  _.reduce(items, function(count, item) {
                if(item.type === 'FilmStripImageItem' && item.occurrences) {
                    return item.occurrences.length > 0 ? count + 1 : count;
                } else {
                    return count;
                }
            }, 0);

            return items.length - usedItems;
        };
    }]);
