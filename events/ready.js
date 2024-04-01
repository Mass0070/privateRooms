let commandsRegistered = false;

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		setInterval(() => { client.user.setPresence({ status: `dnd`, activities: [{ name: `Spotify | ${new Date().toLocaleTimeString('en-DK', { timeZone: 'Europe/Copenhagen', timeStyle: 'short' })}`, type: 2 }] }) }, 15 * 1000)

		if (!commandsRegistered) {
			//removeAllCommands(client)
			//registerCommands(client, "662831492229103626");
			commandsRegistered = true;
		}

		async function registerCommands(bot, guildId) {
			const commands = bot.commands.map(x => x.config);
			if (!bot.application?.owner) {
				await bot.application?.fetch();
			}

			const guild = await bot.guilds.fetch(guildId);
			const guildCommands = await guild.commands.fetch();

			// Find the commands to delete
			const commandsToDelete = guildCommands.filter(command => !commands.find(c => c.name === command.name));
			await Promise.all(commandsToDelete.map(command => command.delete()));
			
			// Find the commands to create
			const commandsToCreate = commands.filter(command => !guildCommands.find(c => c.name === command.name));
			await Promise.all(commandsToCreate.map(command => guild.commands.create(command)));
		
			console.log(`Registered ${commands.length} commands in guild ${guild.id}`);
		
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