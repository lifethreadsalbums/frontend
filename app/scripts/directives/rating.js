'use strict';

angular.module('paceApp')
.directive('rating',['ImageFile','$parse', function (ImageFile, $parse) {
    return {
        replace:true,
        restrict: 'E',
        scope: {
            item: '=?'
        },        
        link: function(scope, element, attrs, ctrl) {
            scope.$watch('item', function(){
                scope.rating = attrs.item;
                scope.updateRatingStars();
            });

            scope.updateRatingStars = function() {
                var rating = scope.item.image.rating;
                angular.element(element.children()).each(function (i) {
                    angular.element(this)[i < rating ? 'addClass' : 'removeClass']('active');
                });
               
            };
            
            scope.hoverRatingStars = function(rating) {
                 
                angular.element(element.children()).each(function (i) {

                    angular.element(this)[i < rating ? 'addClass' : 'removeClass']('active');
                });

            };

            // expects an integer from set [1, 5]
            scope.setRating = function(rating) {
                if (scope.item.image.rating === rating){
                    rating = 0;
                }
                ImageFile.update({
                    id: scope.item.image.id,
                    patches: [{
                        type: 'REPLACE',
                        path: 'rating',
                        val: rating
                    }]
                }).$promise.then(function () {
                    scope.item.image.rating = rating;
                    scope.updateRatingStars();
                });
            };
         
        },
        template: '  <ul class="rating" ng-mouseleave="updateRatingStars()" > ' + 
        '<li ng-click="setRating(1)" ng-mouseenter="hoverRatingStars(1)"><a></a></li>' +
        '<li ng-click="setRating(2)" ng-mouseenter="hoverRatingStars(2)"><a></a></li>' +
        '<li ng-click="setRating(3)" ng-mouseenter="hoverRatingStars(3)"><a></a></li>' +
        '<li ng-click="setRating(4)" ng-mouseenter="hoverRatingStars(4)"><a></a></li>' +
        '<li ng-click="setRating(5)" ng-mouseenter="hoverRatingStars(5)"><a></a></li>' +
        '</ul>'
    };
}]);
