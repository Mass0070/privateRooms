module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.channel.id === '1087047308916572160') {
            setTimeout(() => {
                message.delete().catch(console.error);
            }, 3000);
        }
    },
};
