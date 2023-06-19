// deletePermission.js

const { validateUsername } = require('../../utils/pattern');
const { client } = require('../../utils/mongodb');


async function deletePermission(req, res) {
    const userID = req.params.userID;
    if (!validateUsername(userID)) {
        return res.json({ message: 'Invalid user ID' });
    }
    try {
        // Remove the user's permissions from the database
        await client.connect();
        await client.db("SA-2").collection('roomPermissions').deleteOne({ ownerID: { $eq: userID }, active: { $eq: 1 } });
        await client.close();
        res.json({ message: "Success" })
    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    deletePermission,
};
