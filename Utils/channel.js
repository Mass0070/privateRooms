async function deleteChannel(channel) {
    if (!channel) {
        console.error("Channel is undefined.");
        return;
    }

    channel.delete()
        .then(() => console.log(`Successfully deleted channel ${channel.name}`))
        .catch(error => console.error(`Failed to delete channel ${channel.name}: ${error}`));
}


async function disconnect(user) {
    try {
        await user.voice.disconnect();
        console.log(`Successfully disconnected user ${user.displayName}`);
    } catch (error) {
        console.error(`Failed to disconnect user ${user.displayName}: ${error}`);
    }
}

async function move(user, channel) {
    try {
        await user.voice.setChannel(channel);
        console.log(`Successfully moved user ${user.displayName}`);
    } catch (error) {
        console.error(error);
        await disconnect(user);
    }
}

module.exports = {
    deleteChannel,
    disconnect,
    move,
};