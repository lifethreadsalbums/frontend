'use strict';

describe('Directive: optionGroupList', function () {

  // load the directive's module
  beforeEach(module('pace'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<option-group-list></option-group-list>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the optionGroupList directive');
  }));
});
