'use strict';

angular.module('pace.layout')
    .constant('fillFramesSettings', {
        
    })

    /**
     * Service for filling the layout elements into frames.
     */
    .service('FillFramesService',
        ['fillFramesSettings',
        function (fillFramesSettings) {
            var framesBySize = function (frames) {
                    frames.sort(function (a, b) {
                        return a.width * a.height - b.width * b.height;
                    });

                    return frames;
                },
                
                elementsByRating = function (elements) {
                    elements.sort(function (a, b) {
                        if (a && b && a.imageFile && b.imageFile) {
                            return a.imageFile.rating - b.imageFile.rating;
                        }
                        return 0;
                    });
                    
                    return elements;
                },
                
                fillFrames = function (updateElement, frames, elements) {
                    _.each(_.zip(frames, elements), function (tpl) {
                        var f = tpl[0];
                        if (!_.isEmpty(f)) {
                            updateElement(tpl[1], f.x, f.y, f.width, f.height);
                        }
                    });
                };  
            
            /**
             * Sorts the 'frames' by size, then sorts the 'elements' by rating
             * finally inserts elements into frames in order by calling updateElement.
             */
            this.fillWithRatingBySize = function (updateElement, frames, elements) {
                if (frames.length === elements.length) {
                    // sort frames by size
                    frames = framesBySize(frames);
                    
                    // sort elements by rating
                    elements = elementsByRating(elements);
                    
                    fillFrames(updateElement, frames, elements);
                }
            };
            
            /**
             * Fills the elements into the frames in an order that they
             * are provided.
             */
            this.fillFrames = function (updateElement, frames, elements) {
                fillFrames(updateElement, frames, elements);
            };
        }]
    );