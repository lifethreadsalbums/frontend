'use strict';

angular.module('pace.build')
    .controller('SectionItemListCtrl', ['$rootScope','$scope', 'items', '$state', 'section', 'nextSection',
        'prevSection', 'BuildService', 'productPrototype', 'product', 'ProductService', '$parse', 'ngDialog',
        'TourService', 'ProductBuilderTourService', '$timeout', 'TourEvent', 'sections',
    function ($rootScope, $scope, items, $state, section, nextSection,
              prevSection, BuildService, productPrototype, product, ProductService, $parse, ngDialog,
              TourService, ProductBuilderTourService, $timeout, TourEvent, sections) {

        items = angular.copy(items);

        var requiredItems = [],
            optionalItems = [];

        _.each(items, function(item) {
            if (item.optionCode==='_duplicates') {
                if (!product.parentId)
                    optionalItems.push(item);
                return;
            }

            var prototypeProductOption = productPrototype.getPrototypeProductOption(item.optionCode);

            var visible = true;
            if (prototypeProductOption.visibilityExpression) {
                visible = ProductService.evalExpression(prototypeProductOption.visibilityExpression, product);
            }
            if (!visible) return;

            if (prototypeProductOption.isRequired)
                requiredItems.push(item);
            else
                optionalItems.push(item);
        });

        var isSinglePrintProduct = (productPrototype.productType==='SinglePrintProduct');

        $scope.model.label = section.displayLabel;
        $scope.model.description = section.displayPrompt;
        $scope.requiredItems = requiredItems;
        $scope.optionalItems = optionalItems;
        $scope.section = section;
        $scope.model.nextButtonLabel = nextSection ? 'Next' : 'Done';
        $scope.model.optionalAddOn = false;
        $scope.model.printsOption = isSinglePrintProduct;

        if (isSinglePrintProduct) {
            $scope.$watch('product.options', function() {
                updateSelection();
            }, true);
        }

        function updateSelection() {
            var numNotSelected = 0,
                numSelected = 0,
                productView = ProductService.getProductViewModel(product, productPrototype);
            angular.forEach(items, function(item) {
                var desc = productView.options[item.optionCode],
                    required = requiredItems.indexOf(item)>=0;

                if (required && !desc)
                    numNotSelected++;
                numSelected += desc ? 1 : 0;

                item.description = desc || 'None selected';
                item.disabled = required && numNotSelected>1 && !desc;
                item.selectionDone = !!desc;

                if (!$scope.editable && item.optionCode==='_duplicates')
                    item.disabled = true;

                var prototypeProductOption = productPrototype.getPrototypeProductOption(item.optionCode);

                if (prototypeProductOption && prototypeProductOption.enabledExpression) {
                    item.disabled = !(ProductService.evalExpression(prototypeProductOption.enabledExpression, product));
                }

            });
            $scope.model.nextButtonEnabled = true;
            $scope.model.nextButtonVisible = numNotSelected===0;

            if (!nextSection && isSinglePrintProduct) {
                $scope.model.nextButtonVisible = false;
            }

            if (requiredItems.length===0 && numSelected===0) {
                $scope.model.nextButtonLabel = 'Skip';
            }
        }

        $scope.onItemClick = function(item) {
            $scope.model.sidebarAnimation = 'left';
        };

        $scope.$on('build-next-click', function(event) {
            if (nextSection && nextSection.url) {
                BuildService.goToNextWizardStep(null, section, sections, productPrototype, product);
            } else {
                $scope.finishCoverBuilderWorkflow();
            }
        });

        $scope.$on('build-back-click', function() {
            //history.back();
            BuildService.goToNextWizardStep(null, section, sections, productPrototype, product, false, -1);
        });

        $scope.addDuplicate = function() {
            $scope.addingDuplicate = true;
        };

        $scope.onOptionChange = function(item) {
            updateSelection();
        };

        updateSelection();

        var deregisterStartTour = $rootScope.$on(TourEvent.StartTour, function(event, data) {
            if (data.id === 'productBuilder') {
                startBuilderCreationTour(true);
            }
        });

        if ($state.current.name === 'build.section' && !$state.params.screenshot &&
            $scope.requiredItems.length > 0 && !$rootScope.isSinglePrintProduct) {
            $timeout(function() {
                startBuilderCreationTour();
            }, 700);
        }

        function startBuilderCreationTour(forceStart) {
            $timeout(function() {
                TourService.start({
                    id: 'productBuilder',
                    config: ProductBuilderTourService.getConfig($scope),
                    forceStart: forceStart
                });
            });
        }


        $scope.$on('$destroy', function() {
            deregisterStartTour();
        });

    }])
    .controller('BuildCompletePopupCtrl', ['$scope', '$state', '$rootScope', function ($scope, $state, $rootScope) {

        $scope.goto = function(state) {
            $rootScope['buildSpinner'] = true;
            $state.go(state, {productId:$scope.productId});
            return true;
        };

    }]);
