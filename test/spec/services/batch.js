'use strict';

describe('Service: Batch', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Batch;
  beforeEach(inject(function (_Batch_) {
    Batch = _Batch_;
  }));

  it('should do something', function () {
    expect(!!Batch).toBe(true);
  });

});
