const { MessageEmbed } = require("discord.js");
const MinecraftAPI = require('minecraft-api');

module.exports = {
	config: {
		name: "uuid",
        description: "Få en spillers UUID",
        type: 1,
        options: [
			{
			name: "brugernavn",
			description: "Skriv et brugernavn, og få brugernavnets UUID",
			type: 3,
			required: true
			}
		],
        default_permission: false
	},
	async execute(interaction) {
		const brugernavn = interaction.options.getString('brugernavn');
        uuid = null;
		try {
            uuid = await MinecraftAPI.uuidForName(brugernavn);
        } catch (error) {}
            var embed = new MessageEmbed();
        if (uuid != null) {
            const convertUuid = (i) => i.substr(0,8)+"-"+i.substr(8,4)+"-"+i.substr(12,4)+"-"+i.substr(16,4)+"-"+i.substr(20);
            uuid = convertUuid(uuid)
            embed = new MessageEmbed()
			.setColor('#5fed4c')
			.setDescription(`\`${uuid}\``)
        } else {
            embed = new MessageEmbed()
            .setColor('#ff5242')
			.setDescription(`\`${brugernavn}\` findes ikke.`)
        }
        await interaction.reply({embeds: [embed], ephemeral: true})
	},
};