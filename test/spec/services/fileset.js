'use strict';

describe('Service: Fileset', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Fileset;
  beforeEach(inject(function (_Fileset_) {
    Fileset = _Fileset_;
  }));

  it('should do something', function () {
    expect(!!Fileset).toBe(true);
  });

});
