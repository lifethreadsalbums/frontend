/**
 * Service for queuing promises.
 * The queues are identified by 'id', so there might
 * be multiple queues.
 *
 * Because of optymistic locking at the backend, some
 * API calls should be queued.
 */
angular.module('pace.layout')
    .service('QueueRequestService', [
        '_',
        function(_) {
            'use strict';
            
            var queues = {},
                isRunning = [],
                
                processQueue = function (queue, id) {
                    // take first item from the queue
                    var f = queue.shift();
                    
                    if (_.isUndefined(f)) {
                        // we're done. no more items on the queue
                        isRunning = _.without(isRunning, id);
                        delete queues[id];
                    } else {
                        // process the item
                        var p = f();
                        p.then(function () {
                            // when resolved call processQueue
                            // in order to process next item
                            // from the queue
                            processQueue(queue, id); 
                        }, function() {
                            processQueue(queue, id);
                        });
                    }
                };
            
            /**
             * Adds the item to the queue identified by id.
             * Doesn't start processing.
             *
             * id string - id of the queue
             * fPromise - function of 0 arity, returning the promise
             */
            this.push = function (id, fPromise) {
                if (_.isUndefined(queues[id])) {
                    queues[id] = [];
                }

                queues[id].push(fPromise);
            };
            
            /**
             * Start processing queue of given id.
             * 
             * id string - id of the queue to run
             */
            this.run = function (id) {
                var q = queues[id];
                
                if (!_.isEmpty(q) && !_.contains(isRunning, id)) {
                    isRunning.push(id);
                    processQueue(q, id);                    
                }
            };
        }
    ]);