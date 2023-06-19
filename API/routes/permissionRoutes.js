// permissionRoutes.js

const cors = require('cors');
const { requiredAuthenticated  } = require('../auth.js');
const { changePermission } = require('../controller/permissions/changePermissions');
const { getPermission } = require('../controller/permissions/getPermissions');
const { deletePermission } = require('../controller/permissions/deletePermissions');


module.exports = (app, corsOptions) => {
    app.post('/api/permission', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle POST request logic here
        await changePermission(req, res);
    });

    //app.post('/api/permission/:userID', cors(corsOptions), requiredAuthenticated, async (req, res) => {
    //  // Handle POST request logic here
    //});

    app.get('/api/permission/:userID', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic here
        await getPermission(req, res);
    });

    //app.put('/api/permission/:userID', requiredAuthenticated, async (req, res) => {
    //    // Handle PUT request logic here
    //});

    app.delete('/api/permission/:userID', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle DELETE request logic here
        await deletePermission(req, res);
    });
};