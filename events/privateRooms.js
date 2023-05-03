const { privatrum } = require('../config.json');
const dbPromise = require('../Utils/mongo.js');
const { deleteChannel, disconnect } = require('../Utils/channel.js');
const { userHasRooms } = require('../privateRooms/userHasRooms.js');
const { checkChannelMembers } = require('../privateRooms/checkChannelMembers.js');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(before, after) {
		let PrivateRoom = false; // initialize a flag to track if a private room is currently being created

        if (before.channel == after.channel) return;
		if (after.channel?.parentId !== privatrum.kategori) {
            return;
        }

		if (PrivateRoom) {
			// if a private room is currently being created, wait for it to finish
			await new Promise((resolve) => {
				const intervalId = setInterval(() => {
				if (!PrivateRoom) {
					clearInterval(intervalId);
					resolve();
				}
				}, 1500);
			});
		}
		// set the flag to true to indicate that a private room is being created
		PrivateRoom = true;

		const dbclient = await dbPromise;
		if (!dbclient.topology.isConnected()) {
			await dbclient.connect();
		}
		// Check the room the user came from
		infoBeforeChannel = await dbclient.db("SA-2").collection("privateRooms").findOne({ "mainRoomID": before.channel ? before.channel.id : null });
		
		// Check if user has a room in the database
		infoBeforeMemberID = await dbclient.db("SA-2").collection("privateRooms").findOne({ ownerID: before.member.id });

		await userHasRooms(before, after, infoBeforeChannel, infoBeforeMemberID);

		// set the flag back to false to indicate that the private room creation is complete
		PrivateRoom = false;
	}
}