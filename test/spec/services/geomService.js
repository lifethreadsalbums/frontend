'use strict';

describe('Service: Geomservice', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Geomservice;
  beforeEach(inject(function (_Geomservice_) {
    Geomservice = _Geomservice_;
  }));

  it('should do something', function () {
    expect(!!Geomservice).toBe(true);
  });

});
