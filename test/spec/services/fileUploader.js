'use strict';

describe('Service: Fileuploader', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Fileuploader;
  beforeEach(inject(function (_Fileuploader_) {
    Fileuploader = _Fileuploader_;
  }));

  it('should do something', function () {
    expect(!!Fileuploader).toBe(true);
  });

});
