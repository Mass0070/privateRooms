// saRoutes.js

const cors = require('cors');
const { requiredAuthenticated } = require('../auth.js');
const { checkStorage } = require('../controller/sa/checkStorage');

module.exports = (app, corsOptions) => {
    app.get('/api/sa/storage', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic for storage here
        checkStorage(req, res);
    });

};
