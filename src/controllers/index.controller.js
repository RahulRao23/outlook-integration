const userServices = require('../services/index.services');
const STATUS = require('../../config/statusCodes.json');
const CONSTANTS = require('../utilities/constants');

require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');

async function homePage(req, res) {
	const filePath = path.join(__dirname, '../../public/homePage/home.html');
	return res.sendFile(filePath);
}

async function linkAccountPage(req, res) {
	const filePath = path.join(__dirname, '../../public/linkPage/link.html');
	return res.sendFile(filePath);
}

async function createAccount(req, res) {
	try {
		const data = res.locals.reqParams;

		if (!data.username || !data.password) {
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
			password: hashedPassword,
			status: CONSTANTS.USER_STATUS.ACTIVE,
		});
		const signData = { user_id: userData._id };

		/* Generate access token and update in DB */
		const authToken = jwt.sign(signData, process.env.JWT_PRIVATE_KEY, { expiresIn: "1h" });
		userData.auth_token = authToken;
		const user = await userData.save();

		req.session.auth_token = authToken;

		return res.status(STATUS.SUCCESS).json({
			redirect: "/link-options"
		});

	} catch (error) {
		console.log('Create Account ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
};

async function link(req, res) {
	try {
		if (!req.session.auth_token) {
			return res.redirect('/');
		}
		return res.redirect('link-options');
	} catch (error) {
		console.log('Link ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

async function linkAccount(req, res) {
	try {
		if (!req.session.auth_token) {
			return res.redirect('/');
		}
		return res.redirect('link-options');

	} catch (error) {
		console.log('Link Account ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

module.exports = {
	homePage,
	createAccount,
	linkAccountPage,
};
