// getPermission.js

const { validateUsername } = require('../../utils/pattern');
const defaultPermissions = require('./defaultPermissions');
const { ObjectId, client } = require('../../utils/mongodb');


async function getPermission(req, res) {
    const userID = req.params.userID;

    if (!validateUsername(userID)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    await client.connect();

    var userPermissions = await client
        .db('SA-2')
        .collection('roomPermissions')
        .findOne({ ownerID: { $eq: userID }, active: { $eq: 1 } });

    if (!userPermissions) {
        defaultPermissions.ownerID = userID;
        defaultPermissions.permissions.users[0].userID = userID;
        defaultPermissions._id = new ObjectId();

        return res.json(defaultPermissions.permissions);
    }

    await client.close();

    return res.json(userPermissions.permissions);
}

module.exports = {
    getPermission,
};
