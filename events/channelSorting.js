const { mongodb, privatrum } = require('../config.json');
const dbPromise = require('../Utils/mongo.js');

module.exports = {
	name: 'channelCreate',
	once: false,
	async execute(channel) {
        if (channel?.parentId !== privatrum.kategori) {
            return;
        }

        const dbclient = await dbPromise;
        await dbclient.connect();

        try {
            const rooms = await dbclient.db("SA-2").collection('privateRooms').find().toArray();
        
            // Sort the rooms array in ascending order of position
            rooms.sort((a, b) => a.position - b.position);
        
            // Loop through each room
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
        
                // Find the main room and waiting room channels
                try {
                    const mainRoomGuild = await client.channels.fetch(room.mainRoomID);
                    const waitRoomGuild = await client.channels.fetch(room.waitingRoomID);
        
                    // Check if the main room is below the waiting room in position
                    //console.log("Before: " + mainRoomGuild.position + " - " + waitRoomGuild.position)
                    if (waitRoomGuild.position > mainRoomGuild.position) {
                        //console.log(mainRoomGuild.position + " - " + waitRoomGuild.position)
                        // Swap the positions of the two channels
                        const tempPos = await mainRoomGuild.position;
                        await mainRoomGuild.setPosition(tempPos);
                        await waitRoomGuild.setPosition(tempPos + 1);
                    }
                } catch (error) {}
            }
        } catch (error) {
        }
    }
}