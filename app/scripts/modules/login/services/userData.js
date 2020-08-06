'use strict';

angular.module('pace.login')
	.service('Userdata', ['$http', '$sanitize', 'localize', function Userdata($http, $sanitize, localize) {


		var init = function() {
			return {
					agreeEula: false,
					agreeTerms: false,
					mail: null,
					mailConfirm: null,
					password: null,
					passwordConfirm: null,
					firstName: null,
					lastName: null,
					company: null,
					group:null,
					website: null,
					countryPhone: null,
					phoneNumber: null,
					taxNumber: null,
					addresses: [{
						address1: null,
						address2: null,
						city: null,
						country: null,
						province: null,
						provinceObj: null,
						pts: null,
						zipCode:null
					}, {
						sameAsBiling: true,
						address1: null,
						address2: null,
						city: null,
						country: null,
						province: null,
						provinceObj: null,
						zipCode: null
					}]
				};
		};

		var userData = init();
		var userGroups = [];

		return {
			init: function() {
				userData = init();
			},

			getUserGroups: function() {
				var promise = $http.get(apiUrl + 'api/userGroup');

				return promise.then(function(value) {
                    // var hiddenGroups = [
                    //     'Advertising Photographer',
                    //     'Agency/Design Firm',
                    //     'Artist Representative',
                    //     'Editorial Photographer',
                    //     'Editorial & Advertising Photographer',
                    //     'Graphic Designer',
                    //     'Illustrator',
                    //     'Student/Photo Assistant'
                    // ];

                    userGroups = value.data;
                    // userGroups = userGroups.filter(function(group) {
                    //     return hiddenGroups.indexOf(group.name) === -1;
                    // });

                    return userGroups;
                });;
			},

			getData: function() {
				return userData;
			},
			setData: function(newData) {
				userData = newData;
			},
			copyBillingData: function() {
				for (var k in userData.addresses[1]) {
					if (k !== 'sameAsBiling') {
						userData.addresses[1][k] = userData.addresses[0][k];
					}
				}
			},
			resetShippingData: function() {
				for (var k in userData.addresses[1]) {
					if (k !== 'sameAsBiling') {
						userData.addresses[1][k] = null;
					}
				}
				return userData.addresses;
			},
			save: function() {
				var out = {
					email: $sanitize(userData.mail),
					firstName: $sanitize(userData.firstName),
					lastName: $sanitize(userData.lastName),
					password: $sanitize(userData.password),
					companyName: $sanitize(userData.company),
					website: $sanitize(userData.website),
					phone: $sanitize(userData.phoneNumber),
					taxNumber: userData.taxNumber!=null ? $sanitize(userData.taxNumber) : null,
					group: userData.group,
					addresses: [{
							addressLine1: $sanitize(userData.addresses[0].address1),
							addressLine2: $sanitize(userData.addresses[0].address2),
							city: $sanitize(userData.addresses[0].city),
							state: userData.addresses[0].province,
							country: userData.addresses[0].country,
							zipCode: $sanitize(userData.addresses[0].zipCode),
							addressType: "BillingAddress"
						},

						{
							addressLine1: $sanitize(userData.addresses[1].address1),
							addressLine2: $sanitize(userData.addresses[1].address2),
							city: $sanitize(userData.addresses[1].city),
							state: userData.addresses[1].province,
							country: userData.addresses[1].country,
							zipCode: $sanitize(userData.addresses[1].zipCode),
							addressType: "ShippingAddress"
						}
					]}
				console.log(userData, out);
				return $http.post(apiUrl + "api/user/register", out);
			},
			resetPass: function () {
				return $http.get(apiUrl + "api/user/password/reset?email="+$sanitize(userData.mail));
			},
			changePassword: function (newPassword) {
				return $http.post(apiUrl + "api/user/password",{"password":$sanitize(newPassword)});
			}
		}
	}]);
