const fetch = require('node-fetch');

async function sendMessage(client, guildId, channelId, messageContent) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        if (channel && channel.isText()) {
            const MAX_MESSAGE_LENGTH = 2000;
            if (messageContent.length <= MAX_MESSAGE_LENGTH) {
                await channel.send(messageContent);
            } else {
                const chunks = splitMessageIntoChunks(messageContent, MAX_MESSAGE_LENGTH);
                for (const chunk of chunks) {
                    await channel.send(chunk);
                }
            }
        } else {
            console.error(`Channel with ID ${channelId} not found or not a text channel.`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function getMessageContentFromLink(link) {
    try {
        const response = await fetch(link);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching message content:', error);
        return '';
    }
}

async function sendMessageSplit(client, guildId, channelId, link) {
    console.log("Here");
    const messageContent = await getMessageContentFromLink(link);
    if (messageContent) {
        await sendMessage(client, guildId, channelId, messageContent);
    } else {
        console.error('Failed to fetch message content from the link.');
    }
}

function splitMessageIntoChunks(message, chunkSize) {
    const chunks = [];
    let currentChunk = '';
    const splitMarker = '< --- split here --- >';
    const lines = message.split('\n');
    for (const line of lines) {
        if (line.includes(splitMarker)) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
        } else {
            if (currentChunk.length + line.length + 1 <= chunkSize) {
                currentChunk += line + '\n';
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = line + '\n';
            }
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}


module.exports = {
    sendMessageSplit
};
