'use strict';

describe('Controller: ItemlistCtrl', function () {

  // load the controller's module
  beforeEach(module('paceApp'));

  var ItemlistCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ItemlistCtrl = $controller('ItemlistCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
