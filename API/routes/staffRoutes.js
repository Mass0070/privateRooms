// staffRoutes.js

const cors = require('cors');
const { requiredAuthenticated } = require('../auth.js');
const { updateEmail } = require('../controller/staffs/updateEmail');
const { getStaff } = require('../controller/staffs/getStaff');
const { getOldStaff } = require('../controller/staffs/getOldStaff');
const { removeStaff } = require('../controller/staffs/removeStaff');


module.exports = (app, corsOptions) => {
    app.post('/api/staffs', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle POST request logic for staffs here
        updateEmail(req, res);
    });

    app.get('/api/staffs', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic for staffs here
        getStaff(req, res);
    });

    app.get('/api/oldstaffs', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic for oldstaffs here
        getOldStaff(req, res);
    });

    app.delete('/api/oldstaffs/:uuid', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle DELETE request logic for oldstaffs/:uuid here
        removeStaff(req, res);
    });
};
