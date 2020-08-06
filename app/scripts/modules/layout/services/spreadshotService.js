'use strict';

angular.module('pace.layout')
.service('SpreadshotService', ['$rootScope', '$q', '$controller', 'FontEvent',
	function SpreadshotService($rootScope, $q, $controller, FontEvent) {

		var spreadInfoFactory = {
            create: function(spread, layout) {
                var spread = new PACE.Spread(spread, layout);
                spread.padding = 0;
                spread.pageClass = PACE.BookBleedPage;
                spread.pages[0].x = 0;
                return spread;
            }
        };

        if (!PACE.FontsLoaded) {
            $rootScope.$on(FontEvent.FontsLoaded, onFontsLoaded);
        }

        var cache = {},
            workers = {};

		function createWorker(spread, layout) {
			var canvas = document.createElement('canvas');
			var eventScope = $rootScope.$new(true);
			var el = $(canvas),
                scope =  {
                    spread: spread,
                    layout: layout,
                    layoutController: new PACE.LayoutController(eventScope)
                },
                attrs = {}; 

            var ctrl = $controller('SpreadController', 
                { 
                    $element: el, 
                    $scope: scope, 
                    $attrs: attrs 
                }
            );
            ctrl.scale = ctrl.canvas.scale = 1.0;
            ctrl.layout = layout;
            ctrl.spread = spread;
            ctrl.spreadInfoFactory = spreadInfoFactory;
            ctrl.element = el;
            ctrl.makePages();
            ctrl.render();

            return ctrl;
		}

		function destroy(ctrl) {
			if (ctrl.disposed) return;
			var el = ctrl.element;
			el.removeData();
			ctrl.dispose();
        }

        function onFontsLoaded() {
            _.each(workers, function(worker) {
                if (worker.element) {
                    worker.ctrl.render();
                }
            });
        }
		
		this.getSpreadshot = function(layout, spread, element) {
            var id = layout.id + spread._id + (element ? element._id : '');
			return cache[id];
		};

		this.makeSpreadshot = function(layout, spread, element) {
            var id = layout.id + spread._id + (element ? element._id : '');
            var worker = workers[id];
            if (worker) return worker.promise;
            
			var deferred = $q.defer();
        	 
			var firstTime = true;
        	var ctrl = createWorker(spread, layout);

			ctrl.canvas.on('before:render', function() {
                var ctx = ctrl.canvas.upperCanvasEl.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, ctrl.canvas.width, ctrl.canvas.height);
            });

			ctrl.canvas.on('after:render', function() {

				var numObjectsReady = 0;
                _.each(ctrl.canvas.getObjects(), function(object) {
                    if (object.type==='ImageElement')
                        numObjectsReady += object.loaded ? 1 : 0;
                    else if (object.type==='TextBoxElement' || object.type==='TextElement' || object.type==='SpineTextElement')
                        numObjectsReady += PACE.FontsLoaded ? 1 : 0;
                    else
                        numObjectsReady++;
                });
                if (firstTime && numObjectsReady>0 && numObjectsReady===ctrl.canvas.size()) {
                	firstTime = false;
                    var image = null;

                    if (element) {
                        var rect = new PACE.Element(element).getBoundingBox().toCanvasSpace(ctrl.canvas);
                        rect.inflate(10,10);
                        var tmpCanvas = document.createElement('canvas');
                        tmpCanvas.width = rect.width;
                        tmpCanvas.height = rect.height;
                        var tmpCtx = tmpCanvas.getContext('2d');
                        tmpCtx.drawImage(ctrl.canvas.lowerCanvasEl, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
                        image = tmpCanvas.toDataURL('image/png');
                    } else {
                        image = ctrl.canvas.toDataURL('image/png');
                    }
                    cache[id] = image;
                    delete workers[id];
                    deferred.resolve(image);

                    setTimeout(function() {
                    	destroy(ctrl);
                    	ctrl = null;
                    });
                }

			});

            worker = {
                ctrl: ctrl,
                element: element,
                promise: deferred.promise
            };
            workers[id] = worker;
			return worker.promise;
		};

	}
]);