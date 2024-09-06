const CONSTANTS = require('../utilities/constants');
const { getData } = require('../services/elasticSearch/user.services');
const { getCount } = require('../services/elasticSearch/emails.services');
const { getTotalMailCount, fetchDeltaEmails } = require('../services/microsoft/microsoft.services');
const socketHandler = (io, socket) => {

	/* Validate user on socket connection */
	socket.use(async ([event, ...args], next) => {

		console.log({event, args, socket_params: socket.parameters});

		// Returns by throwing error
		// next(new Error('CUSTOM_ERROR_MESSAGE'));

		// Executes next middlerware
		next();
	});

	socket.on('requestSyncPercentage', async data => {
		const userId = data.user_id;
		console.log(userId);

		const userDetails = await getData(userId);
		const accessToken = userDetails['_source'].outlook_access_token;
		const totalMails = await getTotalMailCount(accessToken);
		const emailData = await getCount({
			match: {
				'to.keyword': userDetails['_source'].email
			}
		});		
		// const percentage = data
		return socket.emit('syncProgressPercentage', { percentage: Number(emailData.count / totalMails) * 100 });
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
