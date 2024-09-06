require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { randomUUID: UUID } = require('crypto');

const STATUS = require('../../config/statusCodes.json');
const CONSTANTS = require('../utilities/constants');

const {
	createUser,
	searchData, 
	updateData,
	getData,
	deleteUserById,
} = require('../services/elasticSearch/user.services');

const {
	searchEmailData,
} =
require('../services/elasticSearch/emails.services');

const dbScript = require('../../dbSetupScript');

const {
	initialEmailSync,
	fetchDeltaEmails,
	refreshAccessToken,
	fetchForlderDetails,
} = require('../services/microsoft/microsoft.services');

async function homePage(req, res) {
	const filePath = path.join(__dirname, '../../public/homePage/home.html');
	return res.sendFile(filePath);
}

async function dataPage(req, res) {
	try {
		const filePath = path.join(__dirname, '../../public/dataPage/data.html');
		return res.sendFile(filePath);
	} catch (error) {
		console.error('Error during email sync:', error);
		res.status(500).send('Failed to sync emails');
	}
}

async function authMicrosoft(req, res, next) {
	const state = {user_id:req.params.userId};
	console.log({user_id:req.params.userId});
	
	passport.authenticate('oauth2', { state })(req, res, next);
}

async function authMicrosoftCallback(req, res, next) {
	try {
		console.log("callback" ,req.session, req.query);
	
		if (!req.session.user_id) {
			return next('Session timedout!');
		}

		passport.authenticate('oauth2', async (err, user, info) => {
				if (err) {
					console.error('Passport authentication error:', err);
					return next(err);
				}
				console.log("callback", {user});
				
				if (!user) {
					console.error('User not authenticated:', info);
					await deleteUserById(req.session.user_id);
					return res.redirect('/');
				}
				console.log('User authenticated:', {callback_user_id: user.outlook_id});

			const [exists] = await searchData({
				query: {
					match: { outlook_id: user.outlook_id }
				}
			});
			console.log({exists});
			
			if (!exists) {				
				await updateData(req.session.user_id, user);
			} else {
				console.log("user does not exist");
				return res.redirect('/');
			}
			res.redirect('/dashboard');
		})(req, res, next);
	} catch (error) {
		console.log('Auth Microsoft Callback ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
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

		// Create tables if not created
		await dbScript();

		const [userDetails] = await searchData({
			query: {
				term: { 'username.keyword': data.username }
			}
		})

		// New User Flow
		if (!userDetails) {
			const hashedPassword = bcrypt.hashSync(
				data.password,
				CONSTANTS.SALT_ROUNDS
			);
			const uniqueId = UUID();
	
			/* Generate access token and update in DB */
			const authToken = jwt.sign({ user_id: uniqueId }, process.env.JWT_PRIVATE_KEY);
	
			await createUser(
				uniqueId,
				{
				username: data.username, 
				password: hashedPassword,
				auth_token: authToken,
				status: CONSTANTS.USER_STATUS.ACTIVE,
			});
	
			req.session.auth_token = authToken;
			req.session.user_id = uniqueId;
			req.session.is_new_user = true;
	
			return res.status(STATUS.SUCCESS).json({
				redirect: `/auth/microsoft-authorize/${uniqueId}`
			});
		} else {
			let updateUserDetails = {};
			
			if (Date.now() >= userDetails['_source'].access_token_expires) {
				updateUserDetails = await refreshAccessToken(userDetails['_source'].outlook_refresh_token);
			}
			const authToken = jwt.sign({ user_id: userDetails['_id'] }, process.env.JWT_PRIVATE_KEY);

			req.session.auth_token = authToken;
			req.session.user_id = userDetails['_id'];
			req.session.is_new_user = false;

			await updateData(userDetails['_id'], {...updateUserDetails, auth_token: authToken});
			return res.status(STATUS.SUCCESS).json({
				redirect: '/dashboard'
			});
		}

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
		console.log('logout');
		
		res.redirect('/');
	});
}

async function getOutlookFolders(req, res) {
	try {
		const userDetails = await getData(req.session.user_id);
		const accessToken = userDetails['_source'].outlook_access_token;

		const folderData = await fetchForlderDetails(accessToken);

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
			folder_data: folderData,
			user_id: req.session.user_id,
		});
		
	} catch (error) {
		console.log('Get Outlook folders ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

async function getOutlookMails(req, res) {
	try {
		const folderId = req.query.folder_id;
		const page = req.query.page;
		const size = req.query.pageSize;

		const emailData = await searchEmailData({
			query: {
				term: { 'parent_folder.keyword': folderId }
			}
		}, page, size);

		const emailList = emailData.email_data.map(email => email['_source']);

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
			email_data: emailList,
			total_pages: emailData.total_pages,
		});
	} catch (error) {
		console.log('Get Outlook Mails ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

async function initialSync(req, res) {
	try {
		const userDetails = await getData(req.session.user_id);
		const accessToken = userDetails['_source'].outlook_access_token;
		const isNewUser = req.session.is_new_user;

		if (isNewUser)
			await initialEmailSync(userDetails['_source'].email, accessToken);

		req.session.is_new_user = false;

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
		});
	} catch (error) {
		console.log('Get Outlook Mails ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

async function outlookSyncDelta(req, res) {
	try {
		const userDetails = await getData(req.session.user_id);
		const accessToken = userDetails['_source'].outlook_access_token;
		const folderId = req.query.folder_id;
		const page = req.query.page;
		const size = req.query.pageSize;

		await fetchDeltaEmails(userDetails['_source'].email, accessToken);

		const emailData = await searchEmailData({
			query: {
				term: { 'parent_folder.keyword': folderId }
			}
		}, page, size);

		const emailList = emailData.email_data.map(email => email['_source']);

		return res.status(STATUS.SUCCESS).send({
			message: 'SUCCESS',
			email_data: emailList,
			total_pages: emailData.total_pages,
		});

	} catch (error) {
		console.log('outlookSyncDelta ERROR: ', error);
		return res.status(STATUS.INTERNAL_SERVER_ERROR).send({
			error: 'INTERNAL_SERVER_ERROR',
			message: error.message ? error.message : 'Something went wrong',
		});
	}
}

module.exports = {
	homePage,
	dataPage,
	createAccount,
	authMicrosoft,
	authMicrosoftCallback,
	logout,
	getOutlookFolders,
	getOutlookMails,
	outlookSyncDelta,
	initialSync,
};
