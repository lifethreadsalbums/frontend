'use strict';

describe('Directive: inputUrl', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<input-url></input-url>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the inputUrl directive');
  }));
});
