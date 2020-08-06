# frontend
frontend application

1. Install dependencies for frontend project
cd ../../pace-frontend
gem install bundler
bundle install --path vendor/bundle
npm install

2. Install bower and bower dependencies:
npm install -g bower
bower install

3. Install grunt-cli
npm install -g grunt-cli

4. Build the frontend project and start it in a development mode
grunt server

 A new browser window should open and you should see the login page (backend should also be running)
