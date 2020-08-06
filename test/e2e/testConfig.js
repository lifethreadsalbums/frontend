PACE = {};

/////////////////////////////////////////////////////
// Test configuration ///////////////////////////////
/////////////////////////////////////////////////////

PACE.Test = {
    login: {
        wrongEmail: 'invalid@email.com',
        wrongPassword: 'invalid',
        email: 'admin@example.com',
        pass: 'test',
        
        logIn: function () {
            browser.get('#/login');

            var email = element(by.id('inputEmail')),
                pass = element(by.id('inputPassword')),
                submit = element(by.css('button'));
            email.sendKeys(PACE.Test.login.email);
            pass.sendKeys(PACE.Test.login.pass);

            return submit.click();
        }
    },
    
    layout: {
        testUrl: '#/layout/1'
    }
};