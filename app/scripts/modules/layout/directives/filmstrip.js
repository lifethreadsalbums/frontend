'use strict';

angular.module('pace.layout')
    .directive('filmstrip', ['_', '$timeout', 'FilmstripComponent', '$debounce',
            function(_, $timeout, FilmstripComponent, $debounce) {
                return {
                    restrict: 'E',
                    replace: true,
                    scope: {
                        filmstrip: '=',
                        layout: '=',
                        onGotoId: '=',
                        showInfo: '=',
                        thumbScale: '=',
                        rangeSelectionMode: '=',
                        layoutController: '=',
                        onSelectionChange: '=',
                        onFileInfoClick: '=',
                        showAdminInfo: '=',
                        disableDimmingThumbnails: '=',
                        selectedContainer: '=',
                        filter: '=',
                        showPageNumbers: '=',
                        isSpreadBased: '=',
                    },
                    link: function (scope, element, attrs) {

                        var container = element[0],
                            firstTime = true,
                            initialDelay = attrs.delay ? parseInt(attrs.delay) : 0;

                        function doRender() {
                            var time = Date.now();
                            var props = {
                                filmstrip: scope.filmstrip,
                                layout: scope.layout,
                                onGotoId: scope.onGotoId,
                                showInfo: scope.showInfo,
                                thumbScale: scope.thumbScale,
                                layoutController: scope.layoutController,
                                onSelectionChange: scope.onSelectionChange,
                                onFileInfoClick: scope.onFileInfoClick,
                                showAdminInfo: scope.showAdminInfo,
                                disableDimmingThumbnails: scope.disableDimmingThumbnails,
                                filter: scope.filter,
                                rangeSelectionMode: scope.rangeSelectionMode,
                                selectedContainer: scope.selectedContainer,
                                showPageNumbers: scope.showPageNumbers,
                                isSpreadBased: scope.isSpreadBased
                            };

                            ReactDOM.render(React.createElement(FilmstripComponent, props), container);
                            //console.log('filmstrip render', (Math.round(Date.now() - time)/1000)+' s');
                        }

                        var renderDebounced = $debounce(doRender);

                        var watchFn = function(val, oldVal) {
                            if (val===oldVal) return;
                            //renderDebounced();
                            doRender();
                        };

                        var toWatch = ['filmstrip._version', 'filmstrip.items.length', 'showInfo', 'thumbScale', 'filter'];
                        _.each(toWatch, function (prop) {
                            scope.$watch(prop, watchFn, false);
                        });

                        renderDebounced();

                        // cleanup when scope is destroyed
                        scope.$on('$destroy', function () {
                            setTimeout(function() {
                                ReactDOM.unmountComponentAtNode(container);
                            }, 1000);
                        });
                    }
                };
    }]);
