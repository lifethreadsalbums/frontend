'use strict';

describe('Controller: ResetpassCtrl', function () {

  // load the controller's module
  beforeEach(module('pace'));

  var ResetpassCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ResetpassCtrl = $controller('ResetpassCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
