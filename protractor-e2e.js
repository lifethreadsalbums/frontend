exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['test/e2e/**/*.js'],
    capabilities: {
        'browserName': 'chrome'
    },
    baseUrl: 'http://localhost:9000/'
}