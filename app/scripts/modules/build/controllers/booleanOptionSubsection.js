'use strict';

angular.module('pace.build')
    .controller('BooleanOptionSubsectionCtrl', ['$scope', 'section', 'sectionItem', '$state', 'product', 'secondaryOption', 'ProductPrototype',
            'nextSection', 'productPrototype', 'BuildService', 'sections',
        function ($scope, section, sectionItem, $state, product, secondaryOption, ProductPrototype,
            nextSection, productPrototype, BuildService, sections) {

        var optionCode = sectionItem.prototypeProductOption.effectiveCode,
            prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode);
        
        var lastItem = section.children.indexOf(sectionItem)===section.children.length-1;

        $scope.model.label = sectionItem.displayLabel;
        $scope.model.description = sectionItem.displayPrompt;
        $scope.optionCode = optionCode;
        
        $scope.model.nextButtonVisible = true;
        $scope.model.nextButtonEnabled = true;
        $scope.model.nextButtonLabel = 'Next';
        $scope.model.optionalAddOn = !prototypeProductOption.isRequired;;
        $scope.model.currentOptionCode = $scope.optionCode;
        $scope.model.printsOption = sectionItem.type==='BuildPrintsBooleanOptionWidget';
        $scope.product = product;

        if (sectionItem.params && sectionItem.params.yesNo) {
            $scope.yesNo = true;
        }
        
        if (prototypeProductOption.defaultValue!=='false' && (_.isUndefined(product.options[$scope.optionCode]) || _.isNull(product.options[$scope.optionCode])) ) {
            //set default true
            product.options[$scope.optionCode] = true;
        }

        $scope.onOptionChange = function() {
            $scope.fillDefaultValues();
            if ($scope.model.viewCtrl) {
                $scope.model.viewCtrl.refresh();
            }
            if (product.options[$scope.optionCode]) {
                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
            }
        };

        $scope.$on('build-next-click', function() {
            BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
        });

        $scope.$on('build-back-click', function() {
            history.back();
        });
        
        $scope.$on('build-remove-optional-addon-click', function() {
            $scope.model.sidebarAnimation = 'right';
            product.options[optionCode] = null;
            $state.go('^');
        });
    }]);
