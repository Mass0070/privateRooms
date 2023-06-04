const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const { axiosc } = require('../config.json');
const EMAIL_PATTERN = /^[a-zA-Z0-9_\-.]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
    return EMAIL_PATTERN.test(email);
}

module.exports = {
    config: {
        name: "mail",
        description: "Mail der skal benyttes til Docs",
        type: 1,
        options: [
            {
                name: "email",
                description: "Skriv en mail",
                type: 3,
                required: true
            }
        ],
        default_permission: false
    },
    async execute(interaction) {
        const email = interaction.options.getString('email');

        if (!validateEmail(email)) {
            const embed = new MessageEmbed()
                .setColor('#ff5242')
                .setDescription(`Ugyldig mail!`);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let data = JSON.stringify({
            userID: interaction.user.id,
            email: email
        });

        try {
            await interaction.deferReply({ ephemeral: true });

            const response = await axios.post(axiosc.url + "/api/staffs", data, {
                timeout: 2000,
                headers: {
                    [axiosc.user]: axiosc.pass,
                    'Content-Type': 'application/json'
                }
            });

            const responseData = response.data;
            console.log(responseData);

            if (responseData.message === "You can't change the email again") {
                const embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Du kan ikke ændre din mail igen!`);
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            } else if (responseData.message === "Staff member not found") {
                const embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Du er ikke staff!`);
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            } else if (responseData.message === "Success") {
                const embed = new MessageEmbed()
                    .setColor('#5fed4c')
                    .setDescription(`Du har sat din mail til \`${email}\`.`);
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            } else {
                const embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Der opstod en fejl!`);
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            const embed = new MessageEmbed()
                .setColor('#ff5242')
                .setDescription(`Der skete en fejl.`);
            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    },
};
