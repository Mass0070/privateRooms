const { privatrum } = require('../config.json');
const { move, connect, disconnect, deleteChannel } = require('../Utils/channel.js');
const dbPromise = require('../Utils/mongo.js');

async function checkChannelMembers(before, after) {
    let checkMembers = false; // initialize a flag to track if a private room is currently being created

    if (checkMembers) {
        // if a private room is currently being created, wait for it to finish
        await new Promise((resolve) => {
            const intervalId = setInterval(() => {
            if (!checkMembers) {
                clearInterval(intervalId);
                resolve();
            }
            }, 1000);
        });
    }
    // set the flag to true to indicate that a private room is being created
    checkMembers = true;

    const dbclient = await dbPromise;
    await dbclient.connect();

    try {
        channelOwner = await dbclient.db("SA-2").collection("privateRooms").findOne({ ownerID: before.member.id });
        if (channelOwner != null) {
            mainRoomChannel = before.guild.channels.cache.get(channelOwner.mainRoomID)
            waitingRoomChannel = before.guild.channels.cache.get(channelOwner.waitingRoomID);
                const roomPermission = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: before.member.id });
                if (roomPermission != null) {
                    const usersWithAddReactionPerm = mainRoomChannel.members.filter(member =>
                        roomPermission.permissions.users.some(user =>
                            user.userID === member.id && user.permissions.allow.includes("ADD_REACTIONS")
                        )
                    );
                    console.log("Her - 1")
                    if (mainRoomChannel.members.some(member => member.id === channelOwner.ownerID)) {
                        console.log("Owner is still in the room");
                        return;
                    } else if (usersWithAddReactionPerm.size > 0) {
                        console.log("One user found")
                        return;
                    } else {
                        console.log("No users found")
                        try {
                            // Delete the mainRoom channel
                            deleteChannel(mainRoomChannel);
                            // Delete the mainRoomID from the document
                            await dbclient.db("SA-2").collection("privateRooms").updateOne(
                                { ownerID: before.member.id },
                                { $unset: { mainRoomID: 1 } }
                            );
                        } catch (error) {
                            console.log("Failed to delete the private room.", error);
                        }
                        
                        try {
                            deleteChannel(waitingRoomChannel);
                            // Delete the waitingRoomID from the document
                            await dbclient.db("SA-2").collection("privateRooms").deleteOne({ ownerID: before.member.id });
                        } catch (error) {
                            console.log("Failed to delete the waitingRoom channel.", error);
                        }
                        return;
                    } 
                } else {
                    if (mainRoomChannel.members.some(member => member.id === channelOwner.ownerID)) {
                        console.log("Owner is still in the room");
                        return;
                    }
                    console.log("No users found - Down here")
                    try {
                        // Delete the mainRoom channel
                        deleteChannel(mainRoomChannel);
                        // Delete the mainRoomID from the document
                        await dbclient.db("SA-2").collection("privateRooms").updateOne(
                            { ownerID: before.member.id },
                            { $unset: { mainRoomID: 1 } }
                        );
                    } catch (error) {
                        console.log("Failed to delete the private room.", error);
                    }
                        
                    try {
                        deleteChannel(waitingRoomChannel);
                        // Delete the waitingRoomID from the document
                        await dbclient.db("SA-2").collection("privateRooms").deleteOne({ ownerID: before.member.id });
                    } catch (error) {
                        console.log("Failed to delete the waitingRoom channel.", error);
                    }
                    return;
                }
        } else {
            infoBeforeChannel = await dbclient.db("SA-2").collection("privateRooms").findOne({ "mainRoomID": before.channel ? before.channel.id : null });
            mainRoomChannel = before.guild.channels.cache.get(infoBeforeChannel.mainRoomID)
            waitingRoomChannel = before.guild.channels.cache.get(infoBeforeChannel.waitingRoomID);
                const roomPermission = await dbclient.db("SA-2").collection("roomPermissions").findOne({ ownerID: before.member.id });
                if (roomPermission != null) {
                    const usersWithAddReactionPerm = mainRoomChannel.members.filter(member =>
                        roomPermission.permissions.users.some(user =>
                            user.userID === member.id && user.permissions.allow.includes("ADD_REACTIONS")
                        )
                    );
                    console.log("Her - 1")
                    if (mainRoomChannel.members.some(member => member.id === infoBeforeChannel.ownerID)) {
                        console.log("Owner is still in the room");
                        return;
                    } else if (usersWithAddReactionPerm.size > 0) {
                        console.log("One user found")
                        return;
                    } else {
                        console.log("No users found")
                        try {
                            // Delete the mainRoom channel
                            deleteChannel(mainRoomChannel);
                            // Delete the mainRoomID from the document
                            await dbclient.db("SA-2").collection("privateRooms").updateOne(
                                { ownerID: infoBeforeChannel.ownerID },
                                { $unset: { mainRoomID: 1 } }
                            );
                        } catch (error) {
                            console.log("Failed to delete the private room.", error);
                        }
                        
                        try {
                            deleteChannel(waitingRoomChannel);
                            // Delete the waitingRoomID from the document
                            await dbclient.db("SA-2").collection("privateRooms").deleteOne({ ownerID: infoBeforeChannel.ownerID });
                        } catch (error) {
                            console.log("Failed to delete the waitingRoom channel.", error);
                        }
                        return;
                    } 
                } else {
                    if (mainRoomChannel.members.some(member => member.id === infoBeforeChannel.ownerID)) {
                        console.log("Owner is still in the room");
                        return;
                    }
                    console.log("No users found - Down here")
                    try {
                        // Delete the mainRoom channel
                        deleteChannel(mainRoomChannel);
                        // Delete the mainRoomID from the document
                        await dbclient.db("SA-2").collection("privateRooms").updateOne(
                            { ownerID: infoBeforeChannel.ownerID },
                            { $unset: { mainRoomID: 1 } }
                        );
                    } catch (error) {
                        console.log("Failed to delete the private room.", error);
                    }
                        
                    try {
                        deleteChannel(waitingRoomChannel);
                        // Delete the waitingRoomID from the document
                        await dbclient.db("SA-2").collection("privateRooms").deleteOne({ ownerID: infoBeforeChannel.ownerID });
                    } catch (error) {
                        console.log("Failed to delete the waitingRoom channel.", error);
                    }
                    return;
                }
        }


    } catch (error) {
        //console.log("Fejl her", error)
        checkMembers = false;
    }


    // set the flag back to false to indicate that the private room creation is complete
    checkMembers = false;
}

module.exports = {
    checkChannelMembers
};
