PACE.SaveLayoutCommand = function(layout) {
	'use strict';

    var SNAPSHOT_INTERVAL = 2 * 60 * 1000; //2 minutes

	var injector = angular.element('body').injector(),
        Layout = injector.get('Layout'),
        LayoutSnapshot = injector.get('LayoutSnapshot'),
        lastSavePromise,
        that = this,
        numSavingErrors = 0,
        lastSnapshotTime = 0;

    var updateTree = function(oldEntity, newEntity, treeInfo, level) {
        level = level || 0;
        _.extend(oldEntity, _.pick(newEntity, 'id', 'version'));

        if (level<treeInfo.length) {
            var prop = treeInfo[level];
            _.each(newEntity[prop], function(item) {
                var oldItem = _.findWhere(oldEntity[prop], {_id:item._id});
                if (oldItem) {
                    updateTree(oldItem, item, treeInfo, level + 1);
                }
            });
        }
    };

    this.getLastSavePromise = function() {
        return lastSavePromise;
    };

	this.execute = function() {

        if (lastSavePromise) {
            console.log('queue saving layout');
            lastSavePromise = lastSavePromise.then(this.execute.bind(this));
            return;
        }

        console.log('saving layout');

        //assign spread's internal ID
        _.each(layout.spreads, function(spread) {
            if (!spread._id) spread._id = _.uniqueId('spread-');
        });

        //make current layout snapshot
        var layoutSnapshot = new Layout(angular.copy(layout));

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

        lastSavePromise = layoutSnapshot.$save(function(value) {
            
            updateTree(layout, value, ['spreads', 'elements']);
            if (layout.filmStrip) {
            	updateTree(layout.filmStrip, value.filmStrip, ['items']);
            }

            lastSavePromise = null;
            numSavingErrors = 0;
            console.log('layout saved');
        }, function(error) {
            console.log('Error while saving layout');
            lastSavePromise = null;
            
            if (error.data && error.data.type==='org.springframework.orm.ObjectOptimisticLockingFailureException') {
                if (numSavingErrors>=3) {
                    console.error('Cannot save layout');
                    return;
                }
                numSavingErrors++;

                console.log('Retrying to save again...' + numSavingErrors);

                var promise = Layout.get({id:layout.id}).$promise;
                lastSavePromise = promise.then(function(value) {
                    //delete all spread and elements IDs
                    //and save it again
                    _.each(layout.spreads, function(spread) {
                        delete spread.id;
                        delete spread.version;
                        _.each(spread.elements, function(el) {
                            delete el.id;
                            delete el.version;
                        });
                    });

                    _.each(layout.filmStrip.items, function(item) {
                        delete item.id;
                        delete item.version;
                    });
                    layout.version = value.version;
                    layout.filmStrip.version = value.filmStrip.version;

                    lastSavePromise = null;
                    that.execute(); 
                });
            }
        });

        //save snapshot
        if (Date.now() - lastSnapshotTime > SNAPSHOT_INTERVAL) {

            //console.log('Saving layout snapshot');
            var layoutCopy = angular.copy(layout);
            delete layoutCopy.recentlyUsedLayoutTemplates;
            delete layoutCopy.templatesHistory;
            delete layoutCopy.filmStrip;

            var currentSnapshot = new LayoutSnapshot({layoutId:layout.id, layout:layoutCopy});
            currentSnapshot.$save(function() {

                //console.log('Layout snapshot saved');
                lastSnapshotTime = Date.now();

            });
            
            lastSnapshotTime = Date.now();
        }

    };

};