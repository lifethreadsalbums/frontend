'use strict';

angular.module('pace.layout')
.controller('DesignerProoferCtrl', ['$scope', 'UndoService', 'AuthService', 'CommentTool', 'GeomService', 'ProoferService',
    'MessageService', 'ProoferLogoFile', 'ImageUploadService', 'UploadEvent', 'ImageFile', '$q', 'ImageFileStatus', '$timeout',
    'StoreConfig',
    function ($scope, UndoService, AuthService, CommentTool, GeomService, ProoferService,
        MessageService, ProoferLogoFile, ImageUploadService, UploadEvent, ImageFile, $q, ImageFileStatus, $timeout,
        StoreConfig) {

    	var layoutController = $scope.layoutController;

    	$scope.prooferComponentProps = {
            layoutController: layoutController,
            onEditClick: onSelectedEditChanged,
            onSelectedEditChanged: onSelectedEditChanged, 
            onApproveClick: onApproveAlbumClick,
            onFilterChanged: onFilterChanged
        };
        $scope.numPendingOnCurrentSpread = 0;
        
        ProoferService.onChange(onCommentChange);

//--------------------------------------------------------------------------
//------------------------------- PROOFER ----------------------------------
//--------------------------------------------------------------------------
        $scope.onProoferBadgeClick = function() {
            layoutController.fireEvent('proofer:unread-badge-clicked');
        };

        function onFilterChanged(filter) {
            
        }

        $scope.markCompleted = function() {
            if (layoutController.selectedElements.length===0) return;
            var comments = ProoferService.getComments();
            var spread = layoutController.currentRenderer.spread;
            for (var i = 0; i < layoutController.selectedElements.length; i++) {
                var el = layoutController.selectedElements[i];

                if (el.imageFile) {
                    var image = el.imageFile;
                    var edit = _.find(comments, function(c) {
                        return !c.completed && !c.isArchived &&
                            c.spreadId===spread._id &&
                            c.element && c.element.imageFile &&
                            c.element.imageFile.id===image.id;
                    });
                    if (edit) {
                        edit.completed = true;
                        ProoferService.saveComment(edit);
                    }
                }
            }
        };

        $scope.markAllCompleted = function() {
            var comments = ProoferService.getComments();
            var spread = layoutController.currentRenderer.spread;
            var edits = _.filter(comments, function(c) {
                return !c.completed && !c.isArchived &&
                    c.spreadId===spread._id;
            });
            _.each(edits, function(edit) {
                edit.completed = true;
                ProoferService.saveComment(edit);
            });
        };

        $scope.nextEdit = function() {
            layoutController.fireEvent('proofer:next-edit-clicked');
        };

        $scope.prevEdit = function() {
            layoutController.fireEvent('proofer:prev-edit-clicked');
        };

        $scope.toggleEdits = function(type) {
            $scope.model.toolbarEdits = type;
            layoutController.fireEvent('proofer:filter-clicked', type);
        };

        function onSelectedEditChanged(edit) {
            if (!edit) {
                // $scope.model.toolbarEdits = null;
                return;
            }

            var r = _.find($scope.layoutController.renderers, function(renderer) {
                return renderer.spread._id===edit.spreadId;
            });
            if (r) {
                $scope.layoutController.setCurrentRenderer(r);
                r.render();
                r.makeFirstVisible();
            }
        }

        function onCommentChange() {
            if (!$scope.layout.id) return;

            var user = AuthService.getCurrentUser();
            var n = ProoferService.getUnreadMessageCount(user);
            $scope.numUnreadMessages = n>0 ? n : null;

            var firstComment = $scope.numPending===0 && ProoferService.getNumPending()===1;
            var allCommentsCompleted = $scope.numPending>0 && ProoferService.getNumPending()===0 && ProoferService.getNumCompleted()>0;

            $scope.numPending = ProoferService.getNumPending();
            $scope.numCompleted = ProoferService.getNumCompleted();

            if (firstComment || ($scope.numPending>0 && !$scope.model.toolbarEdits)) {
                $scope.toggleEdits('pending');
            }

            if (allCommentsCompleted) {
                var msg = 'You have completed all change requests! ' + $scope.prooferSettings.firstName + 
                    ' has been notified at ' + $scope.prooferSettings.email;
                $scope.toggleEdits('completed');
                MessageService.show(msg);
            }
            if (!$scope.$$phase) $scope.$apply();

            //refresh spreads 
            var comments = ProoferService.getComments();
            _.each(comments, function(c) {
            	var r = _.find(layoutController.renderers, function(r) { return r.spread._id===c.spreadId; });
            	if (r) r.render();
            });
            if (layoutController.currentRenderer) layoutController.currentRenderer.render();
            updateUI();
        }

        function updateUI() {
            if (!layoutController.currentRenderer) return;
            var comments = ProoferService.getComments();
            var spread = layoutController.currentRenderer.spread;
            var edits = _.filter(comments, function(c) {
                return !c.completed && !c.isArchived && c.spreadId===spread._id;
            });
            $scope.numPendingOnCurrentSpread = edits.length;
        }

        function onApproveAlbumClick() {
            var msg = $scope.prooferSettings.approved ? 'Do you really want to unapprove this album? Doing so will allow your client to make change requests again. Do you want to continue?' :
                'Do you really want to approve this project? Doing so will lock it off for your client. Do you want to continue?';

            var doStuff = function() {
                var fn = $scope.prooferSettings.approved ? 'unapprove' : 'approve';
                $scope.prooferSettings.product = $scope.product;
                ProoferService[fn]($scope.prooferSettings).then(function(result) {
                    _.extend($scope.prooferSettings, result);
                    $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
                    if (!$scope.prooferSettings.approved) {
                        var msg = 'This album has been reopened for commenting. An email has been sent out to '
                            + $scope.prooferSettings.firstName + '’s email: ' + $scope.prooferSettings.email + '.';
                        $timeout(function() { MessageService.show(msg); }, 500);
                    }
                });
            };

            MessageService.confirm(msg, function() {
                $scope.autoSaver.saveNow().then(doStuff);
            });
        }

        $scope.$on('layout:current-renderer-changed', updateUI);

// -------------------------------------------------------------------------
//----------------------------- PROOFER SETTINGS ---------------------------
//--------------------------------------------------------------------------

        $scope.$on('layout:layout-loaded', function(e) {
            if (e.targetScope!==$scope) return;

            $scope.prooferUrl = StoreConfig.prooferUrl + '#/proof/' + $scope.product.id;
            $scope.publicUrl = StoreConfig.prooferUrl + '#/preview/' + $scope.product.id;
            $scope.prooferOverviewVisible = !!StoreConfig.prooferOverviewUrl;

            var settingsPromise = ProoferService.getSettings($scope.product).then(function(result) {
                $scope.prooferSettings = result;
                $scope.prooferComponentProps.prooferSettings = $scope.prooferSettings;
                $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
                if (result.id) {
                    $scope.prooferSettings.confirmEmail = result.email;
                    $scope.prooferSettings.confirmPassword = result.password;
                }
                return result;        
            });
            $scope.logoFiles = ProoferLogoFile.getMyLogos();

            $q.all([settingsPromise, $scope.logoFiles.$promise]).then(function(result) {
                if (result[0].logo) {
                    $scope.selectedLogoFile = _.findWhere($scope.logoFiles, {id:result[0].logo.id});
                } 
            });
        });

        $scope.prooferSettingsVisible = false;

        $scope.toggleProoferSettings = function(show) {
            $scope.prooferSettingsVisible = show;
            $scope.model.prooferSettingsPage = 'client';
        };

        $scope.closeProoferSettings = function(form) {
            if (form.$valid) $scope.toggleProoferSettings(false);
        };

        $scope.openProoferOverview = function(e) {
            e.preventDefault();
            window.open(StoreConfig.prooferOverviewUrl, '_blank');
        };

        // Send to client
        $scope.prooferSettings = {};

        function saveSettings() {
            var settings = $scope.prooferSettings;

            settings.product = $scope.product;
            settings.logo = $scope.selectedLogoFile;
            
            var promise = ProoferService.saveSettings(settings)
                .then(function(result) {
                    //console.log('settings saved', result);
                    _.extend($scope.prooferSettings, result);
                    return result;
                }, function(error) {
                    MessageService.error(error.data.error);
                });
            return promise;
        }

        $scope.saveProoferSettingsForm = function(form) {
            if (form.$valid && form.$dirty) {
                saveSettings();
            }
        };

        $scope.sendToClient = function() {
            //check if the album is empty
            var numElements = _.reduce($scope.layout.spreads, function(memo, spread) {
                return memo + spread.elements.length;
            }, 0);
            if (numElements===0) {
                MessageService.ok('Please design your pages first in order to be able to send a draft to your client.');
                return;
            }

            var doStuff = function() {
                var settings = $scope.prooferSettings;
                settings.product = $scope.product;

                ProoferService.publish(settings)
                    .then(function(result) {
                        _.extend($scope.prooferSettings, result);
                        var msg = 'Your draft has been sent to ' + result.firstName + '’s email: ' + result.email + '.';
                        $timeout(function() { MessageService.show(msg); }, 500);
                    });
            };
            MessageService.confirm('Do you want to send this album draft to your client?', doStuff);
        };

        $scope.resetSettings = function(e) {
            e.preventDefault();
            $scope.prooferSettings.email = '';
            $scope.prooferSettings.confirmEmail = '';
            $scope.prooferSettings.firstName = '';
            $scope.prooferSettings.lastName = '';
            $scope.prooferSettings.password = '';
            $scope.prooferSettings.confirmPassword = '';
            $scope.prooferSettings.published = false;
        };

        $scope.copyToClipboard = function(id, e) {
            e.preventDefault();
            var el = document.getElementById(id);
            el.select();
            document.execCommand("Copy");
        };

        // Company logo
        $scope.logoFiles = [];
        $scope.selectedLogoFile = null;

        $scope.clearLogoImage = function() {
            $scope.selectedLogoFile = null;
        };

        $scope.selectLogo = function(file) {
            $scope.selectedLogoFile = file;
            saveSettings();
        };

        $scope.removeLogo = function(e, file) {
            e.stopImmediatePropagation();

            MessageService.confirm('Do you really want to delete your company logo?', function() {
                var idx = $scope.logoFiles.indexOf(file);

                if (idx === -1) {
                    file = _.findWhere($scope.logoFiles, {id: file.id});
                    idx = $scope.logoFiles.indexOf(file);
                }

                if (idx >= 0) {
                    $scope.logoFiles.splice(idx, 1);

                    if ($scope.selectedLogoFile && ($scope.selectedLogoFile.id === file.id || $scope.selectedLogoFile == file)) {
                        $scope.selectedLogoFile = null;
                    }

                    if (file.id) {
                        ImageFile.delete({id: file.id},
                            function() {},
                            function(err) {
                                if (err.data && err.data.type === 'org.springframework.dao.DataIntegrityViolationException') {
                                    MessageService.error('You cannot delete this file because it is associated with another project.');
                                    if (idx >= 0) {
                                        $scope.logoFiles[idx] = file;
                                    }
                                }
                            });
                    }
                    saveSettings();
                }
            });
        };

        $scope.handleLogoUpload = function(files) {
            var imageFiles = ImageUploadService.uploadImages(files);

            for (var i = 0; i < imageFiles.length; i++) {
                imageFiles[i].type = 'ProoferLogoFile';
                processLogoImage(imageFiles[i]);
            }
        };

        function processLogoImage(image) {
            image.firstUse = true;

            $scope.logoFiles.push(image);

            image.promise.then(function(value) {
                //console.log('file ' + value.filename + ' complete');
            }, function(err) {
                processFailedLogoImage(image);
                MessageService.error(err.error);
            }, function(event) {
                if (event.type === UploadEvent.ImagePreflighted) {
                    if (image.status === ImageFileStatus.Rejected) {
                        MessageService.ok(image.errorMessage);
                        image.status = ImageFileStatus.Cancelled;
                        processFailedLogoImage(image);
                        return;
                    }

                    if (image.colorSpace === 'RGB') {
                        MessageService.ok('Your file is not on a transparent background. Please re-upload a correct file.');
                        image.status = ImageFileStatus.Cancelled;
                        processFailedLogoImage(image);
                        return;
                    }
                }
            });
        }

        function processFailedLogoImage(image) {
            var idx = $scope.logoFiles.indexOf(image);

            if (idx >= 0) {
                $scope.logoFiles.splice(idx, 1);
            }
        }
    }
]);