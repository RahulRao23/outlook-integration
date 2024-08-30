const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI;
const DB_NAME = process.env.DB_NAME;

let dbConnection;

function dbConnect() {
	try {
		if (dbConnection) return dbConnection;
		
		mongoose.connect(`${URI}/${DB_NAME}`);

		dbConnection = mongoose.connection;

		dbConnection.once('open', () => {
			console.log('DB connection successful');
		});
		dbConnection.on('error', err => {
			console.error('DB connection error: ', err);
		});
	} catch (error) {
		console.error('DB connection error: ', error);
	}
}

async function dbDisconnect() { }

module.exports = {
	dbConnect,
	dbDisconnect,
};
