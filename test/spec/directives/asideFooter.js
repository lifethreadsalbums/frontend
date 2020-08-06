'use strict';

describe('Directive: asideFooter', function () {

  // load the directive's module
  beforeEach(module('paceApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<aside-footer></aside-footer>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the asideFooter directive');
  }));
});
