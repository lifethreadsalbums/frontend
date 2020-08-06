PACE.SaveProductCommand = function(product) {
	'use strict';

	var injector = angular.element('body').injector(),
        Product = injector.get('Product'),
        lastSavePromise;

    function makeSnapshot(product) {
        var result = new Product( angular.copy(_.pick(product, 'id', 'version', 'prototypeId', 'layoutId',
            'options', 'linkLayout', 'state', 'onHold', 'isReprint', 'productNumber', 'childIndex')) );
        _.each(result.options, function(option, key) {
            if (option && option.imageFile && !option.imageFile.id) {
                //prevent from saving images being uploaded
                delete option.imageFile;
            }
            if (option && option.type==='CameoSetElement') {
                _.each(option.shapes, function(shape) {
                    if (shape.imageFile && !shape.imageFile.id) {
                        delete shape.imageFile;
                    }
                });
            }
        });
        result.children = _.map(product.children, makeSnapshot);
        return result;
    }

	this.execute = function() {

        if (lastSavePromise) {
            lastSavePromise = lastSavePromise.then(this.execute.bind(this));
            return lastSavePromise;
        }

        console.debug('SaveProductCommand: saving product, id:' + product.id + ', v:' + product.version);

        //make current layout snapshot
        var productSnapshot = makeSnapshot(product);
        var _reprintPageCount = product.options._reprintPageCount;

        lastSavePromise = productSnapshot.$save(function(savedProduct) {

            _.extend(product, _.pick(savedProduct, 'id', 'version', 'subtotal', 'total', 'productPrices'));
            _.each(product.children, function(child, i) {
                _.extend(child, _.pick(savedProduct.children[i], 'id', 'version', 'subtotal', 'total', 'productPrices'));
            });
            _.each(product.options, function(option, key) {
                if (option && option.type) {
                    _.extend(option, _.pick(savedProduct.options[key], 'id', 'version'));
                }
            });
            product.options._reprintPageCount = _reprintPageCount;

            lastSavePromise = null;
            console.debug('SaveProductCommand: product saved', product);
        }, function(error) {
            console.error('SaveProductCommand: Error while saving product', productSnapshot, error);
            lastSavePromise = null;
        });

        return lastSavePromise;
    };

};