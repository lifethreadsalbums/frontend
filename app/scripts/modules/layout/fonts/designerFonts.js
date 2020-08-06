'use strict';

angular.module('pace.layout')
.constant('DesignerFonts',
    [
        {
            displayName: 'Adelicia Script',
            styles: [
                {
                    displayName: 'Clean',
                    fontFamily: 'AdeliciaScriptClean',
                    group: 'Adelicia Script'
                },
                {
                    displayName: 'Rough',
                    fontFamily: 'AdeliciaScriptRough',
                    group: 'Adelicia Script'
                },
                {
                    displayName: 'Slant',
                    fontFamily: 'AdeliciaScriptSlant',
                    group: 'Adelicia Script'
                },
                {
                    displayName: 'Slant Rough',
                    fontFamily: 'AdeliciaScriptSlantRough',
                    group: 'Adelicia Script'
                }
            ]
        },

        {
            displayName: 'Bickham Script Pro',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'BickhamScriptProRegular',
                    group: 'Bickham Script Pro',
                    previewSize: 28
                },
                {
                    displayName: 'Semibold',
                    fontFamily: 'BickhamScriptProSemibold',
                    group: 'Bickham Script Pro'
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'BickhamScriptProBold',
                    bold: true,
                    group: 'Bickham Script Pro'
                }
            ]
        },

        {
            displayName: 'Bernhard Gothic Light',
            styles: [
                {
                    displayName: 'Light',
                    fontFamily: 'BernhardGothicLight',
                    group: 'Bernhard Gothic Light'
                },
            ],
        },

        {
            displayName: 'Bodoni',
            styles: [
                {
                    displayName: 'Roman',
                    fontFamily: 'BodoniRoman',
                    group: 'Bodoni'
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'BodoniItalic',
                    italic: true,
                    group: 'Bodoni'
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'BodoniBold',
                    bold: true,
                    group: 'Bodoni'
                },
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'BodoniBoldItalic',
                    bold: true,
                    italic: true,
                    group: 'Bodoni'
                },
                {
                    displayName: 'Book',
                    fontFamily: 'BodoniBook',
                    group: 'Bodoni Book'
                },
                {
                    displayName: 'Book Italic',
                    fontFamily: 'BodoniBookItalic',
                    italic: true,
                    group: 'Bodoni Book'
                },
            ]
        },

        {
            displayName: 'Burgues Script',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'BurguesScript',
                    group: 'Burgues Script',
                    previewSize: 22
                },
            ],
        },

        {
            displayName: 'Fakt',
            styles: [
                {
                    displayName: 'Blond',
                    fontFamily: 'FaktBlond',
                    group: 'Fakt'
                },
                {
                    displayName: 'Medium',
                    fontFamily: 'FaktMedium',
                    group: 'Fakt'
                },
            ]
        },

        {
            displayName: 'Futura Medium',
            styles: [
                {
                    displayName: 'Medium',
                    fontFamily: 'FuturaMedium',
                    group: 'Futura'
                },
            ],
        },

        {
            displayName: 'Garamond Pro',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'GaramondRegular',
                    group: 'Garamond Pro'
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'GaramondBold',
                    bold: true,
                    group: 'Garamond Pro'
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'GaramondItalic',
                    italic: true,
                    group: 'Garamond Pro'
                },
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'GaramondBoldItalic',
                    bold: true,
                    italic: true,
                    group: 'Garamond Pro'
                },
            ]
        },

        {
            displayName: 'GillSans',
            styles: [
                {
                    displayName: 'Light',
                    fontFamily: 'GillSansLight',
                    group: 'GillSans'
                },
                {
                    displayName: 'Light Italic',
                    fontFamily: 'GillSansLightItalic',
                    italic: true,
                    group: 'GillSans'
                }
            ]
        },

        {
            displayName: 'Helvetica',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'HelveticaRegular',
                    group: 'Helvetica'
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'HelveticaBold',
                    bold: true,
                    group: 'Helvetica'
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'HelveticaOblique',
                    italic: true,
                    group: 'Helvetica'
                },
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'HelveticaBoldOblique',
                    bold: true,
                    italic: true,
                    group: 'Helvetica'
                }
            ]
        },

        {
            displayName: 'Helvetica Neue',
            previewFontFamily: 'HelveticaNeueUltraLight',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'HelveticaNeueRegular',
                    group: 'Helvetica Neue',
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'HelveticaNeueItalic',
                    italic: true,
                    group: 'Helvetica Neue',
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'HelveticaNeueBold',
                    bold: true,
                    group: 'Helvetica Neue',
                },
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'HelveticaNeueBoldItalic',
                    italic: true,
                    bold: true,
                    group: 'Helvetica Neue',
                },

                {
                    displayName: 'Light',
                    fontFamily: 'HelveticaNeueLight',
                    group: 'Helvetica Neue Light',
                },
                {
                    displayName: 'Light Italic',
                    fontFamily: 'HelveticaNeueLightItalic',
                    italic: true,
                    group: 'Helvetica Neue Light',
                },
                {
                    displayName: 'Ultra Light',
                    fontFamily: 'HelveticaNeueUltraLight',
                    isDefault: true,
                    group: 'Helvetica Neue Ultra Light',
                },
                {
                    displayName: 'Ultra Light Italic',
                    fontFamily: 'HelveticaNeueUltraLightItalic',
                    italic: true,
                    group: 'Helvetica Neue Ultra Light',
                },
                {
                    displayName: 'Condensed Black',
                    fontFamily: 'HelveticaNeueCondensedBlack',
                    group: 'Helvetica Neue Condensed',
                },
                {
                    displayName: 'Condensed Bold',
                    fontFamily: 'HelveticaNeueCondensedBold',
                    bold: true,
                    group: 'Helvetica Neue Condensed',
                }
            ]
        },

        {
            displayName: 'Kabel',
            styles: [
                {
                    displayName: 'Light',
                    fontFamily: 'KabelLight',
                }
            ]
        },

        {
            displayName: 'Lydian Bold Italic',
            styles: [
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'LydianBoldItalic',
                    bold: true,
                    italic: true
                }
            ],
        },


        {
            displayName: 'Melika',
            tooltip: 'Melika Letter & Script',
            styles: [
                {
                    displayName: 'Letter',
                    fontFamily: 'MelikaLetter',
                    group: 'Melika'
                },
                {
                    displayName: 'Script',
                    fontFamily: 'MelikaScript',
                    group: 'Melika'
                }
            ]
        },

        {
            displayName: 'News Gothic',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'NewsGothicRegular',
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'NewsGothicItalic',
                    italic: true
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'NewsGothicBold',
                    bold: true
                }
            ]
        },

        {
            displayName: 'TT Slug',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'TTSlug',
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'TTSlugBold',
                    bold: true
                }
            ]
        },

        {
            displayName: 'Trajan Pro',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'TrajanProRegular',
                },
                {
                    displayName: 'Bold',
                    fontFamily: 'TrajanProBold',
                    bold: true
                }
            ]
        },

        {
            displayName: 'Twentieth Century Medium',
            styles: [
                {
                    displayName: 'Regular',
                    fontFamily: 'TWCRegular',
                },
                {
                    displayName: 'Italic',
                    fontFamily: 'TWCItalic',
                    italic: true
                }
            ]
        }

