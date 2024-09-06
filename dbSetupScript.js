const client = require('./config/dbConnectES');

const DBSetup = async () => {
	try {
		const userIndexExists = await client.indices.exists({ index: 'users' });
		const emailIndexExists = await client.indices.exists({ index: 'emails' });
		if (!userIndexExists) await client.indices.create({ index: 'users' });
		if (!emailIndexExists) await client.indices.create({ index: 'emails' });
	} catch (error) {
		console.log("Something went wrong during DB setup", error);
	}
}

// (
// 	async () => { await DBSetup() }
// )()
module.exports = DBSetup;
