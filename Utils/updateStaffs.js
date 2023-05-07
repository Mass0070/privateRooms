const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const { axiosc, roles } = require('../config.json');

async function updateStaffList(bot) {
    console.log("Updating StaffList")
    try {
        const staffsResponse = await axios({
            timeout: 2000,
            method: 'get',
            maxBodyLength: Infinity,
            url: axiosc.url + `/api/staffs`,
            headers: { 
                [axiosc.user]: axiosc.pass, 
                'Content-Type': 'application/json'
            }
        })

        const staffs = staffsResponse.data;

        const guild = await bot.guilds.fetch("662831492229103626");
        const channel = await bot.channels.fetch("735799438043250708");

        const admins = staffs.filter((x) => x.role === "admin");
        const srmods = staffs.filter((x) => x.role === "seniormod");
        const mods = staffs.filter((x) => x.role === "mod");
        const supporter = staffs.filter((x) => x.role === "support");

        const emojis = await getEmojis(guild, staffs);

        const adminsMap = admins.map((x) => {
            const emoji = emojis.find((y) => y.name === x.username);
            return `${emoji ? emoji.toString() : ""} **Admin** ${x.username}`;
        });

        const srmodsMap = srmods.map((x) => {
            const emoji = emojis.find((y) => y.name === x.username);
            return `${emoji ? emoji.toString() : ""} **SR. Mod** ${x.username}`;
        });

        const modsMap = mods.map((x) => {
            const emoji = emojis.find((y) => y.name === x.username);
            return `${emoji ? emoji.toString() : ""} **Mod** ${x.username}`;
        });

        const supporterMap = supporter.map((x) => {
            const emoji = emojis.find((y) => y.name === x.username);
            return `${emoji ? emoji.toString() : ""} **Supporter** ${x.username}`;
        });

        const embed = new MessageEmbed()
            .setTitle("Staff Teamet")
            .setDescription(
                `**Admins (${admins.length})**\n${adminsMap.join("\n")}\n
                **SR. Mods (${srmods.length})**\n${srmodsMap.join("\n")}\n
                **Mods (${mods.length})**\n${modsMap.join("\n")}\n
                **Supporter (${supporter.length})**\n${supporterMap.join("\n")}
                \n\nSidst opdateret: **${new Date().toLocaleDateString('en-GB')}**`
            )
            .setColor(16098851);


        try {
            const message = await channel.messages.fetch("1104570399146115145");
            await message.edit({ embeds: [embed] });
        } catch (error) {
            console.log("Kunne ikke opdatere embed, forkert id!")
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error("Error updating staff list:", error);
    }
}

async function getEmojis(guild, staffs) {
    const emojis = await guild.emojis.fetch();
    const emojiNames = emojis.map((x) => x.name);
    const newEmojis = [];

    for (const staff of staffs) {
        const emojiName = staff.username;
    
        // Check if an emoji with the same name already exists
        if (!emojiNames.includes(emojiName)) {
            const url = `https://crafatar.com/renders/head/${staff.uuid}?overlay`;
    
            try {
                // Create the new emoji
                const emoji = await guild.emojis.create(url, emojiName);
                newEmojis.push(emoji);
    
            } catch (error) {
                console.error(`Failed to create emoji for ${emojiName}: ${error}`);
    
                // Stop trying to create new emojis if the maximum limit is reached
                if (error.message.includes("Maximum number of emojis reached")) {
                    break;
                }
            }
        }
    }
    
    // Return all emojis (including any newly created ones)
    return emojis.concat(newEmojis);
}


module.exports = {
    updateStaffList
};