'use strict';

describe('Directive: die', function () {

  // load the directive's module
  beforeEach(module('paceApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<die></die>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the die directive');
  }));
});
