# install ports
sudo port install nodejs mongodb

# install node.js package manager "npm"
curl http://npmjs.org/install.sh | sudo sh

# install node.js module for MongoDB
sudo npm install mongodb

# install node.js module for Mustache
sudo npm install mustache

# setup and start database
mkdir /Users/martin/node.js/mongodb/internetslum_collector
/opt/local/bin/mongod --dbpath=/Users/martin/node.js/mongodb/internetslum_collector

# fill database
mongo internetslum_collector
> db.urls.save({url: 'http://www.mongodb.org/display/DOCS/Quickstart+OS+X'})
> db.urls.save({url: 'http://www.slideshare.net/ggoodale/getting-started-with-mongodb-and-nodejs'})

# start node.js server
node server.js
