// changePermission.js

const { validateUsername } = require('../../utils/pattern');
const defaultPermissions = require('./defaultPermissions');
const { client } = require('../../utils/mongodb');


async function changePermission(req, res) {
    const { userID, premium, userToAdd, type, typePerm, permission } = req.body;
    
    if (!userID || !userToAdd || !permission || !type || !typePerm || !validateUsername(userID) || !validateUsername(userToAdd) || !validateUsername(permission) || !validateUsername(type) || !validateUsername(typePerm) || !validateUsername(premium)) {
        return res.json({ message: 'Invalid user or permission' });
    }

    if (type != "add" && type !=  "remove") {
        return res.json({ message: 'Invalid type' });
    }

    if (premium != "VIP" && premium !=  "Booster" && premium !=  "BoV" && premium != null) {
        return res.json({ message: 'Invalid premium type' });
    }

    if (userID == userToAdd) {
        return res.json({ message: 'userToAdd is the same as userID' });
    }

    // Find the user's permissions in the database
    await client.connect();
    const userPermissions = await client.db("SA-2").collection('roomPermissions').findOne({ ownerID:  { $eq: userID }, active: 1 });

    // If the user's permissions are not found, use default permissions
    const permissionsToUse = userPermissions ? userPermissions.permissions : defaultPermissions.permissions;
    permissionsToUse.users[0].userID = userID;

    // Check if userToAdd is already in the list of users, if not add them
    let userToAddIndex = permissionsToUse.users.findIndex(user => user.userID === userToAdd);
    if (userToAddIndex === -1) {
        permissionsToUse.users.push({
            userID: userToAdd,
            permissions: {
                allow: [],
                deny: []
            }
        });
        userToAddIndex = permissionsToUse.users.length - 1;
    }

    if (type == "add") {
        // Check if the maximum number of users is reached
        if (premium == null && userPermissions && userPermissions.permissions.users.length >= 5) {
            // Return an error message or do something else as appropriate
            return res.json({ message: 'Max 3 users as a normal user' });
        }

        // Boster
        if (premium != null && premium == "Booster" && userPermissions && userPermissions.permissions.users.length >= 12) {
            // Return an error message or do something else as appropriate
            return res.json({ message: 'Max 10 users with Booster' });
        }

        // VIP
        if (premium != null && premium == "VIP" && userPermissions && userPermissions.permissions.users.length >= 12) {
            // Return an error message or do something else as appropriate
            return res.json({ message: 'Max 10 users with VIP' });
        }

        // Booster og VIP
        if (premium != null && premium == "BoV" && userPermissions && userPermissions.permissions.users.length >= 22) {
            // Return an error message or do something else as appropriate
            return res.json({ message: 'Max 20 users with Booster and VIP' });
        }

        // Check if the permission already exists in the user's permissions
        const userPermissionsToAdd = permissionsToUse.users[userToAddIndex].permissions[typePerm];
        if (userPermissionsToAdd.includes(permission)) {
            return res.json({ message: 'Permission already exists for the user' });
        }

        // Add the permission to the user's permissions
        if (typePerm === 'allow') {
            if (permissionsToUse.users[userToAddIndex].permissions.deny.includes(permission)) {
                return res.json({ message: 'Permission already exists in the deny array' });
            }

            if (permission === 'OWNER') {
                permissionsToUse.users[userToAddIndex].permissions.allow.push("VIEW_CHANNEL", "CONNECT", "MOVE_MEMBERS");
            } else {
                permissionsToUse.users[userToAddIndex].permissions.allow.push(permission);
            }
        } else if (typePerm === 'deny') {
            if (permissionsToUse.users[userToAddIndex].permissions.allow.includes(permission)) {
                return res.json({ message: 'Permission already exists in the allow array' });
            }
            permissionsToUse.users[userToAddIndex].permissions.deny.push(permission);
        } else {
            return res.json({ message: 'Invalid permission type' });
        }

        // Save the updated permissions to the database
        await client.db("SA-2").collection('roomPermissions').updateOne(
        { ownerID: { $eq: userID }, active: { $eq: 1 } },
        { $set: { permissions: permissionsToUse } },
        { upsert: true }
        );
        
        return res.json({ message: "Success" });
    }

    if (type == "remove") {
        // Check if the permission doesn't exist in the user's permissions
        const userPermissionsToRemove = permissionsToUse.users[userToAddIndex].permissions[typePerm];
        if (!userPermissionsToRemove.includes(permission)) {
            return res.json({ message: 'Permission doesnt exist for the user' });
        }

        // Remove the permission from the user's permissions
        if (typePerm === 'allow') {
            permissionsToUse.users[userToAddIndex].permissions.allow = permissionsToUse.users[userToAddIndex].permissions.allow.filter(p => p !== permission);
        } else if (typePerm === 'deny') {
            permissionsToUse.users[userToAddIndex].permissions.deny = permissionsToUse.users[userToAddIndex].permissions.deny.filter(p => p !== permission);
        } else {
            return res.json({ message: 'Invalid permission type' });
        }

        if (permissionsToUse.users[userToAddIndex].permissions.allow.length === 0 &&
            permissionsToUse.users[userToAddIndex].permissions.deny.length === 0) {
            // Remove the user object from the array
            permissionsToUse.users.splice(userToAddIndex, 1);
        }

        // Save the updated permissions to the database
        await client.db("SA-2").collection('roomPermissions').updateOne(
        { ownerID: { $eq: userID }, active: { $eq: 1 } },
        { $set: { permissions: permissionsToUse } },
        { upsert: true }
        );
        
        await client.close();
        return res.json({ message: "Success" });
    }
}

module.exports = {
    changePermission,
};
