const fs = require('fs');
const axios = require('axios');
const { Client, Intents, Collection } = require("discord.js");
const MongoClient = require('mongodb').MongoClient;
const mongodb_url = '';
const dbclient = new MongoClient(mongodb_url, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});


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

async function garbageCollector() {
	console.log("Test GC")
	await dbclient.connect();
	try {
	  // Get all private rooms
	const privateRooms = await dbclient.db("SA-2").collection('privateRooms').find().toArray();

	  // Loop through each private room
	for (const room of privateRooms) {
		// Check if the owner is in the main room
		if (privateRooms[0].ownerID != null && privateRooms[0].mainRoomID == null) {
			await dbclient.db("SA-2").collection('privateRooms').deleteOne({ _id: room._id });
		}
		
		const mainRoom = await client.channels.cache.get(room.mainRoomID);
		const waitingRoom = await client.channels.cache.get(room.waitingRoomID);
		try {
		if (!mainRoom.members.some(member => member.id === room.ownerID)) {
		  // Owner is not in main room, check for ADD_REACTION permission
		const roomPermission = await dbclient.db("SA-2").collection('RoomPermissions').findOne({ ownerID: room.ownerID });
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
// Set up a timer that checks every 10 minutes
const intervalTime = 10 * 60 * 1000; // 10 minutes in milliseconds
setInterval(garbageCollector, intervalTime);

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.config.name, command);
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

client.on('channelCreate', async (channel) => {
	//console.log(channel)
	if (channel?.parentId !== "1087103324286889984") {
		return;
	}
	
	await dbclient.connect();
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
});



client.login('NzI4Mjg3NTY2NTY2MTI5NzA4.GLG7bo.UFfG7FSE9LZ_2Yikv_QdYj7ki3SoIrRzEmvhK8');