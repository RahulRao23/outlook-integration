const client = require('./config/dbConnectES');

const DBSetup = async () => {
	try {
		await client.indices.create({ index: 'users' });
		await client.indices.create({ index: 'emails' });
	} catch (error) {
		console.log("Something went wrong during DB setup", error);
	}
}

(
	async () => { await DBSetup() }
)()
