const { privatrum } = require('../config.json');
const { move, connect, disconnect, deleteChannel } = require('../Utils/channel.js');
const dbPromise = require('../Utils/mongo.js');

async function createRoom(before, after, infoBeforeChannel, infoBeforeMemberID) {
    let creatingPrivateRoom = false;

    if (creatingPrivateRoom) {
        await new Promise((resolve) => {
            const intervalId = setInterval(() => {
            if (!creatingPrivateRoom) {
                clearInterval(intervalId);
                resolve();
            }
            }, 1000);
        });
    }
    creatingPrivateRoom = true;

    //console.log("\ninfoBeforeChannel:", infoBeforeChannel)
    //console.log("\n--- Creating room ---\n")
    const proomsCategory = after.guild.channels.cache.get(privatrum.kategori);

    const dbclient = await dbPromise;
    await dbclient.connect();

    const ownerPermissions = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: after.member.id, active: 1 });
    const defaultRoomPerms = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: "DB", active: 1 });

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
        const mainRoom = await proomsCategory.createChannel(`${after.member.user.username} [Privatrum]`, {
            type: 'GUILD_VOICE',
            parent: privatrum.kategori,
            permissionOverwrites,
        });

        const mainRoomData = {
            ownerID: after.member.id,
            mainRoomID: mainRoom.id,
            gettingCreated: true,
        };

        // Insert the main room ID into the database and get the generated _id
        const result = await dbclient.db("SA-2").collection('privateRooms').insertOne(mainRoomData);
        const mainRoomId = result.insertedId;

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
        `🡱 Venterum [${after.member.user.username}]`,
        {
            type: 'GUILD_VOICE',
            parent: privatrum.kategori,
            permissionOverwrites: [...WaitingpermissionOverwrites],
        }
        );

        // Update the database with the waiting room ID
        const waitingRoomData = {
            waitingRoomID: waitingRoom.id,
        };

        await dbclient.db("SA-2").collection('privateRooms').updateOne({ _id: mainRoomId }, { $set: waitingRoomData });
        
        // Move member to the main room
        try {
            await after.member.voice.setChannel(mainRoom);
            await dbclient.db("SA-2").collection('privateRooms').updateOne({ _id: mainRoomId }, { $set: { gettingCreated: false } });
        } catch (error) {
            console.log(`userID: ${after.member.id}\nmainID: ${mainRoom.id}`);
            deleteChannel(mainRoom);
            deleteChannel(waitingRoom);
            await dbclient.db("SA-2").collection("privateRooms").deleteOne({ _id: mainRoomId });
        }

    creatingPrivateRoom = false;
}

module.exports = {
    createRoom
};
