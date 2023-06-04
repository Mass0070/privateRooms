const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const USERNAME_PATTERN = /^(?=.{1,20}$)[A-Za-z0-9+_]+$/;

module.exports = {
	config: {
		name: "update",
        description: "Opdatere dit Discord navn",
        type: 1,
        options: [
			{
			name: "brugernavn",
			description: "Skriv et brugernavn",
			type: 3,
			required: true
			}
		],
        default_permission: false
	},
	async execute(interaction) {
        function validateUsername(username) {
            return USERNAME_PATTERN.test(username);
        }
		const brugernavn = interaction.options.getString('brugernavn');

        // Check if the bot's highest role is higher than the user's highest role
        if (interaction.guild.me.roles.highest.comparePositionTo(interaction.member.roles.highest) <= 0) {
            embed = new MessageEmbed()
            .setColor('#ff5242')
			.setDescription(`Ikke muligt da du har et højere rank end botten!`)
            interaction.reply({embeds: [embed], ephemeral: true})
            return ;
        }

        if (!validateUsername(brugernavn)) {
            embed = new MessageEmbed()
            .setColor('#ff5242')
			.setDescription(`Ugyldigt navn!`)
            interaction.reply({embeds: [embed], ephemeral: true})
            return ;
        }

        axios.get('http://localhost:5000/api/discord/update', {
        timeout: 2000,
        headers: {'root': '4gJrnA9Yw9ZB2yXWKmzzH8AT'},
        params: {
            username: brugernavn,
            discordID: interaction.user.id,
        }
        })

        .then((response) => {
            //console.log(response.data);
            const data = response.data[0]; // Accessing the first (and only) object in the array
            if(response.data != "") {
                try {
                    interaction.member.setNickname(data.username);
                    embed = new MessageEmbed()
                    .setColor('#5fed4c')
                    .setDescription(`Du har nu fået opdateret dit navn til \`${data.username}\`.`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }  catch (error) {
                    console.error(error);
                    embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Der opstod en fejl!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }
            } else {
                embed = new MessageEmbed()
                .setColor('#ff5242')
                .setDescription(`\`${brugernavn}\` findes ikke.`)
                interaction.reply({embeds: [embed], ephemeral: true})
            }
            
        })
        .catch((error) => {
            console.error(error);
            embed = new MessageEmbed()
            .setColor('#ff5242')
			.setDescription(`\`${brugernavn}\` findes ikke.`)
            interaction.reply({embeds: [embed], ephemeral: true})
        });
	},
};