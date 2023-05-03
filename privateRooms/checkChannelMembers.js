async function checkChannelMembers(before, after) {
    console.log("\n--- Check voice channel ---")
    try {
        console.log(before.channel.id)
        console.log(after.channel.id)
    } catch (error) {}
}

module.exports = {
    checkChannelMembers
};
