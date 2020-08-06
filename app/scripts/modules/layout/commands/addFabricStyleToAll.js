/**
 * For a given TextElement applies each prop to every character style.
 */
PACE.AddFabricStyleToAllCommand = function (element, props) {
    'use strict';
    
    var oldCharStyles, oldElementStyles;
    
    this.execute = function () {
        oldCharStyles = angular.copy(element.styles);
        oldElementStyles = _.pick(element, _.keys(props));
        
        var styles = element.styles || {},
            text = element.text;
        
        if(text && text.length > 0) {
            _.each(text.split('\n'), function (line, i) {
                if (_.isUndefined(styles[i])) {
                    styles[i] = {};
                }
                
                _.each(line, function (c, j) {
                    if (_.isUndefined(styles[i][j])) {
                        styles[i][j] = {};
                    }
                    
                    _.extend(styles[i][j], props);
                });
            });
        }
        _.extend(element, props);
        element.styles = styles;
    };
    
    this.undo = function () {
        if (oldCharStyles) {
            _.extend(element, oldElementStyles);
            element.styles = oldCharStyles;
        }
    };
};