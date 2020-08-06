'use strict';

angular.module('pace.layout')
	.constant('spreadToTemplateSettings', {
		tolerance: 0.1
	})

	/**
	 * Service for constructing a layoutTemplate for a given spread.
	 */
	.service('SpreadToTemplateService', ['spreadToTemplateSettings', 'GeomService',
		function(spreadToTemplateSettings, GeomService) {
			var that = this;
			/**
			 * @param mode modes: 'left', 'right', 'spread'
			 */
			this.getTemplate = function(spread, layout, mode) {
				var getTemplate = function(page) {
					if (!page) return null;
					return that.getCustomTemplate(page);
				};

				var spreadInfo = new PACE.SpreadInfoFactory().create(spread, layout);
                var pages = spreadInfo.pages,
                	leftPage = spreadInfo.getLeftPage(),
                	rightPage = spreadInfo.getRightPage();

				if (mode==='left') {
					return getTemplate(leftPage);
				} else if (mode==='right') {
					return getTemplate(rightPage);
				} else {
					var template;
					if (spreadInfo.isSpreadLayout()) {
						template = getTemplate(spreadInfo);
						if (template)
							template.target = 'spread';
					} else {
						var left = getTemplate(leftPage),
							right = getTemplate(rightPage);

						if (left || right) {
							template = { type: 'TwoPageLayoutTemplate', left: left, right: right };
						}
					}
					return template;
				}
			};

			this.getCustomTemplate = function(page) {
				var elements = page.getImageElements(),
					trimRect = page.getPageRect(),
					marginRect = page.getMarginRect(),
					bleedRect = page.getBleedRect(),
					center = page.getCenteringRect ? page.getCenteringRect().getCenter() : page.getBleedRect().getCenter();

				if (elements.length===0) return;

				var bbox = new PACE.Element({type:'ElementGroup', elements:elements}).getBoundingBox(),
					rect = bleedRect,
					template = {
						type: 'CustomLayoutTemplate',
						target: 'page',
						span: 'bleed'
					};

				var containsRect = function(outerRect, innerRect) {
					var r = new PACE.Rect(outerRect);
					r.inflate(2,2);
					return r.containsRect(innerRect);
				};

				if (containsRect(marginRect, bbox)) {
					template.span = 'margin';
					rect = marginRect;
				} else if (containsRect(trimRect, bbox)) {
					template.span = 'trim';
					rect = trimRect;
				}
				if (template.span==='bleed') {
					center = page.getBleedRect().getCenter();
				}
					
				var	frames = _.map(elements, function(el) {
					return {
						x: (el.x - bbox.x) / rect.width,
						y: (el.y - bbox.y) / rect.height,
						width: el.width / rect.width,
						height: el.height / rect.height,
						rotation: el.rotation
					};
				});

				var offsetSign = page.isRight && page.isRight() ? -1 : 1;

				var bboxCenter = bbox.getCenter();
				template.frames = {
					rect: rect,
					frames: frames,
					offset: { 
						x: offsetSign * ((center.x - bboxCenter.x) / rect.width), 
						y: (center.y - bboxCenter.y) / rect.height 
					}
				};
				return template;
			};


			this.getGridTemplate = function(elements) {
				var tolerance = spreadToTemplateSettings.tolerance,
					checkRotations = function() {
						// check if all elements have rotation equal zero
						return _.every(elements, function(el) {
							return el.rotation === 0;
						});
					},
					checkIntersections = function() {						
						var same = function(e1, e2) {
							return e1.x === e2.x && e1.y === e2.y &&
									e1.width === e2.width && e1.height === e2.height;
						};
						//TODO even though the input is small, that could be done in O(nlogn)
						return _.every(elements, function(el1) {
							var x1 = el1.x, x2 = x1 + el1.width,
								y1 = el1.y, y2 = y1 + el1.height,
								doesNotContain = function(x, y) {
									return x < x1 || x > x2 || y < y1 || y > y2;
								};
							return _.every(elements, function(el2) {
								return same(el1, el2) || (
										doesNotContain(el2.x, el2.y) &&
										doesNotContain(el2.x + el2.width, el2.y) &&
										doesNotContain(el2.x, el2.y + el2.height) &&
										doesNotContain(el2.x + el2.width, el2.y + el2.height)
									);
							});
						});
					},
					getSplits = function(coord, dim) {
						var doesNotContain = function(arr, el) {
							return _.every(arr, function(arrEl) {
								return arrEl - tolerance > el || arrEl + tolerance < el;
							});
						};
						return _.reduce(elements, function(arr, element) {
							var x1 = element[coord],
								x2 = x1 + element[dim];
							if(doesNotContain(arr, x1))
								arr = arr.concat(x1);
							if(doesNotContain(arr, x2))
								arr = arr.concat(x2);
							return arr;
						}, []).sort(function(a, b) {
							return a - b;
						});
					},
					getScheme = function(xSplits, ySplits) {
						var scale = function(splits) {
							var len = splits[splits.length - 1] - splits[0],
								prop = [];
							for(var i = 1; i < splits.length; i++) {
								prop[i - 1] = 100 * (splits[i] - splits[i - 1]) / len;
							}
							return prop;
						};
						return {
							colWidths: scale(xSplits),
							rowHeights: scale(ySplits),
							nRows: ySplits.length - 1,
							nCols: xSplits.length - 1
						};
					},
					getEmptyRows = function(scheme) {
						return _(scheme.nRows).times(function() {
							return {
								cells: _(scheme.nCols).times(function() {
									return {
										rowSpan: 0,
										colSpan: 0
									};
								})
							};
						});
					},
					getIndexFirstLessThan = function(x, arr) {
						for(var i = 1; i < arr.length; i++) {
							if(x < arr[i])
								return i - 1;
						}
						throw new Error('Failed to find first index: getIndexFirstLessThan(' +
							x + ', ' + JSON.stringify(arr) + ')');
					},
					getIndexLastLessThan = function(dim, arr, startIndex) {
						var beg = arr[startIndex];
						for(var i = startIndex + 1, subSum = 0; i < arr.length; i++) {
							subSum += arr[i] - arr[i - 1];
							if(subSum >= dim)
								return i;
						}
						return arr.length - 1;
					},
					getEmptyRowsAndCols = function(scheme, rows) {
						var getEmptyRows = function() {
								return _.compact(
									_.map(rows, function(row, index) {
										if(_.every(row.cells, function(cell) {
											return cell.colSpan === 0 && cell.rowSpan === 0;
										})) return index;
									})
								);
							},
							getEmptyCols = function() {
								var empty = [];
								for(var c = 0; c < scheme.nCols; c++) {
									var nonEmpty = 0;
									for(var r = 0; r < scheme.nRows; r++) {
										var cell = rows[r].cells[c];
										if(cell.colSpan > 0 || cell.rowSpan > 0)
											nonEmpty++;
									}
									if(nonEmpty === 0)
										empty.push(c);
								}
								return empty;
							};

						return {
							rows: getEmptyRows(),
							cols: getEmptyCols()
						};
					},
					removeEmpty = function(scheme, rows, empty, dim) {
						var dimProp = dim === 'cols' ? 'colWidths' : 'rowHeights',
							dims = scheme[dimProp],

							distributeDim = function(i) {
								var d = dims[i] / 2;
								if(i === 0) dims[1] += d * 2;
								if(i === dims.length - 1) dims[dims.length - 2] += d * 2;
								else {
									dims[i - 1] += d;
									dims[i + 1] += d;
								}
							},
							removeColumn = function(i) {
								// remove column
								_.each(rows, function(row) {
									row.cells.splice(i, 1);

									// update colSpans
									for(var c = i - 1; c >= 0; c--) {
										if(row.cells[c].colSpan > 0) {
											var cell = row.cells[c];
											if(cell.colSpan + c - 1 >= i) {
												cell.colSpan--;
												break;
											} else break;
										}
									}
								});

								// update scheme size
								scheme.nCols--;
							},
							removeRow = function(i) {
								// remove row
								rows.splice(i, 1);

								// update rowSpans
								for(var r = i - 1; r >= 0; r--) {
									for(var c = 0; c < scheme.nCols; c++) {
										var cell = rows[r].cells[c];
										if(cell.rowSpan + r - 1 >= i)
											cell.rowSpan--;
									}
								}

								// update scheme size
								scheme.nRows--;
							};
							
						_.each(empty.reverse(), function(e) {
							// distribute the size of empty column/row equally to
							// the neighbouring columns/rows
							distributeDim(e);
							
							// remove the width/height at index 'e'
							dims.splice(e, 1);

							// remove the column/row from the rows structure
							if(dim === 'rows') removeRow(e);
							else removeColumn(e);

						});
					},
					getDesiredProportion = function() {
						var maxXEl = _.max(elements, function(e) { return e.x + e.width; }),
							maxYEl = _.max(elements, function(e) { return e.y + e.height; }),
							minXEl = _.min(elements, function(e) { return e.x; }),
							minYEl = _.min(elements, function(e) { return e.y; }),
							maxX = maxXEl.x + maxXEl.width,
							maxY = maxYEl.y + maxYEl.height,
							minX = minXEl.x,
							minY = minYEl.y;

						return GeomService.roundNumber((maxX - minX) / (maxY - minY), 4);
					};

				if(checkRotations() && checkIntersections()) {
					var numElements = elements.length,
						xSplits = getSplits('x', 'width'),
						ySplits = getSplits('y', 'height'),
						scheme = getScheme(xSplits, ySplits),
						rows = getEmptyRows(scheme);

					_.each(elements, function(el) {
						var lx = getIndexFirstLessThan(el.x, xSplits),
							ly = getIndexFirstLessThan(el.y, ySplits),
							cell = rows[ly].cells[lx];
						cell.colSpan = getIndexLastLessThan(el.width, xSplits, lx) - lx;
						cell.rowSpan = getIndexLastLessThan(el.height, ySplits, ly) - ly;
					});

					var emptyColsAndRows = getEmptyRowsAndCols(scheme, rows);
					removeEmpty(scheme, rows, emptyColsAndRows.cols, 'cols');
					removeEmpty(scheme, rows, emptyColsAndRows.rows, 'rows');

					return {
						numEffectiveCells: numElements,
						scheme: scheme,
						rows: rows,
						type: 'GridLayoutTemplate',
						desiredProportion: getDesiredProportion()
					};
				} else {
					throw new Error('Unable to infer grid template from elements.');
				}
			};
		}
	]);
