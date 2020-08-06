'use strict';

angular.module('paceApp')
	.factory('LayoutTemplate',
		['$resource', '_', '$cacheFactory',
			function($resource, _, $cacheFactory) {

                var cache = $cacheFactory('LayoutTemplateCache', { capacity: 1000 });

				var layoutTemplateUrl = apiUrl + 'api/layouttemplate',
					LayoutTemplate = $resource(
						layoutTemplateUrl + '/:id',
						{},
						{
							getSaved: {
								method: 'GET',
								url: layoutTemplateUrl + '/saved',
								isArray: true
							},
							getPublic: {
								method: 'GET',
								url: layoutTemplateUrl + '/public',
								isArray: true,
                                cache: cache
							},
							getPagePublic: {
								method: 'GET',
								url: layoutTemplateUrl + '/public/page',
								params: {
									size: '@size'
								},
								isArray: true,
                                cache: cache
							},
							getSpreadPublic: {
								method: 'GET',
								url: layoutTemplateUrl + '/public/spread',
								params: {
									lSize: '@lSize',
									rSize: '@rSize'
								},
								isArray: true,
                                cache: cache
							},
                            importTemplate: {
                                method: 'POST',
                                url: layoutTemplateUrl + '/import',
                            },

                            saveOrder: {
                                method: 'POST',
                                url: layoutTemplateUrl + '/order',
                            }
						}
					);

				LayoutTemplate.newLayoutTemplate = function(layoutTemplate) {
					var lt = new LayoutTemplate();

					_.each(_.keys(layoutTemplate), function(key) {
						if(key !== 'id') lt[key] = layoutTemplate[key];
					});
					lt.publicTemplate = false;
					
					return lt;
				};
                
                LayoutTemplate.equals = function (t1, t2) {
                    if (t1 === t2) return true;
                    if (_.isEmpty(t1) && _.isEmpty(t2)) return true;
                    if (_.isEmpty(t1) || _.isEmpty(t2)) return false;
                    
                    var pick = function (t) {
                        return _.pick(t, 'type', 'span', 'align',
                        	'target', 'desiredProportion', 'numEffectiveCells',
                            'rows', 'scheme', 'frames');
                    };
                    
                    return _.isEqual(pick(t1), pick(t2)) &&
                            LayoutTemplate.equals(t1.left, t2.left) &&
                            LayoutTemplate.equals(t1.right, t2.right);
                };

				return LayoutTemplate;
			}
		]
	);