// getVerifiedMembers.js

const { runQuery } = require('../../utils/mariadb');

async function getVerifiedMembers(req, res) {
    try {
        const results = await runQuery(
            "SELECT players.username, discordAccounts.discordID "+
            "FROM players "+
            "JOIN discordAccounts ON players.id = discordAccounts.playerID"
        );
        
        res.json(results);
    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    getVerifiedMembers,
};
