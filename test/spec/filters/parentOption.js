'use strict';

describe('Filter: parentOption', function () {

  // load the filter's module
  beforeEach(module('pace'));

  // initialize a new instance of the filter before each test
  var parentOption;
  beforeEach(inject(function ($filter) {
    parentOption = $filter('parentOption');
  }));

  it('should return the input prefixed with "parentOption filter:"', function () {
    var text = 'angularjs';
    expect(parentOption(text)).toBe('parentOption filter: ' + text);
  });

});
