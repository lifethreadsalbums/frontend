'use strict';

angular.module('pace.build')
    .controller('PrintsSizesSidebarCtrl',
        ['$scope', '$rootScope', 'product', 'productPrototype', '$state', 'sectionItem', 'nextSection', 'section', 'Product',
            'BuildService', '$timeout', 'GeomService', 'StoreConfig', '$debounce', 'layoutSizeOption', 'SpoPackage', 'sections',

        function ($scope, $rootScope, product, productPrototype, $state, sectionItem, nextSection, section, Product,
            BuildService, $timeout, GeomService, StoreConfig, $debounce, layoutSizeOption, SpoPackage, sections) {

            var optionCode = sectionItem.prototypeProductOption.effectiveCode,
                prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode),
                params = sectionItem.params || {};

            $scope.model.label = sectionItem.displayLabel;
            $scope.model.description = sectionItem.displayPrompt;
            $scope.model.nextButtonLabel = 'Next';
            $scope.model.optionalAddOn = !prototypeProductOption.isRequired;

            $scope.model.nextButtonVisible = true;
            $scope.model.nextButtonEnabled = true;
            $scope.model.printsSizesVisible = true;
            $scope.model.printsOption = true;

            var layoutSizes = _.map(layoutSizeOption.prototypeProductOptionValues, function(v) {
                var layoutSize = angular.copy(v.layoutSize);
                layoutSize.shape = 'square';
                layoutSize.group = 'Square Sizes';
                var ratio = layoutSize.width/layoutSize.height,
                    tolerance = 0.01;
                if (ratio > 1.5) {
                    layoutSize.shape = 'panoramic';
                    layoutSize.group = 'Panoramic Sizes';
                } else if (ratio > 1 + tolerance) {
                    layoutSize.shape = 'horizontal';
                    layoutSize.group = 'Rectangular Sizes';
                } else if (ratio < 1 - tolerance) {
                    layoutSize.shape = 'vertical';
                    layoutSize.group = 'Rectangular Sizes';
                }
                if (v.productOptionValue.params && v.productOptionValue.params.category) {
                    layoutSize.group = v.productOptionValue.params.category;
                }
                layoutSize.ratio = ratio;
                layoutSize.label = v.displayName;
                layoutSize.code = v.code;
                layoutSize.visibilityExpression = v.visibilityExpression;
                if (layoutSize.gridX>0) {
                    layoutSize.gridCells = _.range(layoutSize.gridX * layoutSize.gridY);
                }
                return layoutSize;
            });

            layoutSizes = _.sortBy(layoutSizes, function(ls) {
                return (ls.width * 10000) + ls.height;
            })

            var sizeGroups = _.map(_.uniq(_.pluck(layoutSizes, 'group')), function(g) {
                return {id: g, label: g};
            });
            sizeGroups = _.sortBy(sizeGroups, 'label');

            $scope.sizeTypeOptions = sizeGroups.concat([
                {id: 'sep-1', divider: true, disabled: true},
                {id:'myPackages', label: 'My Packages'},
                {id:'suggestedPackages', label: 'Suggested Packages'},
            ]);

            $scope.model.sizeTypeOption = 'Rectangular Sizes';
            $scope.sizeOptions = layoutSizes;

            $scope.$watch('model.sizeTypeOption', function(val) {
                if (val==='myPackages') {
                    //load my packages
                    $scope.myPackages = SpoPackage.query();
                }
            });

            $scope.$on('prints:package-saved', function() {
                if ($scope.model.sizeTypeOption !== 'myPackages') {
                    $scope.model.sizeTypeOption = 'myPackages';
                } else {
                    $scope.myPackages = SpoPackage.query();    
                }
                console.log('package-saved event received');
            });

            $scope.$on('prints:package-deleted', function(event, p) {
                $scope.myPackages = _.without($scope.myPackages, p);
                console.log('package-deleted event received');
            });

            $scope.$on('build-next-click', function() {
                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
            });

            $scope.$on('build-back-click', function() {
                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product, false, -1);
            });

            $scope.$on('$destroy', function() {
                $scope.model.printsSizesVisible = false;
            });

            $scope.selectPackage = function(spoPackage) {
                _.each($scope.myPackages, function(p) {
                    p.isSelected = p === spoPackage;
                });
                $scope.model.selectedPackage = spoPackage;
            };

        }]);
