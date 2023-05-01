const MongoClient = require('mongodb').MongoClient;
const mongodb_url = '';
const client = new MongoClient(mongodb_url, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});

async function deleteChannel(channel) {
	channel.delete()
		.then(() => console.log(`Successfully deleted channel ${channel.name}`))
		.catch(console.error);
}

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(before, after) {
        if (before.channel == after.channel) return;
		await client.connect();
		dataBefore = await{ "mainRoomID": before.channel ? before.channel.id : null }
		infoBefore = await client.db("SA-2").collection("privateRooms").findOne(dataBefore);
		
		
		//console.log("Test - Main: ", infoBefore)

        let prooms_id = '1087103471699898560';
        let proomscategory_id = '1087103324286889984';
        data = { "ownerID": before.member.id }
		info = await client.db("SA-2").collection("privateRooms").findOne(data);

		//console.log(" - Info - ", info)
		if (info != null) {
		memberRoomChannel = after.guild.channels.cache.get(info.mainRoomID);
		if (after.channel == null) {
			if (memberRoomChannel != null) {
			console.log("Sletter rum her 1")
			try {
				const roomPermission = await client.db("SA-2").collection("RoomPermissions").findOne({ ownerID: before.member.id });
				const usersWithAddReactionPerm = memberRoomChannel.members.filter(member =>
				roomPermission.permissions.users.some(user =>
					user.userID === member.id && user.permissions.allow.includes("ADD_REACTIONS")
				)
				);

				if (usersWithAddReactionPerm.size > 0) {
				console.log("One user found")
				return;
				} else {
				console.log("No users found")
				try {
					deleteChannel(memberRoomChannel);
					await client.db("SA-2").collection("privateRooms").deleteOne(data);
				} catch (error) {
					console.log("Fejlet med at slettet privatrummet. - "+data) 
				}
				waitingRoom = null;
				while (waitingRoom == null) {
					waitingRoom = after.guild.channels.cache.get(info.waitingRoomID);
					await new Promise(resolve => setTimeout(resolve, 300));
				}
				try {
					deleteChannel(waitingRoom);
				} catch (error) {}
				return;
				} 
			} catch (error) {
				console.log("Error checking permissions:", error);
				return;
			}
			}
		}
		
		else if (info.waitingRoomID == after.channel.id) {
			try {
			await after.member.voice.setChannel(before.channel);
			} catch (error) {
			console.log("Error moving member to main channel:", error);
			}
			return;
		} else if (after.channel.id == prooms_id) {
			try {
			await after.member.voice.setChannel(memberRoomChannel);
			} catch (error) {
			console.log("Error moving member to private room:", error);
			}
			return;
		}
		} else if (infoBefore != null && after.channel != infoBefore.waitingRoomID && after.channel != prooms_id && before.channel == infoBefore.mainRoomID) {
			memberRoomChannel = after.guild.channels.cache.get(infoBefore.mainRoomID);
			//console.log("Ny debug 1")
			//console.log(before.channel.id)
			try {
				const roomPermission = await client.db("SA-2").collection("RoomPermissions").findOne({ ownerID: infoBefore.mainRoomID });
				//console.log(roomPermission)
				const usersWithAddReactionPerm = memberRoomChannel.members.filter(member =>
					roomPermission.permissions.users.some(user =>
						user.userID === member.id && user.permissions.allow.includes("ADD_REACTIONS")
					)
				);
				if (usersWithAddReactionPerm.size > 0) {
					console.log("One user found - Ny")
					return;
				} else {
					console.log("No users found - NY")
					//console.log(before.channel.id)
					dataPerms = { "mainRoomID": before.channel.id }
					try {
						deleteChannel(memberRoomChannel);
						await client.db("SA-2").collection("privateRooms").deleteOne(dataPerms);
						console.log("Slet Rum - NY")
					} catch (error) {
						console.log("Fejlet med at slettet privatrummet. - "+dataPerms) 
					}
					waitingRoom = null;
					while (waitingRoom == null) {
						waitingRoom = after.guild.channels.cache.get(infoBefore.waitingRoomID);
						await new Promise(resolve => setTimeout(resolve, 300));
					}
					try {
						deleteChannel(waitingRoom);
					} catch (error) {}
					return;
				}
			} catch (error) {
				console.log("Error checking permissions:", error);
				return;
			}
		}


		if (before.channel != null) {
            data = {"ownerID": before.member.id}
            info = await client.db("SA-2").collection("privateRooms").findOne(data);
            if (info != null && before.channel.id == info.mainRoomID) {
                if (before.channel.members == 0) {
                    deleteChannel(before.channel);
                    waitingRoom = before.guild.channels.cache.get(info.waitingRoomID);
                    deleteChannel(waitingRoom);
                    await client.db("SA-2").collection("privateRooms").deleteOne(data);
                    return;
                } else {
                    if (before.member.id == info.ownerID) {
                        deleteChannel(before.channel);
                        waitingRoom = before.guild.channels.cache.get(info.waitingRoomID);
                        deleteChannel(waitingRoom);
                        await client.db("SA-2").collection("privateRooms").deleteOne(data);
                        return;
                    }
                }
            }
        }
		
		if (after.channel != null && infoBefore != null && after.channel.id == prooms_id) {
			try {
				await after.member.voice.setChannel(before.channel);
			} catch (error) {}
		}
		if (after.channel != null && infoBefore != null && after.channel.id == infoBefore.waitingRoomID) {
			try {
				await after.member.voice.setChannel(before.channel);
			} catch (error) {}
		}
		if (after.channel != null && infoBefore == null && after.channel.id == prooms_id) {
			// Set necessary variables
			const proomsCategory = after.guild.channels.cache.get(proomscategory_id);
		
			// Create main room and waiting room
			// Query the RoomPermissions collection for the owner's permissions
			const ownerPermissions = await client.db("SA-2").collection("RoomPermissions").findOne({ ownerID: after.member.id, active: 1 });
			const defaultRoomPerms = await client.db("SA-2").collection("RoomPermissions").findOne({ ownerID: "DB", active: 1 });
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
						}))
					]
				: [];

			// Create main room and waiting room with the fetched permissions
			const mainRoom = await proomsCategory.createChannel(`${after.member.user.tag} [Privatrum]`, {
			type: 'GUILD_VOICE',
			parent: proomscategory_id,
			position: 1,
			permissionOverwrites,
			});

			// Insert the main room ID into the database
			const mainRoomData = {
				ownerID: after.member.id,
				mainRoomID: mainRoom.id,
			};
			await client.db("SA-2").collection('privateRooms').insertOne(mainRoomData);
			
			const WaitingpermissionOverwrites = ownerPermissions && ownerPermissions.permissions
			? [      ...(ownerPermissions.permissions.roles.waitingRoom || [])
					.filter(p => after.guild.roles.cache.has(p.roleID))
					.map(p => ({
					id: p.roleID,
					allow: [
						...(p.permissions.allow || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL'].includes(perm))
					],
					deny: [
						...(p.permissions.deny || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL'].includes(perm))
					],
					})),
				...(ownerPermissions.permissions.users || [])
					.filter(p => after.guild.members.cache.has(p.userID))
					.map(p => ({
					id: p.userID,
					allow: [
						...(p.permissions.allow || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL'].includes(perm))
					],
					deny: [
						...(p.permissions.deny || []).filter(perm => ['MOVE_MEMBERS', 'CONNECT', 'VIEW_CHANNEL'].includes(perm))
					],
					})),
				]
				.filter(p => p.allow.includes('MOVE_MEMBERS') || p.allow.includes('CONNECT') || p.allow.includes('VIEW_CHANNEL') || p.deny.includes('MOVE_MEMBERS') || p.deny.includes('CONNECT') || p.deny.includes('VIEW_CHANNEL'))
					: defaultRoomPerms && defaultRoomPerms.permissions
					? [...(defaultRoomPerms.permissions.roles.mainRoom || [])
							.filter(p => after.guild.roles.cache.has(p.roleID))
							.map(p => ({
								id: p.roleID,
								allow: p.permissions.allow,
								deny: p.permissions.deny,
							}))
						]
					: [];
			//console.log("Perms: ", WaitingpermissionOverwrites)

			const waitingRoom = await proomsCategory.createChannel(
			`🡱 Venterum [${after.member.user.tag}]`,
			{
				type: 'GUILD_VOICE',
				parent: proomscategory_id,
				position: 2,
				permissionOverwrites: [...WaitingpermissionOverwrites],
			}
			);

			// Update the database with the waiting room ID
			const waitingRoomData = {
				waitingRoomID: waitingRoom.id,
			};
			await client.db("SA-2").collection('privateRooms').updateOne({ ownerID: after.member.id }, { $set: waitingRoomData });
					
			// Move member to the main room
			try {
				await after.member.voice.setChannel(mainRoom);
			} catch (error) {
				console.log("userID: " + after.member.id + "\nmainID: " + mainRoom.id);
				deleteChannel(mainRoom);
				deleteChannel(waitingRoom);
				await client.db("SA-2").collection("privateRooms").deleteOne(data);
			}
		}
	}
}