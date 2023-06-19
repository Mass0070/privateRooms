// updateDiscordUser.js

const { validateUsername } = require('../../utils/pattern');
const { runQuery } = require('../../utils/mariadb');

async function updateDiscordUser(req, res) {
    try {
        if (validateUsername(req.query.username) && validateUsername(req.query.discordID)) {
            console.log(`Username ${req.query.username}`)
            console.log(`ID ${req.query.discordID}`)

            const results = await runQuery(
                "SELECT players.username, discordAccounts.discordID "+
                "FROM players "+
                "JOIN discordAccounts ON players.id = discordAccounts.playerID "+
                "WHERE players.username = ? AND discordAccounts.discordID = ?", [req.query.username, req.query.discordID]
            );
            console.log(results)
            res.json(results);

        } else {
            res.json("ERROR");
        }
    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    updateDiscordUser
};
