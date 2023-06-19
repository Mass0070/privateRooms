// discordRoutes.js

const cors = require('cors');
const { requiredAuthenticated } = require('../auth.js');
const { getVerifiedMembers } = require('../controller/discord/getVerifiedMembers');
const { updateDiscordUser } = require('../controller/discord/updateDiscordUser');


module.exports = (app, corsOptions) => {
    app.get('/api/discord/members', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic for discord members here
        getVerifiedMembers(req, res);
    });

    app.get('/api/discord/update', cors(corsOptions), requiredAuthenticated, async (req, res) => {
        // Handle GET request logic for discord update here
        updateDiscordUser(req, res);
    });
};
