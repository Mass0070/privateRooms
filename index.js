const fs = require('fs');
const { token, mongodb, privatrum } = require('./config.json');
const { deleteChannel } = require('./Utils/channel.js');
const { Client, Intents, Collection } = require("discord.js");
const dbPromise = require('./Utils/mongo.js');
const { updateStaffList } = require('./Utils/updateStaffs.js')

const client = new Client({
    intents: [
		Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_VOICE_STATES
    ],
    cache: {
        guilds: true,
		members: true,
        channels: false,
        messages: false,
        messageReactions: false,
        presences: false
    }
});

// Start the garbageCollector function
async function garbageCollector() {
	console.log("Running GC")

	const dbclient = await dbPromise;
	await dbclient.connect();
	try {
	  // Get all private rooms
	const privateRooms = await dbclient.db("SA-2").collection('privateRooms').find().toArray();

	  // Loop through each private room
	for (const room of privateRooms) {
		const mainRoom = await client.channels.cache.get(room.mainRoomID);
		const waitingRoom = await client.channels.cache.get(room.waitingRoomID);

		// Check if the owner is in the main room
		if (privateRooms[0].ownerID != null && privateRooms[0].mainRoomID == null || privateRooms[0].ownerID != null && privateRooms[0].waitingRoomID == null) {
			await dbclient.db("SA-2").collection('privateRooms').deleteOne({ _id: room._id });
			deleteChannel(room.mainRoomID);
			deleteChannel(room.waitingRoomID);
		}
		
		if (privateRooms[0].ownerID != null && mainRoom == null & waitingRoom != null || privateRooms[0].ownerID != null && waitingRoom == null & mainRoom != null) {
			await dbclient.db("SA-2").collection('privateRooms').deleteOne({ _id: room._id });
			deleteChannel(mainRoom);
			deleteChannel(waitingRoom);
		}
		
		try {
			if (!mainRoom.members.some(member => member.id === room.ownerID)) {
				// Owner is not in main room, check for ADD_REACTION permission
				const roomPermission = await dbclient.db("SA-2").collection('roomPermissions').findOne({ ownerID: room.ownerID });
				if (roomPermission) {
					const usersWithAddReactionPerm = mainRoom.members.filter(member =>
						roomPermission.permissions.users.some(user => 
							user.userID === member.id && user.permissions.allow.includes("ADD_REACTIONS")
						)
					);
					
					if (usersWithAddReactionPerm.size > 0) {
						console.log("One user found")
						continue;
					} else {
						console.log("No users found")
						// No users have ADD_REACTION permission or are in the waiting room, delete the private room
						await dbclient.db("SA-2").collection('privateRooms').deleteOne({ _id: room._id });
						await mainRoom.delete();
						await waitingRoom.delete();
					}
				} else {
					console.log("No roomPerms found")
					// If no roomPermission found, delete the private room
					await dbclient.db("SA-2").collection('privateRooms').deleteOne({ _id: room._id });
					
					await mainRoom.delete();
					await waitingRoom.delete();
				}
			}
		} catch (error) {
			console.log("GC Fejl: ", error)
		}
	}
	} catch (err) {
	console.error(err);
	dbclient.close()
	} finally {
	await dbclient.close();
	}
}

setTimeout(garbageCollector, 5000);
// Set up a timer that checks every 30 minutes
const intervalTime = 30 * 60 * 1000; // 30 minutes in milliseconds
setInterval(garbageCollector, intervalTime);


const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
	console.log("[EVENT]: Events Handler Started");
}

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.config.name, command);
	console.log("[EVENT]: Commands Started");
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: '*Fejl*', ephemeral: true });
	}
});

// 24 * 60 * 60 * 1000
// 3 * 60 * 1000
const intervalTime2 = 48 * 60 * 60 * 1000; // One day
setInterval(() => {
    updateStaffList(client);
}, intervalTime2);

//updateStaffList(client, 5000);



client.login(token);