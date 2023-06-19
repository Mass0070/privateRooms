// defaultPermissions.js

const defaultPermissions = {
	ownerID: null,
	active: 1,
	permissions: {
		users: [
		{
			userID: null,
			permissions: {
			allow: ['VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS']
			}
		}
		],
		roles: {
		mainRoom: [
			{
			roleID: '662831492229103626',
			permissions: {
				deny: ['VIEW_CHANNEL', 'CONNECT']
			}
			},
			{
			roleID: '739186031412379738',
			permissions: {
				deny: ['VIEW_CHANNEL', 'CONNECT']
			}
			},
			{
			roleID: '1102307581030055936',
			permissions: {
				allow: ['VIEW_CHANNEL']
			}
			},
			{
			roleID: '1083887455855460432',
			permissions: {
				allow: ['VIEW_CHANNEL']
			}
			}
		],
		waitingRoom: [
			{
			roleID: '662831492229103626',
			permissions: {
				deny: ['VIEW_CHANNEL', 'SPEAK']
			}
			},
			{
			roleID: '739186031412379738',
			permissions: {
				deny: ['VIEW_CHANNEL', 'SPEAK']
			}
			},
			{
			roleID: '1102307581030055936',
			permissions: {
				allow: ['VIEW_CHANNEL']
			}
			},
			{
			roleID: '1083887455855460432',
			permissions: {
				allow: ['VIEW_CHANNEL']
			}
			}
		]
		}
	}
};

module.exports = defaultPermissions;