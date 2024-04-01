const { MongoClient } = require('mongodb');
const { mongodb } = require('../config.json');

const dbclient = new MongoClient(mongodb.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = new Promise((resolve, reject) => {
    dbclient.connect((err) => {
        if (err) {
            console.error('Failed to connect to MongoDB:', err);
            reject(err);
        } else {
            console.log('Connected to MongoDB');
            resolve(dbclient);
        }
    });
});
