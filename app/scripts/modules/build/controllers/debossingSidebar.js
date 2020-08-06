'use strict';

angular.module('pace.build')
    .controller('DebossingSidebarCtrl', 
        ['$scope', '$rootScope', 'product', 'productPrototype', '$state', 'sectionItem', 'nextSection', 'section', 'Product', 
            'BuildService', '$timeout', 'coverLayout', 'GeomService', 'ImageReader', 'ImageUploadService', 'UploadEvent',
            'StoreConfig', 'LogoFile', 'MessageService', '$debounce', 'CoverBuilderFonts', 'StampPlaceholder', 'DebossingService', 'DieFile',
            'ImageFile', 'ImageFileStatus', 'DesignerFonts',

        function ($scope, $rootScope, product, productPrototype, $state, sectionItem, nextSection, section, Product, 
            BuildService, $timeout, coverLayout, GeomService, ImageReader, ImageUploadService, UploadEvent, 
            StoreConfig, LogoFile, MessageService, $debounce, CoverBuilderFonts, StampPlaceholder, DebossingService, DieFile,
            ImageFile, ImageFileStatus, DesignerFonts) {

            var optionCode = sectionItem.prototypeProductOption.effectiveCode,
                prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode),
                params = sectionItem.params || {};
                
            $scope.model.label = sectionItem.displayLabel;
            $scope.model.description = sectionItem.displayPrompt;
            $scope.model.nextButtonLabel = 'Next';
            $scope.model.optionalAddOn = !prototypeProductOption.isRequired;
            
            $scope.model.nextButtonVisible = true;
            $scope.model.nextButtonEnabled = true;
            $scope.customDieDPI = params.customDieDPI || 300;

        }]);
