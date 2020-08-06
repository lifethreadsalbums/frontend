'use strict';

angular.module('pace.dashboard')
.directive('projectSlider',  [function () {
    return {
        replace: true,
        restrict: 'E',
        scope: {
            projects: '=',
            selectedProject: '=',
            selectedProjects: '='
        },
        templateUrl: 'views/dashboard/projectSlider.html',
        link: function postLink($scope, $element, $attrs) {
            // Init
            $scope.childToggleCtr = 0;
            var slideAmount = 0;
            var slideCurrent = 0;

            function selectProject(project) {
                $scope.selectedProject = project;
                $scope.showChild = project;
            }

            function selectItems(item, ctrl, shift) {
                var tmpItem,
                    items = $scope.projects,
                    itemIndex = items.indexOf(item),
                    active,
                    i;

                var selectedItems = _.where(items, {selected:true}),
                    lastSelectedIndex = selectedItems.length>0 ?
                        items.indexOf(selectedItems[selectedItems.length - 1]) : 0,
                    firstSelectedIndex = selectedItems.length>0 ?
                        items.indexOf(selectedItems[0]) : 0;

                for (i = 0; i < items.length; i++) {
                    tmpItem = items[i];
                    active = false;

                    var isClickedItem = (item===tmpItem) ? true : false;

                    if (shift) {
                        if (itemIndex < lastSelectedIndex) {
                            active = (i >= itemIndex && i <= lastSelectedIndex);
                        } else if (itemIndex > firstSelectedIndex) {
                            active = (i <= itemIndex && i >= firstSelectedIndex);
                        }
                    } else if (ctrl) {
                        active = (!isClickedItem && tmpItem.selected) || (isClickedItem && !tmpItem.selected);
                    } else {
                        active = isClickedItem;
                    }

                    tmpItem.selected = active;
                }

                $scope.selectedProjects = _.where(items, {selected:true});
                if ($scope.selectedProjects.length===1) {
                    selectProject($scope.selectedProjects[0]);
                } else {
                    selectProject(null);
                }
            }

            function childToggleCt(project){

                if (project.children.length <= 0) { return; }

                project.childToggle = !project.childToggle;

                angular.forEach(project.children, function(value, key) {
                    value.childToggle = project.childToggle;
                });

                if(project.childToggle){
                    $scope.childToggleCtr = $scope.childToggleCtr + project.children.length;
                } else {
                    $scope.childToggleCtr = $scope.childToggleCtr - project.children.length;
                }

                $scope.stackOrder = true;
            }

            function setScrollPosition(pos) {
                var sliderWidth = $element.find('.project-slider__wrapper').width(),
                    contentWidth = $element.find('.project-slider__slides').width(),
                    min = 0,
                    max = Math.max(0, contentWidth - sliderWidth);

                slideAmount = pos;
                if (slideAmount<min) slideAmount = min;
                if (slideAmount>max) slideAmount = max;

                var translate = 'translate3d(' + (-slideAmount) + 'px, 0px, 0px)';
                $scope.slide = {'-webkit-transform' : translate ,
                                '-moz-transform' : translate ,
                                '-o-transform' : translate ,
                                '-ms-transform' : translate ,
                                'transform' : translate } ;
            };

            function slideTo(direction) {
                var sliderWidth = $element.find('.project-slider__wrapper').width();
                setScrollPosition(slideAmount + (sliderWidth * direction));
            }

            $scope.onItemMouseDown = function(item, e) {
                var shift = e.shiftKey,
                    ctrl = e.ctrlKey || e.metaKey;

                selectItems(item, ctrl, shift);
            };

            $scope.childToggle = false;
            $scope.childToggleCt = childToggleCt;
            $scope.selectProject = selectProject;
            $scope.slideTo = slideTo;

            $scope.$on('dashboard:scroll-to-selection', function() {
                var p = _.findWhere($scope.projects, {selected:true});
                if (p) {
                    var sliderWidth = $element.find('.project-slider__wrapper').width(),
                        projectWidth = $element.find('.project-overview').first().outerWidth(),
                        idx = $scope.projects.indexOf(p);

                    setScrollPosition( Math.round((projectWidth * idx) - sliderWidth/2 + projectWidth/2) );
                }
            });

        }
    };
}]);
