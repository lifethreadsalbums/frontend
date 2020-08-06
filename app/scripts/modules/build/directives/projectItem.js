'use strict';

angular.module('pace.build')
    .directive('projectItem', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            transclude: true,
            link: function postLink(scope, element, attrs) {
                if (attrs.type == 'album' && scope.product) {
                    var currentStep = '',
                        stepOptions = element.find('.step-options'),
                        stepSaveFav = element.find('.step-save-fav'),
                        stepInfo = element.find('.step-info'),
                        saveFavBtn = element.find('.save-fav-btn'),
                        infoBtn = element.find('.info-btn');

                    var closeOptions = function(closeAll) {
                        $('#build .projects ul li.album').each(function() {
                            var self = $(this);

                            if ( ! self.is(element) || closeAll === true) {
                                self.removeClass('options-on');
                                self.find('.step-options').show();
                                self.find('.step-save-fav').hide();
                                self.find('.step-info').hide();
                            }
                        });
                    }

                    var changeStep = function(step) {
                        currentStep = step;

                        stepOptions.hide();
                        stepSaveFav.hide();
                        stepInfo.hide();

                        if (step == 'options') {
                            stepOptions.show();
                        } else if (step == 'save-fav') {
                           stepSaveFav.show();
                        } else if (step == 'info') {
                           stepInfo.show();
                        }
                    }
                    changeStep('options');

                    element.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        if ($(e.currentTarget).hasClass('album') || $(e.currentTarget).closest('div').hasClass('preview-container')) {
                            closeOptions();
                        
                            if ( ! element.hasClass('options-on'))
                                element.addClass('options-on');
                        }
                    });

                    saveFavBtn.on('click', function(e) {
                        e.preventDefault();

                        if (scope.product.isFavourite == true) {
                            changeStep('options');

                        } else {
                            changeStep('save-fav');
                        }
                    });

                    infoBtn.on('click', function(e) {
                        e.preventDefault();
                        if (currentStep == 'info')
                            changeStep('options');
                        else
                            changeStep('info');
                    });

                    $(document).on('mouseup', function(e) {
                        var container = $('.album');


                        if ( ! container.is(e.target) && ! $(e.target).closest(container).length) {
                            closeOptions(true);
                        }
                    });
                } else if (attrs.type == 'new') {
                    var newProjectBrn = element.find('new-project');


                } else if (attrs.type == 'browse') {
                    
                }

                element.on('$destroy', function() {
                    if (attrs.type == 'album' && scope.product) {
                        element.unbind('click');
                        $('html').unbind('click');
                        saveFavBtn.unbind('click');
                        infoBtn.unbind('click');
                    }
                })
            },
            template: function(element, attrs) {
                if (attrs.type == 'new') {
                    // new album
                    return  '<li class="new">' +
                                '<a class="new-project" frp-nav data-view="views/build/frp-create.html" data-modal="true">' +
                                    '<span class="icon"></span>' +
                                    '<span class="title">NEW ALBUM</span>' +
                                '</a>' +
                            '</li>';
                } else if (attrs.type == 'browse') {
                    // browse albums
                    return  '<li class="browse">' +
                                '<a href="#/build">' +
                                    '<span class="icon"></span>' +
                                    '<span class="title">' +
                                        'Get Inspired!' +
                                        '<span>Browse the gallery</span>' +
                                    '</span>' +
                                '</a>' +
                            '</li>';
                }

                // album
                return  '<li class="album" ng-class="{favourite:product.isFavourite}" id="{{product.id}}">' +
                            '<div class="preview-container">' +
                                '<img class="preview" src="http://placehold.it/120x102/cccccc/ffffff.png" alt="">' +
                                '<footer>' +
                                    '<span class="spacer"></span>' +
                                    '<span class="spacer"></span>' +
                                    '<span class="title"><span></span>{{product.options._name}}</span>' +
                                '</footer>' +
                            '</div>' +
                            '<div class="options-container">' +
                                '<div class="step step-options">' +
                                    '<ul>' +
                                        '<li class="upload"><a ><span>Upload</span></a></li>' +
                                        '<li class="layout"><a ><span>Layout</span></a></li>' +
                                        '<li class="build"><a ><span>Build</span></a></li>' +
                                        '<li class="orders"><a ><span>Orders</span></a></li>' +
                                    '</ul>' +
                                '</div>' +
                                '<div class="step step-save-fav">' +
                                    '<span class="title">Save Fav As...</span>' +
                                    '<form>' +
                                        '<input type="text" name="fav-name">' +
                                    '</form>' +
                                '</div>' +
                                '<div class="step step-info">' +
                                    '<span>{{product.productInfo}}</span>' +
                                '</div>' +
                                '<footer>' +
                                    '<ul>' +
                                        '<li class="favourites" ng-class="{active:product.isFavourite}"><a class="save-fav-btn"><span></span></a></li>' +
                                        '<li class="information"><a class="info-btn"><span></span></a></li>' +
                                        '<li class="remove"><a ><span></span></a></li>' +
                                    '</ul>' +
                                '</footer>' +
                            '</div>' +
                        '</li>';
            }
        };
    }]);