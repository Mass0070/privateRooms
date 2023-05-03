async function deleteChannel(channel) {
    channel.delete()
        .then(() => console.log(`Successfully deleted channel ${channel.name}`))
        .catch(console.error);
}

async function disconnect(user) {
    user.voice.disconnect()
        .then(() => console.log(`Successfully disconnected user ${user.displayName}`))
        .catch(console.error);
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