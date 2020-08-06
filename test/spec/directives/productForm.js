'use strict';

describe('Directive: productForm', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<product-form></product-form>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the productForm directive');
  }));
});
