// mongodb.js

const { mongodb } = require('../config.json');
const { ObjectId, MongoClient } = require('mongodb');

const mongodb_url = mongodb.url;
const client = new MongoClient(mongodb_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    connectTimeoutMS: 30000,
    keepAlive: 1,
});

module.exports = {
    ObjectId,
    client,
};
