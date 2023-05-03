const { privatrum } = require('../config.json');
const { move, connect, disconnect } = require('../Utils/channel.js');
const dbPromise = require('../Utils/mongo.js');

async function createRoom(before, after, infoBeforeChannel, infoBeforeMemberID) {
    let creatingPrivateRoom = false; // initialize a flag to track if a private room is currently being created

    if (creatingPrivateRoom) {
        // if a private room is currently being created, wait for it to finish
        await new Promise((resolve) => {
            const intervalId = setInterval(() => {
            if (!creatingPrivateRoom) {
                clearInterval(intervalId);
                resolve();
            }
            }, 1000);
        });
    }
    // set the flag to true to indicate that a private room is being created
    creatingPrivateRoom = true;

    //console.log("\ninfoBeforeChannel:", infoBeforeChannel)

    //console.log("\n--- Creating room ---\n")
    const proomsCategory = after.guild.channels.cache.get(privatrum.kategori);

    const dbclient = await dbPromise;
    await dbclient.connect();

    // Create main room and waiting room
    // Query the roomPermissions collection for the owner's permissions
    const ownerPermissions = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: after.member.id, active: 1 });
    const defaultRoomPerms = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: "DB", active: 1 });

    // If ownerPermissions exist, use them. Otherwise, use default permissions
    const permissionOverwrites = ownerPermissions && ownerPermissions.permissions
    ? [...(ownerPermissions.permissions.roles.mainRoom || [])
            .filter(p => after.guild.roles.cache.has(p.roleID))
            .map(p => ({
                id: p.roleID,
                allow: p.permissions.allow,
                deny: p.permissions.deny,
            })),
        ...(ownerPermissions.permissions.users || [])
            .filter(p => after.guild.members.cache.has(p.userID))
            .map(p => ({
                id: p.userID,
                allow: p.permissions.allow,
                deny: p.permissions.deny,
            })),
    ]
    : defaultRoomPerms && defaultRoomPerms.permissions
        ? [...(defaultRoomPerms.permissions.roles.mainRoom || [])
                .filter(p => after.guild.roles.cache.has(p.roleID))
                .map(p => ({
                    id: p.roleID,
                    allow: p.permissions.allow,
                    deny: p.permissions.deny,
                })),
                {
                    id: after.member.id, // add permissions for the member who created the private room
                    allow: ['VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS'],
                }
            ]
        : [];

        // Create main room with the fetched permissions
        const mainRoom = await proomsCategory.createChannel(`${after.member.user.tag} [Privatrum]`, {
            type: 'GUILD_VOICE',
            parent: privatrum.kategori,
            position: 1,
            permissionOverwrites,
        });

        // Insert the main room ID into the database
        const mainRoomData = {
            ownerID: after.member.id,
            mainRoomID: mainRoom.id,
        };

        await dbclient.db("SA-2").collection('privateRooms').insertOne(mainRoomData);

        const WaitingpermissionOverwrites = ownerPermissions && ownerPermissions.permissions
        ? [...(ownerPermissions.permissions.roles.waitingRoom || [])
                .filter(p => after.guild.roles.cache.has(p.roleID))
                .map(p => ({
                id: p.roleID,
                allow: [
                    ...(p.permissions.allow || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL', 'SPEAK'].includes(perm))
                ],
                deny: [
                    ...(p.permissions.deny || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL', 'SPEAK'].includes(perm))
                ],
                })),
            ...(ownerPermissions.permissions.users || [])
                .filter(p => after.guild.members.cache.has(p.userID))
                .map(p => ({
                id: p.userID,
                allow: [
                    ...(p.permissions.allow || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL', 'SPEAK'].includes(perm))
                ],
                deny: [
                    ...(p.permissions.deny || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL', 'SPEAK'].includes(perm))
                ],
                }))
            ]
            .filter(p => p.allow.includes('MOVE_MEMBERS') || p.allow.includes('CONNECT') || p.allow.includes('VIEW_CHANNEL') || p.allow.includes('SPEAK') || p.deny.includes('MOVE_MEMBERS') || p.deny.includes('CONNECT') || p.deny.includes('VIEW_CHANNEL') || p.deny.includes('SPEAK'))
                : defaultRoomPerms && defaultRoomPerms.permissions
                ? [...(defaultRoomPerms.permissions.roles.waitingRoom || [])
                        .filter(p => after.guild.roles.cache.has(p.roleID))
                        .map(p => ({
                            id: p.roleID,
                            allow: p.permissions.allow,
                            deny: p.permissions.deny,
                        })),
                        {
                            id: after.member.id, // add permissions for the member who created the private room
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS'],
                        }
                    ]
                : [];

        // Create waiting room with the fetched permissions
        const waitingRoom = await proomsCategory.createChannel(
        `🡱 Venterum [${after.member.user.tag}]`,
        {
            type: 'GUILD_VOICE',
            parent: privatrum.kategori,
            position: 2,
            permissionOverwrites: [...WaitingpermissionOverwrites],
        }
        );

        // Update the database with the waiting room ID
        const waitingRoomData = {
            waitingRoomID: waitingRoom.id,
        };

        await dbclient.db("SA-2").collection('privateRooms').updateOne({ mainRoomID: mainRoom.id }, { $set: waitingRoomData });
        
        // Move member to the main room
        try {
            await after.member.voice.setChannel(mainRoom);
        } catch (error) {
            console.log("userID: " + after.member.id + "\nmainID: " + mainRoom.id);
            deleteChannel(mainRoom);
            deleteChannel(waitingRoom);
            await dbclient.db("SA-2").collection("privateRooms").deleteOne(data);
        }







    // set the flag back to false to indicate that the private room creation is complete
    creatingPrivateRoom = false;
}

module.exports = {
    createRoom
};