/*
        {
            displayName: 'Bernhard Gothic',
            styles: [
                {
                    displayName: 'Light',
                    fontFamily: 'BernhardGothicLight'
                },
                {
                    displayName: 'Medium',
                    fontFamily: 'BernhardGothicMedium',
                },
            ]
        },

        {
            displayName: 'Futura',
            styles: [
                {
                    displayName: 'Medium',
                    fontFamily: 'FuturaMedium',
                },
            ]
        },

        {
            displayName: 'Lydian',
            styles: [
                {
                    displayName: 'Bold Italic',
                    fontFamily: 'LydianBoldItalic',
                }
            ]
        },
*/

    ]
)
.constant('FontEvent', {
    FontsLoaded: 'FontEvent:FontsLoaded'
})
.service('FontLoader', ['DesignerFonts', 'CoverBuilderFonts', '$rootScope', 'FontEvent', function(DesignerFonts, CoverBuilderFonts, $rootScope, FontEvent) {

    this.load = function() {

        PACE.FontsLoaded = false;

        var families = _.pluck(_.flatten(_.pluck(DesignerFonts, 'styles')), 'fontFamily'),
            families2 = _.pluck(_.flatten(_.pluck(CoverBuilderFonts.fonts, 'styles')), 'fontFamily');


        WebFont.load({
            custom: { families: families.concat(families2) },
            classes: false,
            loading: function() {
                //console.log('loading fonts');
            },
            active: function() {
                PACE.FontsLoaded = true;
                $rootScope.$broadcast(FontEvent.FontsLoaded);
                //console.log('fonts loaded');
            }
        });

    };

}]);

