// updateEmail.js

const { validateUsername, validateEmail, validateUUID } = require('../../utils/pattern');
const { updateDocs } = require('../../utils/updateDocs');
const { client } = require('../../utils/mongodb');
const { runQuery } = require('../../utils/mariadb');

async function updateEmail(req, res) {
    try {
        const { userID, email } = req.body;

        if (!userID || !email || !validateUsername(userID) || !validateEmail(email)) {
            return res.json({ message: 'Invalid user or email' });
        }

        const results = await runQuery(
            "SELECT players.uuid FROM players " +
            "JOIN discordAccounts ON players.id = discordAccounts.playerID " +
            "WHERE discordAccounts.discordID = ?",
            [userID]
        );

        if (results.length === 0) {
            return res.json({ message: 'Invalid uuid' });
        }

        const uuid = results[0]['uuid'];
        if (!validateUUID(uuid)) {
            return res.json({ message: 'Invalid uuid' });
        }

        try {
            await client.connect();
            const collection = client.db("SA-2").collection("staffs-alltime");
            const existingStaff = await collection.findOne({ uuid, staff: true });

            if (existingStaff) {
            if (existingStaff.email) {
                await client.close();
                return res.json({ message: 'You can\'t change the email again' });
            } else {
                await collection.updateOne({ uuid, staff: true }, { $set: { email: email } });
                await client.close();
                await updateDocs()
                return res.json({ message: "Success" });
            }
            } else {
            await client.close();
            return res.json({ message: 'Staff member not found' });
            }
        } catch (error) {
            await client.close();
            return res.json({ message: 'Internal Server Error', error });
        }
    } catch (err) {
        return res.json({ message: 'Internal Server Error', error });
    }
}

module.exports = {
    updateEmail,
};
