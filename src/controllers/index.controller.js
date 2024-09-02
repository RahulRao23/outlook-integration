const userServices = require('../services/index.services');
const STATUS = require('../../config/statusCodes.json');
const CONSTANTS = require('../utilities/constants');
const {
	fetchAndStoreEmails,
	fetchDeltaEmails,
	fetchWithRateLimitHandling,
	refreshAccessToken,
} = require('../services/microsoft.services');

require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function homePage(req, res) {
	const filePath = path.join(__dirname, '../../public/homePage/home.html');
	return res.sendFile(filePath);
}

async function dataPage(req, res) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}

	// Sync emails after successful login
	try {
		const emails = await fetchAndStoreEmails(req.user.accessToken);
		// console.log(req);
		
		res.render('dashboard', { user: req.user.displayName, emails });
	} catch (error) {
		console.error('Error during email sync:', error);
		res.status(500).send('Failed to sync emails');
	}
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
		await userData.save();

		req.session.auth_token = authToken;

		return res.status(STATUS.SUCCESS).json({
			redirect: "/auth/microsoft"
		});

	} catch (error) {
		console.log('Create Account ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

async function logout(req, res) {
	req.logout(() => {
		res.redirect('/');
	});
}

module.exports = {
	homePage,
	dataPage,
	createAccount,
	logout,
};
