const { privatrum } = require('../config.json');
const dbPromise = require('../Utils/mongo.js');
const { deleteChannel, disconnect } = require('../Utils/channel.js');
const { userHasRooms } = require('../privateRooms/userHasRooms.js');
const { checkChannelMembers } = require('../privateRooms/checkChannelMembers.js');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(before, after) {
		let PrivateRoom = false; 

		if (PrivateRoom) {
			await new Promise((resolve) => {
				const intervalId = setInterval(() => {
				if (!PrivateRoom) {
					clearInterval(intervalId);
					resolve();
				}
				}, 1500);
			});
		}

		try {
			PrivateRoom = true;

			const dbclient = await dbPromise;
			await dbclient.connect();
			// Check the room the user came from
			infoBeforeChannel = await dbclient.db("SA-2").collection("privateRooms").findOne({ "mainRoomID": before.channel ? before.channel.id : null });
			
			// Check if user has a room in the database
			infoBeforeMemberID = await dbclient.db("SA-2").collection("privateRooms").findOne({ ownerID: before.member.id });

			await userHasRooms(before, after, infoBeforeChannel, infoBeforeMemberID);
		} catch (error) {
			console.log("privateRooms Fejl", error);
		}
		PrivateRoom = false;
	}
}