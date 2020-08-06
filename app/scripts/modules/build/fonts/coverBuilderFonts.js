'use strict';

angular.module('pace.build')
.constant('CoverBuilderFonts', 
    {
        name: 'Fonts',
        defaultFontFamily: '(product.options.bookMaterial!="leather" && product.options.bookMaterial!="vintage_leather") ? "TWCRegular" : "NewsGothicRegular" ',
        defaultFontSize: '["LL", "LP", "LS"].indexOf(product.options.size)>=0 ? 60 : 48',
        fonts: [
            {
                displayName: 'Bernhard Gothic Light',
                styles: [
                    {
                        displayName: 'Light',
                        fontFamily: 'BernhardGothicLight'
                    },
                ],
                sizes: [
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
                alt: 'KabelLight',
                //visibilityExpression: '["LL", "LP", "LS"].indexOf(product.options.size)>=0'
            },
            
            {
                displayName: 'Bodoni Bold',
                styles: [
                    {
                        displayName: 'Bold',
                        fontFamily: 'BodoniBold',
                    },
                ],
                sizes: [
                    {
                        displayName: '36pt',
                        fontSize: 36
                    },
                    {
                        displayName: '48pt',
                        fontSize: 48
                    },
                    {
                        displayName: '60pt',
                        fontSize: 60
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
                visibilityExpression: 'product.options.bookMaterial!="leather" && product.options.bookMaterial!="vintage_leather" && product.options.bookMaterial!="natural_linen"'
            },

            {
                displayName: 'Futura Medium',
                styles: [  
                    {
                        displayName: 'Medium',
                        fontFamily: 'FuturaMedium',
                    },
                ],
                sizes: [
                    {
                        displayName: '84pt',
                        fontSize: 84
                    }
                ],
                alt: 'TWCRegular',
            },  

            {
                displayName: 'Garamond Bold',
                styles: [
                    {
                        displayName: 'Bold',
                        fontFamily: 'GaramondBold',
                    },
                ],
                sizes: [
                    {
                        displayName: '36pt',
                        fontSize: 36,
                        restrict: 'WJ'
                    },
                    {
                        displayName: '48pt',
                        fontSize: 48,
                        restrict: 'J'
                    },
                    {
                        displayName: '60pt',
                        fontSize: 60,
                        restrict: 'J'
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72,
                        restrict: 'J'
                    },
                ]
            },

            {
                displayName: 'Kabel Light',
                styles: [  
                    {
                        displayName: 'Light',
                        fontFamily: 'KabelLight',
                    }
                ],
                sizes: [
                    {
                        displayName: '36pt',
                        fontSize: 36
                    },
                    {
                        displayName: '48pt',
                        fontSize: 48
                    },
                    {
                        displayName: '60pt',
                        fontSize: 60
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
                visibilityExpression: 'product.options.bookMaterial!="leather" && product.options.bookMaterial!="vintage_leather"'
            },

            {
                displayName: 'Lydian Bold Italic',
                styles: [
                    {
                        displayName: 'Bold Italic',
                        fontFamily: 'LydianBoldItalic',
                    }
                ],
                sizes: [
                    {
                        displayName: '60pt',
                        fontSize: 60
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
                alt: 'TWCRegular',
                //visibilityExpression: '["LL", "LP", "LS"].indexOf(product.options.size)>=0'
            },

            {
                displayName: 'News Gothic',
                styles: [  
                    {
                        displayName: 'Regular',
                        fontFamily: 'NewsGothicRegular',
                    }
                ],
                sizes: [
                    {
                        displayName: '36pt',
                        fontSize: 36
                    },
                    {
                        displayName: '48pt',
                        fontSize: 48
                    },
                    {
                        displayName: '60pt',
                        fontSize: 60
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
            },

            {
                displayName: 'Twentieth Century Medium',
                styles: [  
                    {
                        displayName: 'Regular',
                        fontFamily: 'TWCRegular',
                    }
                ],
                sizes: [
                    {
                        displayName: '30pt',
                        fontSize: 30
                    },
                    {
                        displayName: '36pt',
                        fontSize: 36
                    },
                    {
                        displayName: '48pt',
                        fontSize: 48
                    },
                    {
                        displayName: '60pt',
                        fontSize: 60
                    },
                    {
                        displayName: '72pt',
                        fontSize: 72
                    },
                ],
                visibilityExpression: 'product.options.bookMaterial!="leather" && product.options.bookMaterial!="vintage_leather"'
            }

            
        ]
    }
    
);

