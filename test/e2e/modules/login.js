(function () {
    'use strict';

    require('../testConfig.js');

    describe('designer', function () {
        var email, pass, submit,

            assertLoginScreenVisible = function () {
                expect($('#inputEmail').isDisplayed).toBeTruthy();
                expect($('#inputPassword').isDisplayed()).toBeTruthy();
                expect($('button').isDisplayed()).toBeTruthy();
            };

        beforeEach(function () {
            browser.get('#/login');

            email = element(by.id('inputEmail'));
            pass = element(by.id('inputPassword'));
            submit = element(by.css('button'));
        });

        it('should redirect to /login when location has been set to login', function () {
            expect(browser.getLocationAbsUrl()).toMatch('login');
        });

        it('should show the signin panel on page load', function () {
            assertLoginScreenVisible();
        });

        it('should not authenticate when credentials do not match', function () {
            email.sendKeys(PACE.Test.login.wrongEmail);
            pass.sendKeys(PACE.Test.login.wrongPassword);
            submit.click().then(function () {
                assertLoginScreenVisible();
            });
        });

        it('should not display login form after successfull login', function () {
            email.sendKeys(PACE.Test.login.email);
            pass.sendKeys(PACE.Test.login.pass);
            submit.click().then(function () {
                expect(element(by.id('inputEmail')).isPresent()).toBe(false);
                expect(element(by.id('inputPassword')).isPresent()).toBe(false);
            });
        });

    });
})();