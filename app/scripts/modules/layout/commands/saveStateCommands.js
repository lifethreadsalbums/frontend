PACE.SaveElementsStateCommand = function(elms) {
    
    var savedElements,
        elements;

    this.execute = function() {
        elements = elms.concat();
        savedElements = angular.copy(elements);
    };

    this.undo = function() {
        _.each(elements, function(el, i) {
            _.extend(el, _.omit(savedElements[i], 'id', 'version', '_id'));
        });
    };

};

PACE.SaveSpreadStateCommand = function(spread) {
    
    var elementProps, elements;

    this.execute = function() {
        elementProps = angular.copy(spread.elements);
        elements = spread.elements.concat();
    };

    this.undo = function() {
        var existingElements = spread.elements,
            existingElementsById = _.indexBy(existingElements, 'id');

        spread.elements = elements;

        //retain version to avoid conflicts when saving layouts
        _.each(elements, function(el, i) {
            _.extend(el, _.omit(elementProps[i], 'id', 'version', '_id'));
            if (el.id && existingElementsById[el.id]) {
                el.version = existingElementsById[el.id].version;
            }
        });
    };

};

PACE.SaveLayoutStateCommand = function(layout) {
    
    var cmd = new PACE.MacroCommand(
        _.map(layout.spreads, function (spread) {
            return new PACE.SaveSpreadStateCommand(spread);
        })
    );

    this.execute = cmd.execute.bind(cmd);
    this.undo = cmd.undo.bind(cmd);

};