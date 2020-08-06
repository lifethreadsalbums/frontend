'use strict';

angular.module('pace.login')
	.controller('SignupCtrl', ['$scope', '$rootScope', 'MessageService', '$location', 'localize', 
		'Userdata', 'TermService', '$timeout', '$stateParams', 'StoreConfig', '$sce', 'currentStore',
		function($scope, $rootScope,  MessageService, $location, localize, 
			Userdata, TermService, $timeout, $stateParams, StoreConfig, $sce, currentStore) {

			$scope.currentStore = currentStore;

			$scope.taxNumberLabel = 'PST Number';
			$scope.taxNumberMask = 'PST-9999-9999';
			$scope.taxCountryId = 2,
			$scope.taxStateId = 2;

			if (StoreConfig.taxNumber) {
				$scope.taxNumberLabel = StoreConfig.taxNumber.name;
				$scope.taxNumberMask = StoreConfig.taxNumber.mask;
				$scope.taxCountryId = StoreConfig.taxNumber.countryId;
				$scope.taxStateId = StoreConfig.taxNumber.stateId;
			}

			$scope.$on('$viewContentLoaded', function() {

				$rootScope.viewLoaded = true;

			});
			window.scope = $scope;
			MessageService.clear();

			if (!$stateParams.page && $rootScope.actPage!=='signup2')
				Userdata.init();

			$scope.dataIn = Userdata.getData();

			if ($scope.dataIn.addresses[0].country)
				$scope.prov0 = TermService.getProvinces($scope.dataIn.addresses[0].country.id);
			else
				$scope.prov0 = [];

			if ($scope.dataIn.addresses[1].country)
				$scope.prov1 = TermService.getProvinces($scope.dataIn.addresses[1].country.id);
			else
				$scope.prov1 = [];

			if($scope.dataIn.addresses[1].sameAsBiling)
				Userdata.copyBillingData();

			$scope.siteUrl = window.location.protocol + '//' + window.location.hostname;
			$scope.eulaUrl = $sce.trustAsResourceUrl(StoreConfig.eulaUrl);
			$scope.termsUrl = $sce.trustAsResourceUrl(StoreConfig.termsUrl);

			$scope.eulaAgreeActive = false;
			$scope.termsAgreeActive = false;

			$scope.loadProvinces = function (idAdress){
				if($rootScope.actPage === 'signup4' || $rootScope.actPage === 'signup3') {
					var i = $stateParams.page - 3;
					var country = $scope.dataIn.addresses[idAdress].country;
					if(country) {
						$scope['prov'+idAdress] = TermService.getProvinces(country.id);
					}
				}
			};

			if ($stateParams.page) {
				$rootScope.actPage = 'signup' + $stateParams.page;

				if($rootScope.actPage === 'signup4' || $rootScope.actPage === 'signup3' || $rootScope.actPage === 'signup2'){
					$scope.countries = TermService.getCountries();
				}

				if($rootScope.actPage === 'signup2'){
					Userdata.getUserGroups()
						.then(function(value) {
							$scope.userGroups = value;
						});
				}

				if($rootScope.actPage === 'signup3'){
					$scope.loadProvinces(0);
				}

				if($rootScope.actPage === 'signup4'){
					$scope.loadProvinces(1);
				}

				if($rootScope.actPage === 'signupend'){
					$timeout(function() {
						$location.path('/');
					}, 10000);
				}

			} else {
				$rootScope.actPage = 'signup1';
			}

			//console.log($scope.dataIn);

			$scope.onSameAsBillingChange = function() {
				console.log('onSameAsBillingChange');
				if($scope.dataIn.addresses[1].sameAsBiling){
					Userdata.copyBillingData();
					$scope.loadProvinces(1);
				} else {
					$scope.dataIn.addresses = Userdata.resetShippingData();
				}
			};

			$scope.validate = function(page) {
				if($rootScope.actPage === 'signup5'){
					if($scope.dataIn.agreeEula===false){
						MessageService.show(localize.getLocalizedString('eulaMustRead'),'alert');
						return false;
					}
				}

				if($rootScope.actPage === 'signup6'){
					if($scope.dataIn.agreeTerms===false){
						MessageService.show(localize.getLocalizedString('termsMustRead'),'alert');
						return false;
					}
				}

				if(page === 'end'){
					Userdata.save().success(function (dataIn) {
						$location.path('/signup/' + page);
					}).error(function (dataIn) {
						MessageService.show(dataIn.error, 'alert');
					});
				} else {
					$location.path('/signup/' + page);
				}
			};


			$scope.setlang = function(l) {
				localize.setLanguage(l);
			};

			$scope.onReadEnd = function (whatRead) {
				if(whatRead === 'termsText'){
					$scope.termsAgreeActive = true;
				}
				if(whatRead === 'eulaText'){
					$scope.eulaAgreeActive = true;
				}
				$scope.$apply();
			};

			$scope.showInfo = function (whatToRead){
				if(whatToRead === 'terms' && $scope.termsAgreeActive === false){
					MessageService.show(localize.getLocalizedString('mustCheckTerms'), 'alert');
				}
				if(whatToRead === 'eula' && $scope.eulaAgreeActive === false){
					MessageService.show(localize.getLocalizedString('mustCheckEula'), 'alert');
				}
			};

			//silly check if a separator was choosen in the country field
			$scope.checkCountries = function() {
				if ($scope.dataIn) {
					if ($scope.dataIn.addresses[0].country && $scope.dataIn.addresses[0].country.id===0)
						$scope.dataIn.addresses[0].country = null;
					if ($scope.dataIn.addresses[1].country && $scope.dataIn.addresses[1].country.id===0)
						$scope.dataIn.addresses[1].country = null;
					if ($scope.dataIn.countryPhone && $scope.dataIn.countryPhone.id===0)
						$scope.dataIn.countryPhone = null;
				}
			};

			$scope.noPSTChanged = function(e) {
				if ($scope.dataIn && $scope.dataIn.noPST) {
					$scope.dataIn.taxNumber = 'N/A';
				}
			}

			$scope.goBack = function(page) {
				$location.path('/signup/' + page);
			}
		}
	]);
