'use strict';

angular.module('pace.build')
    .controller('NumericOptionSubsectionCtrl', ['$scope', 'section', 'sectionItem', '$state', 'product', 'secondaryOption', 'ProductPrototype',
            'nextSection', 'productPrototype', 'BuildService', 'ProductService', 'sections',
        function ($scope, section, sectionItem, $state, product, secondaryOption, ProductPrototype,
            nextSection, productPrototype, BuildService, ProductService, sections) {
        
        var lastItem = section.children.indexOf(sectionItem)===section.children.length-1;

        $scope.model.label = sectionItem.displayLabel;
        $scope.model.description = sectionItem.displayPrompt;
        $scope.optionCode = sectionItem.prototypeProductOption.effectiveCode;

        $scope.model.nextButtonVisible = true;
        $scope.model.nextButtonEnabled = !!product.options[$scope.optionCode];
        $scope.model.nextButtonLabel = 'Next';
        $scope.model.optionalAddOn = false;
        $scope.model.currentOptionCode = $scope.optionCode;
        $scope.product = product;
        $scope.step = 1;
        $scope.min = 1;
        $scope.max = 1000;

        $scope.label = sectionItem.displayLabel;

        var prototypeProductOption = productPrototype.getPrototypeProductOption(sectionItem.prototypeProductOption.effectiveCode);

        var isLastRequiredOption = (lastItem && !nextSection && prototypeProductOption.isRequired);
        if (isLastRequiredOption) {
            $scope.model.nextButtonLabel = 'Done';
        }

        
        var params = prototypeProductOption.effectiveParams;
        if (params) {
            if (params.min) {
                $scope.min = ProductService.evalExpression(params.min, product);
            }
            if (params.max) {
                $scope.max = ProductService.evalExpression(params.max, product);
            }
            if (params.counterLabel) {
                $scope.label = params.counterLabel;
            }
        }

        if ($scope.optionCode==='_pageCount') {
            if (productPrototype.productPageType==='PageBased') {
                $scope.label = 'Sides';
                $scope.step = 2;
            } else {
                $scope.label = 'Spreads';
            }
        }

        $scope.onNumericOptionChange = function() {
            $scope.model.nextButtonEnabled = !!product.options[$scope.optionCode];
        };

        $scope.$on('build-next-click', function() {
            if (isLastRequiredOption) {
                $scope.finishCoverBuilderWorkflow();
            } else {
                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
            }
        });

        $scope.$on('build-back-click', function() {
            if (sectionItem.prototypeProductOption.systemAttribute==='ProductPrototype') {
                //go back to the previous option
                var idx = section.children.indexOf(sectionItem),
                    prevItem = section.children[idx-1];

                $state.go('build.section.option', {
                    section:section.url, 
                    productId: $state.params.productId,
                    optionUrl: prevItem.url
                });
                return;   
            } else if (sectionItem.prototypeProductOption.systemAttribute==='ProductCategory') {
                $state.go('dashboard.default.overview');
                return;
            }
            
            $state.go('^');
        });
        
    }]);
