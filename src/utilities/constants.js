const constants = {};

constants.USER_STATUS = {
	ACTIVE: 1,
	DELETED: 2,
	LOGGED_OUT: 3,
};

constants.EVENT_NAMES = {
	DUMMY: 'dummy',
	DUMMY_RESPONSE: 'dummy-response',
	DISCONNECTING: 'disconnecting',
	DISCONNECT: 'disconnect',
	DISCONNECT_RESPONSE: 'disconnect-response',
};

constants.SALT_ROUNDS = 10;

constants.JWT_PRIVATE_KEY = '<PRIVATE-KEY>';

module.exports = constants;
