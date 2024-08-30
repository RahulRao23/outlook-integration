const userServices = require('../services/users.services');
const STATUS = require('../../config/statusCodes.json');
const CONSTANTS = require('../utilities/constants');

const bcrypt = require('bcrypt');

async function debug(req, res) {
	return res.send({ mesg: "debug response" });
};

/** Sign Up
 * 
 * @param {{
 * 	email: String;
 *  username: String;
 * 	password: String;
 * }} req 
 * @param {*} res 
 * @returns 
 */
async function signUp(req, res) {
	try {
		const data = res.locals.reqParams;

		if (!data.email || !data.username || !data.password) {
			return res.status(STATUS.BAD_REQUEST).send({
				error: 'BAD_REQUEST',
				message: 'Required data not sent',
			});
		}

		const hashedPassword = bcrypt.hashSync(
			data.password,
			CONSTANTS.SALT_ROUNDS
		);

		const userData = await userServices.createUser({
			name: data.username,
			email: data.email,
			password: hashedPassword,
			status: CONSTANTS.USER_STATUS.ACTIVE,
		});

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
			data: userData,
		});
	} catch (error) {
		console.log('Sign Up ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
};

async function getAllUsers(req, res) {
	try {

		const userList = await userServices.getAllUsers();

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
			data: userList,
		});
	} catch (error) {
		console.log('getAllUsers ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
};

module.exports = {
	debug,
	signUp,
	getAllUsers
};
