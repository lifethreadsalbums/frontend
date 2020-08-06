'use strict';

angular.module('paceApp')
.directive('addressform', ['TermService', function (TermService) {
    return {
        templateUrl: 'views/components/addressForm.html',
        replace:true,
        restrict: 'E',
        require: 'form',
        link: function postLink(scope, element, attrs, ctrl) {

            scope.form = ctrl;            
            ctrl.required = attrs.isRequired === 'true';
            scope.companyRequired = attrs.companyRequired === 'true';
            scope.dropShipping = attrs.dropShipping === 'true';
            scope.companyDisabled = attrs.companyDisabled === 'true';

            function fixPhoneCountry(countries) {
                if (!scope.address) return;

                var result = /\+(\d+)/.exec(scope.address.phone);
                if (result && result.length>0) {
                    var countryCode = parseInt(result[1]);
                    scope.address.phoneCountry = _.findWhere(countries, {countryCode:countryCode});
                    if (scope.address.phoneCountry && scope.address.country && 
                        scope.address.phoneCountry.id!==scope.address.country &&
                        scope.address.phoneCountry.phoneMask===scope.address.country.phoneMask) {
                        scope.address.phoneCountry = scope.address.country;
                    }
                }        
            }
    
            scope.$watch(attrs.ngModel, function(value) {
                scope.address = value;
                if (value && value.country)
                    scope.loadProvinces(value.country);

                if (scope.countries.$promise && !scope.countries.$resolved) 
                    scope.countries.$promise.then(fixPhoneCountry.bind(null, scope.countries));
                else
                    fixPhoneCountry(scope.countries);

                if (scope.dropShipping && scope.address) {
                    scope.address.emailConfirm = scope.address.email;
                }
            });

            scope.$watch(attrs.ngModel + '.country', function(val, oldVal) {
                if (val!==oldVal) {
                    scope.loadProvinces(val);
                }
            });

            scope.countries = TermService.getCountries();

            scope.loadProvinces = function (country){
                scope.provinces = TermService.getProvinces(country.id);
            };
        }
    };
}]);
