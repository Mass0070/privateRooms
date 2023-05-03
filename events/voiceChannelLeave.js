const { privatrum } = require('../config.json');
const { checkChannelMembers } = require('../privateRooms/checkChannelMembers.js');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(before, after) {
        if (before.channel == after.channel) return;

		if (after.channel?.parentId !== privatrum.kategori) {
			checkChannelMembers(before, after);
            return;
        }
	}
}