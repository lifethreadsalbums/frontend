'use strict';

describe('Controller: EmailverifiedCtrl', function () {

  // load the controller's module
  beforeEach(module('paceApp'));

  var EmailverifiedCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EmailverifiedCtrl = $controller('EmailverifiedCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
