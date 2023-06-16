const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const { axiosc, staffteam, roles } = require('../config.json');

async function checkVerify(client) {
    try {
        const verifyResponse = await axios({
            timeout: 2000,
            method: 'get',
            maxBodyLength: Infinity,
            url: `${axiosc.url}/api/discordmembers`,
            headers: {
                [axiosc.user]: axiosc.pass,
                'Content-Type': 'application/json'
            }
        });

        const verifiedMembers = verifyResponse.data;

        const guildId = staffteam.guildID;
        const roleId = roles.verify;

        client.on('ready', async () => {
            const guild = await client.guilds.fetch(guildId);
            const role = guild.roles.cache.get(roleId);

            if (!role) {
                console.log("Role not found.");
                return;
            }

            await guild.members.fetch();

            const membersWithRole = role.members;

            membersWithRole.forEach(member => {
                const memberDiscordID = member.user.id;
                const isVerified = verifiedMembers.some(verifiedMember => verifiedMember.discordID === memberDiscordID);

                if (!isVerified) {
                    console.log(`User isn't verified in the database.\nDiscord User: ${member.user.username}\nDiscord ID: (${member.user.id}).\n`);
                }
            });
        });

        } catch (error) {
            console.error("Error checking verified members:", error);
        }
    }

module.exports = {
    checkVerify
};
