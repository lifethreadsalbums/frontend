'use strict';

describe('Directive: uniqueEmail', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<unique-email></unique-email>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the uniqueEmail directive');
  }));
});
