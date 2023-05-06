const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const { axiosc, roles } = require('../config.json');

async function getCustomPermission(permission) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (permission === "VIEW_CHANNEL") {
        return "Adgang til at se kanalen";
    }
    if (permission === "CONNECT") {
        return "Adgang til at forbinde til kanalen";
    }
    if (permission === "MOVE_MEMBERS") {
        return "Adgang til at flytte medlemmere";
    }
    if (permission === "STREAM") {
        return "Adgang til at streame";
    }
    if (permission === "ADD_REACTIONS") {
        return "Keep on leave";
    }
    return Promise.resolve(permission);
}


module.exports = {
    config: {
		name: "perms",
        description: "Manage room permissions",
        type: 1,
        options: [
            {
                name: 'list',
                description: 'List all room permissions',
                type: 'SUB_COMMAND'
            },
            {
                name: 'add',
                description: 'Add a room permission',
                type: 'SUB_COMMAND',
                options: [
                    {
                        name: 'username',
                        description: 'The user to add',
                        type: 'USER',
                        required: true
                    },
                    {
                        name: 'permission',
                        description: 'The permission to grant the user',
                        type: 'STRING',
                        required: true,
                        choices: [
                            {
                                name: 'Adgang til at se kanalen',
                                value: 'VIEW_CHANNEL'
                            },
                            {
                                name: 'Adgang til at forbinde til kanalen',
                                value: 'CONNECT'
                            },
                            {
                                name: 'Adgang til at flytte medlemmere',
                                value: 'MOVE_MEMBERS'
                            },
                            {
                                name: 'Adgang til at streame',
                                value: 'STREAM'
                            },
                            {
                                name: 'Keep on leave',
                                value: 'ADD_REACTIONS'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Remove a room permission',
                type: 'SUB_COMMAND',
                options: [
                    {
                        name: 'username',
                        description: 'The user to remove',
                        type: 'USER',
                        required: true
                    },
                    {
                        name: 'permission',
                        description: 'The permission to grant the user',
                        type: 'STRING',
                        required: false,
                        choices: [
                            {
                                name: 'Adgang til at se kanalen',
                                value: 'VIEW_CHANNEL'
                            },
                            {
                                name: 'Adgang til at forbinde til kanalen',
                                value: 'CONNECT'
                            },
                            {
                                name: 'Adgang til at flytte medlemmere',
                                value: 'MOVE_MEMBERS'
                            },
                            {
                                name: 'Adgang til at streame',
                                value: 'STREAM'
                            },
                            {
                                name: 'Keep on leave',
                                value: 'ADD_REACTIONS'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'clear',
                description: 'Clear room permissions',
                type: 'SUB_COMMAND'
            }
        ]
    },
    async execute(interaction) {
        // code for handling the interaction
        const subCommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('username');

        if (subCommand === 'clear') {
            axios({
            timeout: 2000,
            method: 'post',
            maxBodyLength: Infinity,
            url: axiosc.url + `/api/permission/${interaction.user.id}`,
            headers: { 
                [axiosc.user]: axiosc.pass, 
                'Content-Type': 'application/json'
            }
            })

            .then((response) => {
                const message = response.data.message;
                if(message === "Success") { 
                    try {
                        // Perform action for adding permission to user with given username and permission
                        embed = new MessageEmbed()
                            .setColor('#5b8abf')
                            .setTitle("Permission")
                            .setDescription(`**Rydet alle permission**`)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    } catch (error) {
                        console.error(error);
                        embed = new MessageEmbed()
                            .setColor('#ff5242')
                            .setDescription(`Der opstod en fejl!`)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    }
                } else {
                    embed = new MessageEmbed()
                        .setColor('#ff5242')
                        .setDescription(`Der skete en fejl!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }      
            })
            .catch((error) => {
                console.error(error);
                embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Kunne ikke ryddes!`)
                interaction.reply({embeds: [embed], ephemeral: true})
            });
        }

        if (subCommand === 'add') {
            if (user.bot) {
                embed = new MessageEmbed()
                    .setColor('#5b8abf')
                    .setTitle("Permission")
                    .setDescription(`Du kan ikke gøre dette med en bot!`)
                interaction.reply({embeds: [embed], ephemeral: true})
                return;
            }

            if (!(await interaction.guild.members.fetch(user.id).catch(() => null))) {
                embed = new MessageEmbed()
                    .setColor('#5b8abf')
                    .setTitle("Permission")
                    .setDescription(`Brugeren skal være en del af Discorden!`)
                interaction.reply({embeds: [embed], ephemeral: true})
                return;
            }     
            
            let premium = null;

            if (interaction.member.roles.cache.has(roles.vip) || interaction.member.roles.cache.has(roles.booster) || interaction.member.roles.cache.has(roles.staff)) {
                if (interaction.member.roles.cache.has(roles.vip) && interaction.member.roles.cache.has(roles.booster) || interaction.member.roles.cache.has(roles.staff)) {
                    premium = "BoV";
                } else if (interaction.member.roles.cache.has(roles.vip)) {
                    premium = "VIP";
                } else if (interaction.member.roles.cache.has(roles.booster)) {
                    premium = "Booster";
                } 
            }

            const permission = interaction.options.getString('permission');
            var CustomName = await getCustomPermission(permission)
            let data = JSON.stringify({
                userID: interaction.user.id,
                premium: premium,
                userToAdd: user.id,
                type: 'add',
                typePerm: "allow",
                permission: permission
            });

            axios({
            timeout: 2000,
            method: 'post',
            maxBodyLength: Infinity,
            url: axiosc.url + '/api/permission/',
            headers: { 
                [axiosc.user]: axiosc.pass, 
                'Content-Type': 'application/json'
            },
            data : data
            })
                
            .then((response) => {
                const message = response.data.message;
                if(message === "Success") { 
                    try {
                        // Perform action for adding permission to user with given username and permission
                        embed = new MessageEmbed()
                            .setColor('#5b8abf')
                            .setTitle("Permission")
                            .setDescription(`**Tilføjet permission**\n *-* \`${CustomName}\`\n\n**Til brugeren**\n *-*\`${user.username}\``)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    } catch (error) {
                        console.error(error);
                        embed = new MessageEmbed()
                            .setColor('#ff5242')
                            .setDescription(`Der opstod en fejl!`)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    }
                } else if(message === "Permission already exists for the user") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Brugeren har allerede denne permission.\n\n**Permission**\n *-* \`${CustomName}\`\n\n**Til brugeren**\n *-*\`${user.username}\``)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else if(message === "userToAdd is the same as userID") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du kan ikke tilføje permissions til dig selv!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else if(message === "Max 3 users as a normal user") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du kan kun tilføje permission til 3 andre spillere!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else if(message === "Max 10 users with Booster" || message === "Max 10 users with VIP") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du kan kun tilføje permission til 10 andre spillere!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else if(message === "Max 20 users with Booster and VIP") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du kan kun tilføje permission til 20 andre spillere!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else {
                    embed = new MessageEmbed()
                        .setColor('#ff5242')
                        .setDescription(`Der skete en fejl!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }      
            })
            .catch((error) => {
                console.error(error);
                embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Kunne ikke tilføjes!`)
                interaction.reply({embeds: [embed], ephemeral: true})
            });
        }

        if (subCommand === 'remove') {
            if (user.bot) {
                embed = new MessageEmbed()
                    .setColor('#5b8abf')
                    .setTitle("Permission")
                    .setDescription(`Du kan ikke gøre dette med en bot!`)
                interaction.reply({embeds: [embed], ephemeral: true})
                return;
            }

            if (!(await interaction.guild.members.fetch(user.id).catch(() => null))) {
                embed = new MessageEmbed()
                    .setColor('#5b8abf')
                    .setTitle("Permission")
                    .setDescription(`Brugeren skal være en del af Discorden!`)
                interaction.reply({embeds: [embed], ephemeral: true})
                return;
            }            

            const permission = interaction.options.getString('permission');
            var CustomName = await getCustomPermission(permission)
            let data = JSON.stringify({
                userID: interaction.user.id,
                userToAdd: user.id,
                type: 'remove',
                typePerm: "allow",
                permission: permission
            });

            axios({
            timeout: 2000,
            method: 'post',
            maxBodyLength: Infinity,
            url: axiosc.url + '/api/permission/',
            headers: { 
                [axiosc.user]: axiosc.pass,
                'Content-Type': 'application/json'
            },
            data : data
            })
                    
            .then((response) => {
                const message = response.data.message;
                if(message === "Success") { 
                    try {
                        // Perform action for adding permission to user with given username and permission
                        embed = new MessageEmbed()
                            .setColor('#5b8abf')
                            .setTitle("Permission")
                            .setDescription(`**Fjernet permission**\n *-* \`${CustomName}\`\n\n**Fra brugeren**\n *-*\`${user.username}\``)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    } catch (error) {
                        console.error(error);
                        embed = new MessageEmbed()
                            .setColor('#ff5242')
                            .setDescription(`Der opstod en fejl!`)
                        interaction.reply({embeds: [embed], ephemeral: true})
                    }
                } else if(message === "Permission doesnt exist for the user") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du har allerede fjernet denne permission fra brugeren.\n\n**Permission**\n *-* \`${CustomName}\`\n\n**Til brugeren**\n *-*\`${user.username}\``)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else if(message === "userToAdd is the same as userID") { 
                    embed = new MessageEmbed()
                        .setColor('#5b8abf')
                        .setTitle("Permission")
                        .setDescription(`Du kan ikke fjerne permissions fra dig selv!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else {
                    embed = new MessageEmbed()
                        .setColor('#ff5242')
                        .setDescription(`Der skete en fejl!`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }      
            })
            .catch((error) => {
                console.error(error);
                embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Kunne ikke fjernes!`)
                interaction.reply({embeds: [embed], ephemeral: true})
            });
        }

        if (subCommand === 'list') {
            interaction.deferReply({ephemeral: true})
            .then(() => {
                axios({
                timeout: 2000,
                method: 'get',
                maxBodyLength: Infinity,
                url: axiosc.url + `/api/permission/${interaction.user.id}`,
                headers: { 
                    [axiosc.user]: axiosc.pass, 
                    'Content-Type': 'application/json'
                }
                })
                
                .then((response) => {
                    const message = response.data;
                        try {
                            // Show a organized list of only users by name(Use their ID to get their Discord name) and what perms they have allowed or denied.   
                            const embed = new MessageEmbed()
                            .setColor('#5b8abf')
                            .setTitle('Bruger Permissions');

                            const memberPromises = response.data.users.map(async user => {
                                try {
                                    const member = await interaction.guild.members.fetch(user.userID);
                                    const userName = member ? member.displayName.replace(/~/g, "\\~").replace(/_/g, "\\_") : user.userID;
                                
                                const allowedPerms = user.permissions.allow && user.permissions.allow.length > 0
                                    ? await Promise.all(user.permissions.allow.map(p => getCustomPermission(p)))
                                        .then(permissions => permissions.map(p => `\n\`[✔] ${p}\``).join(''))
                                    : '';
                                
                                const deniedPerms = user.permissions.deny && user.permissions.deny.length > 0
                                    ? user.permissions.deny.map(p => `\n\`[✘] ${p}\``).join('')
                                    : '';
                                
                                embed.addFields({ name: userName, value: allowedPerms + deniedPerms });
                                } catch (error) {
                                    console.error(`Error fetching member with ID ${user.userID}: ${error}`);
                                }
                            });
                            
                            Promise.all(memberPromises).then(() => {
                                interaction.editReply({ embeds: [embed], ephemeral: true });


                            }).catch(error => {
                                console.error(error);
                            });


                        } catch (error) {
                            console.error(error);
                            embed = new MessageEmbed()
                                .setColor('#ff5242')
                                .setDescription(`Der opstod en fejl!`)
                            interaction.editReply({embeds: [embed], ephemeral: true})
                        }
                })
                .catch((error) => {
                    console.error(error);
                    embed = new MessageEmbed()
                        .setColor('#ff5242')
                        .setDescription(`Kunne ikke hentes!`)
                    interaction.editReply({embeds: [embed], ephemeral: true})
                });
            })
            .catch((error) => {
                console.error(error);
                embed = new MessageEmbed()
                    .setColor('#ff5242')
                    .setDescription(`Kunne ikke hentes!`)
                interaction.editReply({embeds: [embed], ephemeral: true})
            });
        }
    }
}
