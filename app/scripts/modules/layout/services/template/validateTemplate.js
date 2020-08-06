'use strict';

angular.module('pace.layout')

    .constant('validateTemplateSettings', {
        rules: ['minFrameDim', 'proportion'],
        minFrameProportion: 0.15,
        minFrameDimension: 2 * 72,
        proportionTolerance: 0.75,
        mockLayoutSize: {
            width: 100,
            height: 100,
            bleedInside: 0,
            bleedOutside: 0,
            bleedTop: 0,
            bleedBottom: 0,
            marginInside: 0,
            marginOutside: 0,
            marginTop: 0,
            marginBottom: 0,
            pageOrientation: 'Horizontal'
        }
    })

    /**
     * Service for checking whether the template obeys the
     * set of rules.
     */
    .service('ValidateTemplateService', [
        '_', 'validateTemplateSettings', 'TemplateToFramesService', 'GeomService',
        function (_, validateTemplateSettings, TemplateToFramesService, GeomService) {
            var settings = validateTemplateSettings,
                
                getFrames = function (template, layoutSize) {
                    layoutSize = layoutSize || settings.mockLayoutSize;
                    return TemplateToFramesService.getFrames(
                        template,
                        layoutSize,
                        1, 2, 0
                    );
                },
                
                rules = {
                    // each frame is not smaller than settings.minFrameProportion w.r. to the target
                    minFrameProp: function (frames) {
                        return _.every(frames, function (frame) {
                            return frame.width / settings.mockLayoutSize.width >= settings.minFrameProportion &&
                                    frame.height / settings.mockLayoutSize.height >= settings.minFrameProportion;
                        });
                    },
                    
                    // each frame is not smaller than settings.minFrameDimension
                    minFrameDim: function (frames) {
                        return _.every(frames, function (f) {
                            return f.width >= settings.minFrameDimension &&
                                    f.height >= settings.minFrameDimension;
                        });
                    },
                    
                    // proportion of the template is close to the proportion of the target
                    proportion: function (frames, template, targetProp) {
                        return template.desiredProportion >= targetProp * settings.proportionTolerance;
                    },

                };
               
            /**
             * Checks whether given GridLayoutTemplate is correct.
             */
            this.validate = function (template, targetProp, layoutSize) {
                if (!template || template.type !== 'GridLayoutTemplate') {
                    throw new Error('ValidateTemplateService handles only GridLayoutTemplates');
                }
                
                var frames = getFrames(template, layoutSize);

                return _.every(settings.rules, function (rule) {
                    var result = rules[rule](frames, template, targetProp, layoutSize);
                    //console.debug('Validating template', rule, result);
                    return result;
                });
            };
        }
    ]);