const { EmailModel } = require('../models/models');

async function bulkInsert(emails) {
	return await EmailModel.insertMany(emails);
}

module.exports = {
	bulkInsert,
};
