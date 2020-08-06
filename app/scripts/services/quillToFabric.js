'use strict';

angular.module('paceApp').
	constant('QuillDefaultStyles', {
		'fontSize': 12,
		'fontFamily': 'Arial'
	}).
	factory('QuillToFabric', ['QuillDefaultStyles', '_',
		function(QuillDefaultStyles, _) {
		var QuillToFabric = {};

		var fontSize = function(op) {
			if(op && op.attributes && op.attributes.size &&
				typeof op.attributes.size === 'string') {
				return parseInt(op.attributes.size);
			} else return QuillDefaultStyles.fontSize;
		};

		var fontFamily = function(op) {
			if(op && op.attributes && op.attributes.font) {
				return op.attributes.font;
			} else return QuillDefaultStyles.fontFamily;
		};

		var fontStyle = function(op) {
			if(op && op.attributes) {
				var styles = [];
				if(op.attributes.italic === true)
					styles.push('italic');
				if(op.attributes.oblique === true)
					styles.push('oblique');
				if(styles.length === 0)
					return 'normal';
				else return styles.join("|");
			} else return 'normal';
		};

		var textDecoration = function(op) {
			if(op && op.attributes) {
				var decor = [];
				if(op.attributes.underline === true)
					decor.push('underline');
				if(op.attributes.strike === true)
					decor.push('line-through');
				if(op.attributes.overline === true)
					decor.push('overline');
				if(decor.length === 0)
					return 'none';
				else return decor.join("|");
			}
			else return 'none';
		};

		var fontWeight = function(op) {
			if(op && op.attributes && op.attributes.bold === true) {
				return 'bold';
			} else return 'normal';
		};

		var textBackgroundColor = function(op) {
			if(op && op.attributes && op.attributes.background) {
				return op.attributes.background;
			} else return 'transparent';
		};

		var stroke = function(op) {
			if(op && op.attributes && op.attributes.color) {
				return op.attributes.color;
			} else return 'black';
		};

		var getStyles = function(op) {
			return {
				fontFamily: fontFamily(op),
				fontSize: fontSize(op),
				fontStyle: fontStyle(op),
				textDecoration: textDecoration(op),
				fontWeight: fontWeight(op),
				textBackgroundColor: textBackgroundColor(op),
				fill: stroke(op)
			};
		};

		var stylesAndText = function(ops) {
			var row = 0, col = 0, text = [], styles = {};

			_.each(ops, function(op) {
				if(op.insert) {
					text.push(op.insert);

					// check wheter styles object has been already
					// created for given row
					var item = styles[row];
					if(item === undefined) item = {};

					// create styles object for a given 'op'
					var prefs = getStyles(op);

					// iterate over current string
					for(var i = 0; i < op.insert.length; i++) {
						var c = op.insert[i];						
						if(c === '\n') {
							// if the string contains new row character
							// store current item into the styles object,
							// increment row, reset object and column counter
							styles[row++] = item;
							item = {};
							col = 0;
						} else {
							// for character different than new line char
							// store preferences into appropriate column
							// and increment the column
							item[col++] = prefs;
						}
					}

					// store current item into styles object
					styles[row] = item;

				} else {
					text.push('\n');
					row += 1;
					col = 0;
				}
			});
			
			// return together 'styles' and whole text trimmed
			// such that it doesn't contain any unnecessary new lines
			// at the end
			return {
				'styles': styles,
				'text': text.join("").replace(/^\s+|\s+$/g, "")
			};
		};

		/**
		 * Method that expects Quill delta and returns
		 * fabric.IText object preserving content and formatting.
		 */
		QuillToFabric.getIText = function(quill) {
			if(typeof quill === 'string' || quill instanceof String)
				quill = JSON.parse(quill);

			var st = stylesAndText(quill.ops);

			return new fabric.IText(st.text, {
				fontFamily: fontFamily(),
				fontSize: fontSize(),
				styles: st.styles
			});
		};

		/**
		 * Method that expects Quill delta and returns
		 * object containing 'text' and fabric.IText 'styles'.
		 */
		QuillToFabric.getStylesAndText = function(quill) {
			if(typeof quill === 'string' || quill instanceof String)
				quill = JSON.parse(quill);

			return stylesAndText(quill.ops);
		};

		return QuillToFabric;
	}]);