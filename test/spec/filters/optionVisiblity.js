'use strict';

describe('Filter: optionVisiblity', function () {

  // load the filter's module
  beforeEach(module('paceApp'));

  // initialize a new instance of the filter before each test
  var optionVisiblity;
  beforeEach(inject(function ($filter) {
    optionVisiblity = $filter('optionVisiblity');
  }));

  it('should return the input prefixed with "optionVisiblity filter:"', function () {
    var text = 'angularjs';
    expect(optionVisiblity(text)).toBe('optionVisiblity filter: ' + text);
  });

});
