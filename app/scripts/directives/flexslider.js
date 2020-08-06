'use strict';

angular.module('paceApp')
    .directive('flexslider', ['$timeout', '$compile', '$rootScope', '$window', function ($timeout, $compile, $rootScope, $window) {
        return {
            restrict: 'A',
            controller: ['$scope', '$element', '$attrs', function(scope, element, attrs) {

                this.resizeHandler = function() {
                    if (element.find('.flex-direction-nav .flex-prev').hasClass('flex-disabled') &&
                        element.find('.flex-direction-nav .flex-next').hasClass('flex-disabled')) {
                        element.addClass('nav-off');
                    } else {
                        element.removeClass('nav-off');
                    }
                };

                this.initSlider = function() {
                    if (this.initialized) {
                        return;
                    }

                    var slideWidth = 0,
                        animationLoop = (attrs.sliderLoop === 'true'),
                        autostart = (attrs.sliderAutostart === 'true'),
                        controlNav = (attrs.controlNav === 'true'),
                        animationSpeed = (attrs.animationSpeed) ? parseInt(attrs.animationSpeed) : 600,
                        slideshowSpeed = (attrs.slideshowSpeed) ? parseInt(attrs.slideshowSpeed) : 7000;

                    if (attrs.useSlideWidth === 'true') {
                        slideWidth = parseInt(element.find('li').first().data('slide-width'), 10);
                    } else {
                        slideWidth = parseInt(attrs.slideWidth, 10);
                    }

                    controlNav = true;

                    element.flexslider({
                        animation: "slide",
                        animationLoop: animationLoop,
                        slideshow: autostart,
                        controlNav: controlNav,
                        itemWidth: slideWidth,
                        slideshowSpeed: slideshowSpeed,
                        animationSpeed: animationSpeed
                    });

                    //this code below eliminates annoying flickering
                    element.css('visibility', 'visible');
                    $timeout(function(){
                        element.find('[flexslider-item]').css('visibility', 'visible');
                    });

                    this.resizeHandler();
                    this.initialized = true;

                    //console.log('slider init')
                };


                var initScheduled = false;
                this.scheduleInit = function() {
                    if (initScheduled)
                        return;

                    initScheduled = true;

                    if (this.initialized) {
                        var slider = element.data('flexslider'),
                            n = slider.count;

                        for (var i = 0; i < n; i++) {
                            slider.removeSlide(0);
                        }
                    }

                    var that = this;
                    $timeout(function() {

                        if (that.initialized) {

                            var slider = element.data('flexslider');

                            var items = element.find('[flexslider-item]');
                            items.each( function() {
                                slider.addSlide( this );
                            });

                            $timeout(function(){
                                items.css('visibility', 'visible');
                            });
                        } else {
                            that.initSlider();
                        }

                        initScheduled = false;
                    });
                };

            }],
            compile: function(element, attrs) {
                element.css('visibility', 'hidden');
                return {
                    post: function postLink(scope, element, attrs, ctrl) {

                        var $$window = $($window);
                        $$window.resize(ctrl.resizeHandler);

                        //clean up when the element is destroyed
                        element.on('$destroy', function() {
                            $$window.unbind('resize', ctrl.resizeHandler);
                        });

                    }
                };
            }
        };
    }])
    .directive('flexsliderItem', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        return {
            restrict: 'A',
            require: '^flexslider',
            link: function postLink(scope, element, attrs, ctrl) {
                element.css('visibility', 'hidden');

                ctrl.scheduleInit();
            }
        };
    }]);
