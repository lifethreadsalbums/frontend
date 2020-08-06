'use strict';

describe('Service: Debounce', function () {

  // load the service's module
  beforeEach(module('paceApp'));

  // instantiate service
  var Debounce;
  beforeEach(inject(function (_Debounce_) {
    Debounce = _Debounce_;
  }));

  it('should do something', function () {
    expect(!!Debounce).toBe(true);
  });

});
