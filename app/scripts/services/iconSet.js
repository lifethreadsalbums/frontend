'use strict';

angular.module('paceApp')
.factory('IconSet', [function () {
    return {
        'text-orientation':
            [
                {value: 'normal', icon: 'normal'},
                {value: 'top-bottom', icon: 'top-bottom'},
                {value: 'bottom-top', icon: 'bottom-top'}
            ],
        'case':
            [
                {value: 'uppercase', icon: 'uppercase'},
                {value: 'capitalize', icon: 'capitalize'},
                {value: 'lowercase', icon: 'lowercase'}
            ],
        'text-align':
            [
                {value: 'left', icon: 'left'},
                {value: 'center', icon: 'center'},
                {value: 'right', icon: 'right'},
                {value: 'justify', icon: 'justify'}
            ],
        'view-mode':
            [
                {value: 'normal', icon: 'normal'},
                //{value: 'preview', icon: 'preview'},
                //{value: 'trim', icon: 'trim'},
                {value: 'bleed', icon: 'bleed'},
                //{value: 'presentation', icon: 'presentation'}
            ],
        'frame-mode':
            [
                {value: 'frame11', icon: 'frame11'},
                {value: 'frame32', icon: 'frame32'},
            ],
        'new-frame':
            [
                {value: 'new-frame11', icon: 'new-frame11'},
                {value: 'new-frame32', icon: 'new-frame32'},
                {value: 'new-frame', icon: 'new-frame'},
            ],
        'design-tools':
            [
                {value: 'tools5', icon: 'compass'},
                {value: 'tools4', icon: 'type'},
                {value: 'tools3', icon: 'box3'},
                {value: 'tools2', icon: 'box2'},
                {value: 'tools1', icon: 'box'},
            ],
        'design-tools-top':
            [
                {value: 'tools2', icon: 'box2'},
                {value: 'tools1', icon: 'box'}
            ],
        'design-tools-prints':
            [
                //{value: 'tools1', icon: 'box'},
                {value: 'tools2', icon: 'box'},
                //{value: 'tools3', icon: 'box2'},
                {value: 'tools4', icon: 'type'}
            ],
        'image-filters':
            [
                {value: 'bw', icon: 'filter-black-and-white'},
                {value: 'sepia', icon: 'filter-sepia-black-and-white'}
            ],
        'content-flip':
            [
                {value: 'horizontal', icon: 'flip-contenth'},
                {value: 'vertical', icon: 'flip-contentv'}
            ],
        'share':
            [
                {value: 'share', icon: 'share'},
                {value: 'facebook', icon: 'facebook'},
                {value: 'twitter', icon: 'twitter'},
                {value: 'google-plus', icon: 'google-plus'},
                {value: 'pinterest', icon: 'pinterest'},
                {value: 'tumblr', icon: 'tumblr'}
            ],
        'share-medium':
            [
                {value: 'share-medium', icon: 'share-medium'},
                {value: 'facebook-medium', icon: 'facebook-medium'},
                {value: 'twitter-medium', icon: 'twitter-medium'},
                {value: 'google-plus-medium', icon: 'google-plus-medium'},
                {value: 'pinterest-medium', icon: 'pinterest-medium'},
                {value: 'tumblr-medium', icon: 'tumblr-medium'}
            ],
        'auto-arrange':
            [
                {value: 'clear', icon: 'auto-arrange-empty-empty', iconText: 'Reset Pages'},
                {value: 'two-sided-bleed', icon: 'auto-arrange-vertical-horizontal', iconText: '2-Sided Bleed'},
                {value: 'two-sided-bleed-left', icon: 'auto-arrange-horizontal-empty', iconText: '2-Sided Bleed Left Side'},
                {value: 'two-sided-bleed-right', icon: 'auto-arrange-empty-horizontal', iconText: '2-Sided Bleed Right Side'},
                {value: 'four-sided-bleed', icon: 'auto-arrange-cross-cross', iconText: '4-Sided Bleed'},
                {value: 'four-sided-bleed-left', icon: 'auto-arrange-full-empty', iconText: '4-Sided Bleed Left Side'},
                {value: 'four-sided-bleed-right', icon: 'auto-arrange-empty-full', iconText: '4-Sided Bleed Right Side'},
                {value: 'floating-image', icon: 'auto-arrange-vertical-sm-horizontal-sm', iconText: 'Floating'},
                {value: 'floating-image-left', icon: 'auto-arrange-vertical-sm-empty', iconText: 'Floating Left Side'},
                {value: 'floating-image-right', icon: 'auto-arrange-empty-vertical-sm', iconText: 'Floating Right Side'},
                {value: 'double-spread', icon: 'auto-arrange-cross-large', iconText: 'Double Page Spread'}
            ],
        'project-overview':
            [
                {value: 'file', icon: 'file'},
                {value: 'favourite', icon: 'favourite'},
                {value: 'settings', icon: 'settings'},
                {value: 'remove', icon: 'remove'},
                //{value: 'share-medium', icon: 'share-medium', dropdown: true}
            ],
    };
}]);
