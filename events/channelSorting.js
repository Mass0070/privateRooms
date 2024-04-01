const { mongodb, privatrum } = require('../config.json');
const dbPromise = require('../Utils/mongo.js');

let enabled = false;


module.exports = {
	name: 'channelCreate',
	once: false,
	async execute(channel) {
        if (!enabled) {
            console.log('Module is disabled.');
            return;
        }
        if (channel?.parentId !== privatrum.kategori) {
            return;
        }

        const dbclient = await dbPromise;
        await dbclient.connect();

        try {
            const rooms = await dbclient.db("SA-2").collection('privateRooms').find().toArray();
    
            rooms.sort((a, b) => {
                if (a.position !== b.position) {
                    return a.position - b.position;
                }
                return a.name.localeCompare(b.name);
            });
            
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
        
                try {
                    const guild = await client.guilds.fetch(room.guildID);
                    const mainRoomGuild = guild.channels.cache.get(room.mainRoomID);
                    const waitRoomGuild = guild.channels.cache.get(room.waitingRoomID);
            
                    if (waitRoomGuild.position > mainRoomGuild.position) {
                        const tempPos = mainRoomGuild.position;
                        await mainRoomGuild.setPosition(waitRoomGuild.position);
                        await waitRoomGuild.setPosition(tempPos);
                    }
                    } catch (error) {
                    }
                }
            } catch (error) {
        }
    }      
}