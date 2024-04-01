module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.channel.id === '1087047308916572160') {
            setTimeout(() => {
            message.delete()
                .catch(error => {
                    //console.error('Error deleting message:');
                });
            }, 3000);
        }
    },
};
