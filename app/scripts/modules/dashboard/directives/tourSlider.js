'use strict';

angular.module('pace.dashboard')
.directive('tourSlider',  [function () {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs, ctrl) {
            var doneBtn = $('.tour__navigation-button--isDone');

            element.flexslider({
                animation: 'fade',
                animationLoop: false,
                slideshow: false,
                controlNav: false,
                directionNav: true,
                customDirectionNav: $('.tour__navigation-button--isStep'),
                before: function(slider) {
                    if (slider.count === slider.currentSlide + 2) {
                        doneBtn.removeClass('hidden-force');
                    } else {
                        doneBtn.addClass('hidden-force');
                    }
                }
            });
        }
    }
}]);
