'use strict';

angular.module('pace.proofer')
.service('ProoferService', ['$rootScope', 'NotificationEvent', '$resource', 
	function ProoferService($rootScope, NotificationEvent, $resource) {

	var SPREAD_COMMENT_TYPE = 'com.poweredbypace.pace.domain.layout.SpreadComment';

	PACE.ProoferService = this;

	var prooferApi = $resource('', {}, {
		getComments: { method:'GET', url: apiUrl + 'api/proofer/comments/:id', isArray:true },
        saveComment: { method:'POST', url:apiUrl + 'api/proofer/comment' },
        sendTypingEvent: { method:'POST', url:apiUrl + 'api/proofer/typing' },
        approve: { method:'POST', url:apiUrl + 'api/proofer/approve' },
        unapprove: { method:'POST', url:apiUrl + 'api/proofer/unapprove' },
        deleteComment: { method:'DELETE', url: apiUrl + 'api/proofer/comments/:id' },
        saveSettings: { method:'POST', url:apiUrl + 'api/proofer/settings' },
        publish: { method:'POST', url:apiUrl + 'api/proofer/publish' },
        getSettings: { method:'GET', url: apiUrl + 'api/proofer/settings/:id', isArray:false },
        getProofStatus: { method:'GET', url: apiUrl + 'api/proofer/status/:id', isArray:false }
	});

	var model = {
			comments: [],
			layout: null,
			numCompleted: 0,
			numPending: 0
		},
		changeListeners = [],
		loadListeners = [];
		
	function fireChangeEvent() {
		fireEvent(changeListeners);
	}

	function fireLoadEvent() {
		fireEvent(loadListeners);
	}

	function fireEvent(listeners) {
		_.each(listeners, function(fn) { fn()	});
	}

	function isCommentValid(comment) {
		return (comment.spread && !(comment.elementId && !comment.element));
	}

	function updateSpreadAndElement(comment) {
		var spreads = model.layout.spreads;
		if (model.coverLayout) {
			spreads = spreads.concat(model.coverLayout.spreads);
		}

		var spread = _.findWhere(model.layout.spreads, {_id:comment.spreadId});
        if (spread) {
        	comment.spread = spread;
        	comment.layout = model.layout;
        	spread.comment = null;
        	if (comment.elementId) {
            	var el = _.findWhere(spread.elements, {_id:comment.elementId});
            	if (el) {
            		comment.element = el;
            		el.comment = _.pick(comment, 'completed', 'isArchived', 'id');
            	} else {
            		comment.element = null;
            	}
            } else {
            	spread.comment = _.pick(comment, 'completed', 'isArchived', 'id');
            }
        } else {
        	comment.spread = null;
        }
	}

	function updateImageNumbers(layout) {
		if (!layout) return;
		var orderFn = function(el) {
			var d = 20;
			var x = Math.round((el.x + el.width/2)/d),
				y = Math.round((el.y + el.height/2)/d);
	        var page = el.x + (el.width/2) < layout.layoutSize.width ? 1 : 2;
	        return x + (y * 1000) + (page * 1000000);
		};

		for (var i = 0; i < layout.spreads.length; i++) {
        	var spread = layout.spreads[i],
        		elements = spread.elements;
        	spread.spreadNumber = i + 1;
			elements = _.sortBy(elements, orderFn);
            for (var k = 0; k < elements.length; k++) {
                var el = elements[k];
                el.comment = null;
                el.imageNumber = k + 1;
                el.pageNumber = spread.pageNumber + (el.x>layout.layoutSize.width ? 1 : 0);
                el.spreadNumber = i + 1;
            }
        }
	}

	function updateStats() {
		var numPending = 0,
			numCompleted = 0;
		for (var i = model.comments.length - 1; i >= 0; i--) {
			var c = model.comments[i];
			if (c.isArchived) continue;
			if (c.completed)
				numCompleted++;
			else
				numPending++;
		}
		model.numCompleted = numCompleted;
		model.numPending = numPending;
	}

	function findComment(comment) {
		var comments = model.comments;
		
		if (comment.parent) {
			//find parent
			var parent = _.findWhere(comments, {id:comment.parent.id});
			if (parent) {
				if (!parent.replies) parent.replies = [];
				comments = parent.replies;
			}
		}
		var cmd = _.findWhere(comments, {id:comment.id});
		return cmd;
	}

	function pushComment(comment) {
		var comments = model.comments;
		
		if (comment.parent) {
			//find parent
			var parent = _.findWhere(comments, {id:comment.parent.id});
			if (parent) {
				if (!parent.replies) parent.replies = [];
				comments = parent.replies;
			}
		}
		//find spread and element
		updateSpreadAndElement(comment);

		var cmd = _.findWhere(comments, {id:comment.id});
		if (cmd) {
			_.extend(cmd, comment);
		} else {
			comments.push(comment);	
		}
		updateStats();
	}

	function removeComment(comment) {
		var comments = model.comments;
		if (comment.spread) {
			delete comment.spread.comment;
		}
		if (comment.parent) {
			//find parent
			var parent = _.findWhere(comments, {id:comment.parent.id});
			if (parent) {
				if (!parent.replies) parent.replies = [];
				comments = parent.replies;
			}
		}

		var c = _.findWhere(comments, {id:comment.id});
		if (c) {
			if (c.element) c.element.comment = null;
			var idx = comments.indexOf(c);
			comments.splice(idx, 1);
			updateStats();
			return c;
		}
	}

	function onError(error) {
		console.error(error);
	}

	this.getComments = function() {
		return model.comments
	};

	this.getNumCompleted = function() {
		return model.numCompleted;
	};

	this.getNumPending = function() {
		return model.numPending;
	};

	this.setSelectedEdit = function(edit) {
		this.selectedEdit = edit;
	};

	this.getSelectedEdit = function() {
		return this.selectedEdit;
	};

	this.init = function(layout, coverLayout) {
		//load comments by layout ID
		updateImageNumbers(layout);
		updateImageNumbers(coverLayout);
		model.layout = layout;
		model.coverLayout = coverLayout;
		prooferApi.getComments({id:layout.id}, function(result) {
			model.comments = _.filter(result, function(c) {
				updateSpreadAndElement(c);
				return isCommentValid(c);
			});
			updateStats();
			fireLoadEvent();
			fireChangeEvent();
		});
	};

	this.saveComment = function(comment) {
		pushComment(comment);
		var c = _.omit(comment, 'spread', 'layout');
		c.layout = _.pick(comment.layout, 'id', 'version');
		prooferApi.saveComment(c, function(result) {
			//update ID
			_.extend(comment, result);
			updateSpreadAndElement(comment);
			fireChangeEvent();
		}, onError);
		fireChangeEvent();
	};

	this.deleteComment = function(comment) {
		if (removeComment(comment)) {
			fireChangeEvent();
			prooferApi.deleteComment({id:comment.id}, 
				function(result) {}, 
				onError
			);
		}
	};

	this.onChange = function(listener) {
		changeListeners.push(listener);
	};

	this.onLoad = function(listener) {
		loadListeners.push(listener);
	};

	this.refreshModel = function() {
		updateImageNumbers(model.layout);
		model.comments = _.filter(model.comments, function(c) {
			updateSpreadAndElement(c);
			return isCommentValid(c);
		});
		updateStats();
	};

	this.setLayout = function(layout, coverLayout) {
		model.layout = layout;
		model.coverLayout = coverLayout
		updateImageNumbers(layout);
		updateImageNumbers(coverLayout);
		_.each(model.comments, updateSpreadAndElement);
		fireChangeEvent();
	};

	this.getUnreadMessageCount = function(user) {
		var totalCount = 0;
		_.each(model.comments, function(comment) {
			var numReplies = _.reduce(comment.replies, function(num, c) {
                return num + (c.text && c.text.length>0 && !c.isRead && c.user.id!==user.id ? 1 : 0);
            }, 0);
            if (comment.user.id!==user.id && !comment.isRead) numReplies++;
            totalCount += numReplies;
		});
		return totalCount;
	};

	function sendTypingEvent(comment) {
		prooferApi.sendTypingEvent(_.pick(comment, 'layout', 'parent', 'user'), function(result) { }, onError);
	};

	var throttledTypingEvent = _.throttle(sendTypingEvent, 250);

	this.sendTypingEvent = function(comment) {
		throttledTypingEvent(comment);
	};

	this.approve = function(settings) {
		var that = this;
		return prooferApi.approve(settings).$promise.then(function(result) {
			_.each(model.comments, function(c) {
				c.completed = true;
				that.saveComment(c);
			});

			return result;
		});
	};

	this.unapprove = function(settings) {
		var that = this;
		return prooferApi.unapprove(settings).$promise;
	};

	this.getSettings = function(product) {
		return prooferApi.getSettings({id:product.id}).$promise;
	};

	this.getSettingsByProductId = function(productId) {
		return prooferApi.getSettings({id:productId}).$promise;
	};

	this.saveSettings = function(settings) {
		return prooferApi.saveSettings(settings).$promise;
	};

	this.publish = function(settings) {
		return prooferApi.publish(settings).$promise;
	};

	this.getProofStatus = function(product) {
		return prooferApi.getProofStatus({id:product.id})
			.$promise.then(function(result) {
				return result ? result.status : null;
			});
	};

	$rootScope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
		if (model.layout===null) return;
		if (notification.entityType!==SPREAD_COMMENT_TYPE) return;

		var comment = JSON.parse(notification.body);
        if (comment.layout.id!==model.layout.id) return;
            
		if (notification.type==='EntityChange') {
            //console.log('spread comment received', comment);
            var cmd = findComment(comment);
            if (cmd && cmd.version>=comment.version) return;

            //console.log('new spread comment received', comment);
            pushComment(comment);
            fireChangeEvent();
        } 

        if (notification.type==='EntityDelete') {
            //console.log('spread comment deleted', comment);
            if (removeComment(comment)) {
            	fireChangeEvent();	
            }
        } 

    });

}]);