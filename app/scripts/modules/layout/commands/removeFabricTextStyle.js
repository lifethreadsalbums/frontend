/**
 * Removes all the 'properties' from the 'elementStyles'.
 *
 * elementStyles - fabric.js styles - at the first leves, the identifiers
 * are representing the number of line, at the second level - the character in a line
 * each having ordinary css style.
 *
 * properties - array of properties to remove
 */
PACE.RemoveFabricTextStyleCommand = function (elementStyles, properties) {
    'use strict';
    
    var oldProps;
    
    this.execute = function () {
        oldProps = [];
        
        _.each(_.keys(elementStyles), function (line) {
            _.each(_.keys(elementStyles[line]), function (charIndex) {
                var charStyle = elementStyles[line][charIndex];
                
                _.each(properties, function (style) {
                    oldProps.push({
                        line: line,
                        charIndex: charIndex,
                        style: style,
                        val: charStyle[style]
                    });
                    delete charStyle[style];
                });
            });
        });
    };
    
    this.undo = function () {
        _.each(oldProps, function (p) {
            elementStyles[p.line][p.charIndex][p.style] = p.val;
        });
    };
};