let commandsRegistered = false;

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		//client.user.setStatus('dnd')
		//client.user.setActivity(`superawesome.dk`, {
		//	type: "PLAYING",
		//})
		setInterval(() => { client.user.setPresence({ status: `dnd`, activities: [{ name: `Spotify | ${new Date().toLocaleTimeString('dk', { timeZone: 'Europe/Copenhagen', timeStyle: 'short' })}`, type: 2 }] }) }, 15 * 1000)

		if (!commandsRegistered) {
			//removeAllCommands(client)
			//registerCommands(client, "662831492229103626");
			commandsRegistered = true;
		}

		async function registerCommands(bot, guildId) {
			let commands = bot.commands.map(x => x.config);
			if (!bot.application?.owner) {
				await bot.application?.fetch();
			}
			let apiCommands = await bot.application?.commands.set(commands);
		
			const guild = await bot.guilds.fetch(guildId);
		
			// Register commands only in the guild
			let guildCommands = await guild.commands.fetch();
			guildCommands = guildCommands.filter(command => command.applicationId === bot.application.id);
			let commandsRegistered = guildCommands.size === apiCommands.size && guildCommands.every(command => apiCommands.find(c => c.name === command.name));
		
			if (!commandsRegistered) {
				await guild.commands.set([]);
			for (const command of apiCommands.values()) {
				await guild.commands.create(command);
			}
				console.log(`Registered ${apiCommands.size} commands in guild ${guild.id}`);
			}
		
			// Delete commands in DMs
			const dmCommands = await bot.application.commands.fetch();
			const dmCommandsToDelete = dmCommands.filter(command => command.guildId === null);
			await Promise.all(dmCommandsToDelete.map(command => command.delete()));
		}
		
		async function removeAllCommands(bot) {
			try {
			  // Retrieve all global commands registered by the bot
                const globalCommands = await bot.application.commands.fetch();

			  // Delete all global commands
                await Promise.all(globalCommands.map(command => command.delete()));

			  // Remove commands from all guilds
                bot.guilds.cache.forEach(async guild => {
				try {
				  // Retrieve all guild commands registered by the bot
                    const guildCommands = await guild.commands.fetch();

				  // Delete all guild commands
                    await Promise.all(guildCommands.map(command => command.delete()));
				} catch (error) {
                    console.error(`Error removing commands from guild ${guild.name}: ${error}`);
				}
            });

                console.log("All slash commands removed.");
			} catch (error) {
                console.error(`Error removing slash commands: ${error}`);
			}
        }
		console.log("Logget ind")
	},
};