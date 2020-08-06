angular.module('pace.proofer')

.factory('CommentTool', ['$state', 'ProoferService', 'GeomService', 'CanvasHelper', 'NotificationService',
    function($state, ProoferService, GeomService, CanvasHelper, NotificationService) {

    	return function CommentTool(layoutController, user, exitWithEsc) {
    		var FILL_STYLE = 'rgba(119, 210, 246, 0.5)';
    		var STROKE_STYLE = '#0bc1f3';
    		var imageAddIcon = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAZCAYAAADNAiUZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExODA4M0U4QkY1MTRGNTBBQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4NUVGMjhFNkVEMUMxMUU3ODBDNUU0NEZGQjgwOTQyRiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4NUVGMjhFNUVEMUMxMUU3ODBDNUU0NEZGQjgwOTQyRiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDE4MDExNzQwNzIwNjgxMTgwODNFOEJGNTE0RjUwQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTgwODNFOEJGNTE0RjUwQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7jTEu+AAACzUlEQVR42rxWS2gTYRCe3W2ahOQQN2Wjhb4sPiJ6syB4qSe9eqkQqiF6kWqpiHdPJtAQKKiLIqJNJOCxoPXmwYNFPEgrQdHUGtI2yUIxNO/NPpy/bEPLts1m03bgy/472dnvn/nnsaCqKlWtVu/LspxRD0BEURQSicQjp9PJAYAFiCDhPfUQZGZm5iXSDRBiSpKkDE3TR+GAJZ/Pl1iW9ePyE90u4RsB4NKCCs8zKijq7s+5XC4HXs4gjnS0QxjLqfBsVdlYR7MAmB5wu5vey8SFsNEYbjCDaEYGPi2BIisNxFG3lw0K2RFtytPoKiGUdfpbPYwh+w5tB4ZlekUCPiXp9GN9HXD9GA1G3tcS6XS6Dk//1nX6O/0WuNHNgNF3GQ7v65QITxZrOv3dQSv4eywtRcuQp6+WavD4d1WnHz9hA3+vBVo9IrrZA1/W6iBKClzhGFAkuQHiYWDAaqrUmnr6VRDhWr8NumyYJFgW71dqMOF1QOC4tWUPG542q8eFNRHG5vIgVGTosdMwftIOgUGbqdo2nEip9Tr0Ohl4+6cM57s64QLX2XYfbhre2cvubfdmQ7otvDjaUnAIsry8XMYLaWMKPT8/HzHbf1tBOBz+iYRriDKFP+zU1NTE8PDwTRw/LPmS2GmnbrfbxjCM7j/yQkEQNoqYoihd7LPZbIXn+V+xWGwObz8iPlNaMnkQ5xCnybxD6Dr3yMhIXyQSuYqD2LFVXyqVJI7j3uEyjVjfYb8kpP8QxNPviBxVLBYBv18IsXNz3u3SNKxDQ0NncdcPvV7v4FZSj8fzApcfEIs72JGBSyKRRxQREhBSI9C8Z+12+8V4PD5bKBQU1Ku5XI5MgEktUvvTBjcFCTbCVKlUvvl8vgfBYHASicvaOSr72pG2AklUQoR2yVAoxI+Ojo4lk8kl7cxko6RUG6XHaDlwCkGS6wcpRyOG/wUYAFGA5TsJXqRLAAAAAElFTkSuQmCC') 0 16, default";

    		this.type = 'CommentTool';

    		layoutController.setSelectionEnabled(false);

			_.each(layoutController.renderers, function(renderer) {
				renderer.canvas.preventMouseDown = true;
			});

			function findTarget(renderer, e) {
		        //console.log('findTarget', e.e)
		        var mousePos = renderer.canvas.getPointer(e);
		        var objects = renderer.canvas.getObjects();
		        for (var i = objects.length - 1; i >= 0; i--) {
		            var object = objects[i],
		                m = object.getGlobalMatrix();
		            m.invert();
		            var localMousePos = m.transformPoint(mousePos.x, mousePos.y);

		            if ((object.element.type==='ImageElement' || object.element.type==='TextElement') && 
		            	localMousePos.x>=0 && localMousePos.y>=0 &&
		                localMousePos.x<=object.width && localMousePos.y<=object.height) {
		                return object;
		            }
		        }
		        return null;
		    }
		    var bubble, bubbleInput,
                bubbleSaveBtn,
                bubbleCancelBtn,
                bubbleTarget,
		    	currentComment,
		    	currentRenderer,
		    	prevDrawFn,
        		currentDrawFn,
        		currentTarget;

		    function destroyBubble() {
		    	bubble.remove();
		    	bubbleInput.off('keyup');
		    	bubbleInput.off('keydown');
                bubbleSaveBtn.off('click');
                bubbleCancelBtn.off('click');
                currentComment = null;
                currentRenderer = null;
                bubble = null;
		    }

		    function createBubble(renderer, event) {
		    	
		    	var target = findTarget(renderer, event),
            		element = target && target.element ? target.element : null,
            		spreadId = renderer.spread.spreadId || renderer.spread._id;

            	if (bubble) {
            		if (target!==bubbleTarget) 
		    			cancelBubble();
		    		else {
		    			setTimeout(function() { bubbleInput.focus(); });
		    			return;
		    		}
		    	}

            	if (!target) {
            		layoutController.fireEvent('proofer:spread-clicked', element);
            		return;
            	}

		    	bubble = $('<div class="proofer-bubble__canvas-container">'+
		    		'<div class="proofer-bubble proofer-bubble--left proofer-bubble--canvas">'+
		    		'<textarea placeholder="Enter your edits here..." class="proofer-bubble__textarea"></textarea>'+
		    		'<div class="proofer-bubble__save"><img src="/images/proofer/check-circle-gray.svg" class="proofer-bubble__save-icon"></img>Save Edit</div>'+
                    '<div class="proofer-bubble__cancel"><img src="/images/tour/tour-close-thin.png" class="proofer-bubble__cancel-image"></div>' +
                    '</div></div>');
		    	bubbleInput = bubble.find('textarea');
		    	bubbleInput.on('keyup', onBubbleInputChange);
		    	bubbleInput.on('keydown', onBubbleInputKeydown);

                bubbleSaveBtn = bubble.find('.proofer-bubble__save');
                bubbleSaveBtn.on('click', submitBubble);

                bubbleCancelBtn = bubble.find('.proofer-bubble__cancel');
                bubbleCancelBtn.on('click', cancelBubble);
                bubbleTarget = target;

		    	bubble.offset({left:event.pageX - 18, top:event.pageY - 118});
            	$('body').append(bubble);

            	setTimeout(function() { bubbleInput.focus(); });

            	currentRenderer = renderer;

            	currentComment = {
                    text: '',
                    user: user,
                    spreadId: spreadId,
                    elementId: element ? element._id : null,
                    layout: _.pick(renderer.layout, 'id', 'version'),
                    replies: [],
                    dateCreated: (new Date()).toISOString()
                };

                var comments = ProoferService.getComments();
                var parent = _.find(comments, function(c) {
                	if (element) {
                		return c.element && c.element.id === element.id;
                	} else {
                		return !c.element;
                	}
                });
	            if (parent) {
	            	currentComment.parent = _.pick(parent, 'id', 'version');
	            }
	            ProoferService.saveComment(currentComment);
                layoutController.fireEvent('proofer:comment-created', currentComment);
            }

		    function submitBubble() {
		    	currentComment.text = bubbleInput.val();
		    	if (!currentComment.text || currentComment.text==='') {
		    		return;
		    	}
		    	var parent = null;
		    	if (currentComment.parent) {
		    		var comments = ProoferService.getComments();
		    		var c = _.findWhere(comments, {id:currentComment.parent.id});
		    		if (c && (c.isArchived || c.completed)) {
		    			parent = c;
                		parent.isArchived = false;
                		parent.completed = false;
                	}
		    	}
		    	if (parent) {
		    		ProoferService.saveComment(parent);
		    	} else {
		    		ProoferService.saveComment(currentComment);
		    	}
		    	layoutController.fireEvent('proofer:comment-submitted', currentComment);
		    	doTransition(currentRenderer);
		    	destroyBubble();
		    }

		    function cancelBubble() {
		    	ProoferService.deleteComment(currentComment);
		    	layoutController.fireEvent('proofer:comment-cancelled', currentComment);
		    	doTransition(currentRenderer);
		    	destroyBubble();
		    }
		    
		    function onBubbleInputChange(e) {
		    	currentComment.text = bubbleInput.val();
		    	layoutController.fireEvent('proofer:comment-text-changed', currentComment);		    	
		    	ProoferService.sendTypingEvent(currentComment);
		    }

		    function onBubbleInputKeydown(e) {
		    	if (e.keyCode===27) {
		    		cancelBubble();
		    	} else if (e.keyCode===13 && !e.altKey && !e.ctrlKey && !e.shiftKey) {
			    	submitBubble();
			    }
		    }

		    function drawTargetOverlay(target, renderer) {
		        var canvas = renderer.canvas,
		            ctx = canvas.getSelectionContext();

		        var matrix = target.getGlobalMatrix(),
		            topLeft = matrix.transformPoint(0,0);

		        return function(t) {
		            ctx.save();
		            ctx.setTransform(1,0,0,1,0,0);
		            ctx.translate(topLeft.x, topLeft.y);
		            ctx.rotate(target.angle * Math.PI/180);

		            var m = new PACE.Matrix2D();
			            m.translate(topLeft.x, topLeft.y);
		            	m.rotate(target.angle * Math.PI/180);
			            m.invert();

		            ctx.globalAlpha = t;

		            ctx.fillStyle = FILL_STYLE;
		            ctx.strokeStyle = STROKE_STYLE;
		            var strokeSize = 3;
		            ctx.lineWidth = strokeSize;
		            var w = target.width * target.scaleX,
		            	h = target.height * target.scaleY;

		            var ctl = m.transformPoint(0, 0),
		            	ctb = m.transformPoint(canvas.width, canvas.height),
		            	left = renderer.flipBookSide==='left' ? Math.max(0, ctl.x) : 0,
		            	top = Math.max(0, ctl.y),
		            	right = renderer.flipBookSide==='right' ? Math.min(w, ctb.x) : w,
		            	bottom = Math.min(h, ctb.y);

		            if (right>=ctl.x && left<=ctb.x) {
			            ctx.fillRect(left + 1, top + 1, right - left - 2, bottom - top - 2);
			            ctx.strokeRect(left + 1, top + 1, right - left - 2, bottom - top - 2);
			        }

			        var rw = 28, rh = 20, pad = 10;
		            var canvasBr = m.transformPoint(canvas.width - rw - pad, canvas.height - rh - pad);

		            var rx = renderer.flipBookSide==='right' ? Math.min(w - rw - pad, canvasBr.x) : w - rw - pad,
		            	ry = Math.min(h - rh - pad, canvasBr.y);
			            
		            if (!target.element.hasComments && rx>0 && ry>0) {
			            ctx.fillStyle = '#fcfcfc';
			            ctx.lineWidth = 1;
			            ctx.strokeStyle = '#606060';
			            ctx.shadowBlur = 4;
	        			ctx.shadowOffsetX = 2;
	        			ctx.shadowOffsetY = 2;
	        			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			           
			            CanvasHelper.drawRoundedRect(ctx, rx, ry, rw, rh, 4);
			            ctx.fill();
			            ctx.shadowColor = "transparent";
			            ctx.stroke();

			            ctx.font = '12px Arial';
	            		ctx.fillStyle = '#000';
	            		ctx.lineWidth = 0;
	            		ctx.textAlign = 'center';  
	            		ctx.fillText(target.element.imageNumber, rx + rw/2, ry + rh * 0.7);
	            	}

		            ctx.restore();
		        };
		    }

		    function doTransition(renderer, drawFn) {
		        prevDrawFn = currentDrawFn;
		        currentDrawFn = drawFn;

		        var renderers = getCurrentRenderers(renderer);

		        fabric.util.animate({
		            startValue: 0,
		            endValue: 1,
		            duration: 300,
		            onChange: function(value) {
		                clearCanvas(renderers);
		                if (prevDrawFn) prevDrawFn(1 - value);
		                if (currentDrawFn) currentDrawFn(value);
		            }
		        });
		    }

		    function clearCanvas(renderers) {
		    	for (var i = 0; i < renderers.length; i++) {
		        	var canvas = renderers[i].canvas,
		            ctx = canvas.getSelectionContext();
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        }
		    }

		    function getCurrentRenderers(renderer) {
		    	var idx = layoutController.renderers.indexOf(renderer);
				var renderers = [renderer];
				if (renderer.flipBookSide) {
					var idx2 = renderer.flipBookSide==='left' ? idx + 1 : idx - 1;
					if (idx2>=0 && idx2<layoutController.renderers.length) {
						renderers.push(layoutController.renderers[idx2]);
					}
				}
				return renderers;
		    }

		    function getOverflayFn(renderer, event) {
		    	var result = [],
		    		renderers = getCurrentRenderers(renderer);
		    		
		    	for (var i = 0; i < renderers.length; i++) {
		    		var t = findTarget(renderers[i], event);
		    		if (t) {
		    			result.push(drawTargetOverlay(t, renderers[i]));
		    		}
		    	}
		    	return function(t) {
		    		for (var i = 0; i < result.length; i++) {
		    			result[i](t);
		    		}
		    	}
		    }

		    this.onBeforeMouseDown = function(renderer, event) {
				//console.log('onBeforeMouseDown', target, event);
				var canvas = renderer.canvas,
					mousePos = canvas.getPointer(event),
					rect = renderer.spreadInfo.getTrimRect().toCanvasSpace(canvas).round(),
					cs = 50;

				if ((mousePos.x<cs && mousePos.y<cs) ||
					(mousePos.x>rect.width - cs && mousePos.y<cs) ||
					(mousePos.x>rect.width - cs && mousePos.y>rect.height - cs) ||
					(mousePos.x<cs && mousePos.y>rect.height - cs)) {
					return;
				}
				createBubble(renderer, event);
			};

			this.onMouseMove = function(renderer, options) {
				var event = options.e,
					target = findTarget(renderer, event),
					canvas = renderer.canvas,
					drawFn, 
					cursor = 'default';

				if (target!=currentTarget) {
					currentTarget = target;
					if (target) {
						drawFn = getOverflayFn(renderer, event);
						cursor = imageAddIcon;
					} 

					canvas.defaultCursor = cursor;
	    			canvas.upperCanvasEl.style.cursor = cursor;
					doTransition(renderer, drawFn);
				}
			};

			this.onMouseOut = function(renderer, options) {
				var canvas = renderer.canvas;
				canvas.defaultCursor = 'default';
	    		canvas.upperCanvasEl.style.cursor = 'default';
	    		currentTarget = null;
				doTransition(renderer);	
			};

			this.exit = function() {
				_.each(layoutController.renderers, function(renderer) {
					renderer.canvas.preventMouseDown = false;
				});
				layoutController.currentTool = new PACE.SelectionTool(layoutController);
				layoutController.currentTool.beginEdit();
			};

			this.onKeyUp = function(e) {
		        if (exitWithEsc && e.keyCode===27) {
		            this.exit();
		        }
		    };

    	}
    }
])
.service('CanvasHelper', [ function CanvasHelper() {

	PACE.CanvasHelper = this;

	this.drawRoundedRect = function(ctx, x, y, w, h, rx) {
        var rx = rx || 2,
            k = 1 - 0.5522847498 /* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */;

        ctx.beginPath();

        ctx.moveTo(x + rx, y);

        ctx.lineTo(x + w - rx, y);
        ctx.bezierCurveTo(x + w - k * rx, y, x + w, y + k * rx, x + w, y + rx);

        ctx.lineTo(x + w, y + h - rx);
        ctx.bezierCurveTo(x + w, y + h - k * rx, x + w - k * rx, y + h, x + w - rx, y + h);

        ctx.lineTo(x + rx, y + h);
        ctx.bezierCurveTo(x + k * rx, y + h, x, y + h - k * rx, x, y + h - rx);

        ctx.lineTo(x, y + rx);
        ctx.bezierCurveTo(x, y + k * rx, x + k * rx, y, x + rx, y);

        ctx.closePath();
    };

}]);
