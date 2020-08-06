'use strict';

describe('Service: Thumbnailmaker', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Thumbnailmaker;
  beforeEach(inject(function (_Thumbnailmaker_) {
    Thumbnailmaker = _Thumbnailmaker_;
  }));

  it('should do something', function () {
    expect(!!Thumbnailmaker).toBe(true);
  });

});
