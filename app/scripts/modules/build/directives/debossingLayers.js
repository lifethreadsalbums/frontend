'use strict';

angular.module('pace.build')
    .directive('debossingLayers', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                function handleSortUpdate(e, ui) {
                    console.log('sort update', $(e.item).index())
                };

                var sort = new Sortable(element[0], {
                    handle: '.layer__drag-handle',
                    draggable: ".layer",
                    ghostClass: "layer--dragged",
                    onUpdate: handleSortUpdate,
                    onAdd: function (evt){
                        var itemEl = evt.item;
                        console.log('add');
                    }
                });

                element.on('$destroy', function() {
                    sort.destroy();
                })
            }
        };
    }])
    .directive('debossingLayer', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                function handleClick() {

                };

                element.on('click', handleClick);

                element.on('$destroy', function() {
                    element.unbind('click');
                });
            }
        };
    }]);
