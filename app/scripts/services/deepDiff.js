'use strict';

angular.module('paceApp').
	factory('DeepDiff', ['_',
		function(_) {
			var DeepDiff = {};

			var isValue = function(obj) {
				var str = toString.apply(obj);
				return str === '[object Number]' ||
						str === '[object Boolean]' ||
						str === '[object String]';
			};

			var getPatch = function(patchPath, patchVal) { 
				return {
					path: patchPath,
					val: patchVal,
					type: 'REPLACE'
				};
			};

			var ignored = function(path, ignoreArr) {
				for(var ignore in ignoreArr) {
					if(path.indexOf(ignoreArr[ignore]) >= 0) {
						return true;
					}
				}
				return false;
			};

			DeepDiff.getPatches = function(newO, oldO, prefix, ignore) {
				prefix = typeof prefix !== 'undefined' ? prefix : "";
				var patches = [];

				for(var p in newO) {
					//ignore properties with '$' in name
					if(p.indexOf("$") < 0 && !ignored(prefix + p, ignore)) {
						if(!oldO[p] && newO[p]) {
							//new value created
							var val = newO[p];
							patches.push(
								getPatch(
									prefix + p,
									isValue(val) ? val : JSON.stringify(val)));
						} else if(oldO[p] && (oldO[p] !== newO[p])) {
							//value has changed
							if(isValue(newO[p])) {
								patches.push(
									getPatch(
										prefix + p,
										newO[p]));
							} else {
								var childPatches =
									DeepDiff.getPatches(newO[p], oldO[p], prefix + p + ".", ignore);
								for(var i = 0; i < childPatches.length; i++)
									patches.push(childPatches[i]);
							}
						}
					}
				}

				return patches;
			};

			return DeepDiff;
		}]);