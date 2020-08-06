'use strict';

describe('Service: termService', function () {

  // load the service's module
  beforeEach(module('pace'));

  // instantiate service
  var termService;
  beforeEach(inject(function (_termService_) {
    termService = _termService_;
  }));

  it('should do something', function () {
    expect(!!termService).toBe(true);
  });

});
