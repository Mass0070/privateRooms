const { privatrum } = require('../config.json');
const { createRoom } = require('../privateRooms/createRoom.js');
const { move } = require('../Utils/channel.js');
const { checkChannelMembers } = require('../privateRooms/checkChannelMembers.js');

async function userHasRooms(before, after, infoBeforeChannel, infoBeforeMemberID) {
    //console.log("\ninfoBeforeChannel:", infoBeforeChannel)

    //console.log("\ninfoBeforeMemberID:", infoBeforeMemberID)
    try {
        if (before.channel?.parentId !== privatrum.kategori || after.channel?.parentId == privatrum.kategori) {
            console.log("Before channel - log");
			// Wait 3 seconds then check channel members
            setTimeout(async () => {
                await checkChannelMembers(before, after);
            }, 5000);
        }

        if (infoBeforeMemberID != null && before.channel != null && infoBeforeMemberID.waitingRoomID == after.channel.id) {
            console.log("Test")
            if (infoBeforeMemberID != null && before.channel != null && infoBeforeMemberID.ownerID == after.member.id) {
                await move(after.member, infoBeforeMemberID.mainRoomID);
                console.log("User joined their own waiting room from another channel")
            } else {
                await move(after.member, before.channel);
                console.log("Moved to before.channel")
            }
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
            if (after.channel != null && infoBeforeMemberID == null && after.channel.id == privatrum.opret || infoBeforeMemberID != null && after.channel.id == infoBeforeMemberID.waitingRoomID) {
                console.log("User doesn't have a room")
                await createRoom(before, after, infoBeforeChannel, infoBeforeMemberID)
            } else if (infoBeforeMemberID != null && after.channel.id == infoBeforeMemberID.waitingRoomID) {
                console.log("User doesn't have a room - 2")
                // When you join a waiting room from a main room. - Not sure
                await move(after.member, before.channel)
            }
        }
    } catch (error) {
        console.log("userHasRooms:", error)
    }
}

module.exports = {
    userHasRooms
};
