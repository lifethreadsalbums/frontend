'use strict';

describe('Directive: addressForm', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<address-form></address-form>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the addressForm directive');
  }));
});
