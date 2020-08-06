(function () {
    'use strict';
    
    require('../testConfig.js');
    
    describe('layout', function () {
        var spreads,
            filmstripItems;
        
        beforeEach(function () {
            PACE.Test.login.logIn();
            browser.get(PACE.Test.layout.testUrl);
            
            element.all(by.css('.section-content .scrollable-container .spread')).then(function (s) {
                spreads = s;
            });
            element.all(by.css('.filmstrip-item')).then(function (f) {
                filmstripItems = f;
            });            
        });
        
        it('should redirect to /layout/1', function () {
            expect(browser.getLocationAbsUrl()).toMatch(PACE.Test.layout.testUrl);
        });
        
    });
    
    
})();