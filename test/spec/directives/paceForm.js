'use strict';

describe('Directive: paceForm', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<pace-form></pace-form>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the paceForm directive');
  }));
});
