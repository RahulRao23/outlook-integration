const CONSTANTS = require('../utilities/constants');

const socketHandler = (io, socket) => {

	/* Validate user on socket connection */
	socket.use(async ([event, ...args], next) => {

		console.log({event, args, socket_params: socket.parameters});

		// Returns by throwing error
		// next(new Error('CUSTOM_ERROR_MESSAGE'));

		// Executes next middlerware
		next();
	});

	socket.on(CONSTANTS.EVENT_NAMES.DUMMY, async data => {
		return socket.emit(CONSTANTS.EVENT_NAMES.DUMMY_RESPONSE, { data });
	});

	socket.on(CONSTANTS.EVENT_NAMES.DISCONNECTING, () => {
    console.log(socket.rooms); // the Set contains at least the socket ID
  });

	socket.on(CONSTANTS.EVENT_NAMES.DISCONNECT, async () => {
		/* Do something on socket disconnection */
	});

};

module.exports = socketHandler;
