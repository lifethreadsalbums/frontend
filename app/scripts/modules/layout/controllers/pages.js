'use strict';

angular.module('pace.layout')
    .controller('PagesCtrl', ['$scope', 'UndoService',
     function ($scope, UndoService) {

        var layoutController = $scope.layoutController; //get a reference from parent scope

        $scope.layout = { filmStrip:{ items:[] }, spreads:[], layoutSize:{} };
        $scope.coverLayouts = [];
    	$scope.selectedPageIndices = [];
    	$scope.thumbScale = 0.5;

        $scope.initCtrl = function() {
            $scope.$parent.$parent.pagesCtrl = $scope.pagesCtrl;
        };

        this.setupLayout = function(layoutViewData) {
            $scope.layout = layoutViewData.layout;
            $scope.coverLayouts = layoutViewData.coverLayouts;
        };

        this.hidePages = function() {

        };

        this.showPages = function() {

        };

        $scope.deletePages = function() {
        	//console.log($scope.selectedPageIndices)
        	if (!$scope.selectedPageIndices|| $scope.selectedPageIndices.length===0) return;

            var cmd = new PACE.DeletePagesCommand($scope.layout, $scope.selectedPageIndices);
            if ($scope.coverLayouts) {
                var commands = [cmd];
                _.each($scope.coverLayouts, function(coverLayout) {
                    commands.push(new PACE.FixCoverLayoutCommand(coverLayout));
                });
                cmd = new PACE.MacroCommand(commands);
            }
            cmd.execute();
            layoutController.renderAll();
            UndoService.pushUndo(cmd);
        };

        $scope.zoomToFit = function() {
            var container = $('.frp-pages .layout-section__pages-content'),
                w = container.width(),
                h = container.height(),
                thumbContainer = $('.frp-pages .thumb-container').first(),
                padX = 38 * 2,
                padY = 8 * 2,
                tw = (thumbContainer.width() / $scope.thumbScale),
                th = (thumbContainer.height() / $scope.thumbScale);

            var found = false,
                s = 0.1;
            while(!found && s<=2.0) {
                var thumbW = (tw * s) + padX,
                    thumbH = (th * s) + padY;
                var cols = Math.floor(w / thumbW),
                    rows = Math.ceil(layout.spreads.length / cols),
                    height = rows * thumbH;
                if (height>h) {
                    found = true;
                } else {
                   s += 0.05;
                }
            }
            $scope.thumbScale = (s - 0.05);
        };

        $scope.zoomDefault = function() {
            $scope.thumbScale = 0.5;
        };

    }]);
