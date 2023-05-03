const { privatrum } = require('../config.json');
const { createRoom } = require('../privateRooms/createRoom.js');
const { move } = require('../Utils/channel.js');

async function userHasRooms(before, after, infoBeforeChannel, infoBeforeMemberID) {
    //console.log("\ninfoBeforeChannel:", infoBeforeChannel)

    //console.log("\ninfoBeforeMemberID:", infoBeforeMemberID)

    if (infoBeforeMemberID != null && before.channel != null && infoBeforeMemberID.waitingRoomID == after.channel.id) {
        await move(after.member, before.channel);
        console.log("Moved to before.channel")
        return;
    } 

    // If user joins privatrum.opret and was in another channel
    if (infoBeforeMemberID != null && before.channel != null && after.channel.id == privatrum.opret) {
        await move(after.member, infoBeforeMemberID.mainRoomID);
        console.log("Moved to mainRoom if user was in another channel, maybe ADD_REACTIONS perms")
        return;
    }

    // If user hasn't been in another voice channel
    if (infoBeforeMemberID != null && before.channel == null && infoBeforeMemberID.waitingRoomID == after.channel.id || infoBeforeMemberID != null && before.channel == null &&  after.channel.id == privatrum.opret) {
        await move(after.member, infoBeforeMemberID.mainRoomID);
        console.log("Moved to mainRoom")
        return;
    } 
    
    
    if (after.channel != null && infoBeforeChannel != null && after.channel.id == infoBeforeChannel.waitingRoomID) {
        console.log("\nUser has a room\n")
        await move(after.member, before.channel)
    }

    
    if (infoBeforeChannel == null && infoBeforeMemberID == null) {
        if (after.channel != null && infoBeforeMemberID == null && after.channel.id == privatrum.opret || after.channel.id == waitingRoomID.waitingRoomID) {
            console.log("User doesn't have a room")
            await createRoom(before, after, infoBeforeChannel, infoBeforeMemberID)
        } else {
            console.log("\nDon't know maybe check for ADD_REACTIONS\n")
            await move(after.member, infoBeforeChannel.mainRoomID)
        }
    }
}

module.exports = {
    userHasRooms
};
