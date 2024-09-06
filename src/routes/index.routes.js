const express = require('express');
const passport = require('passport');
const {
	homePage,
	dataPage,
	authMicrosoft,
	authMicrosoftCallback,
	createAccount,
	logout,
	getOutlookFolders,
	getOutlookMails,
	outlookSyncDelta,
	initialSync,
} = require('../controllers/index.controller');

const getRequestParamsMiddleware = require('../middlewares/getRequestParams.middleware');

const router = express.Router();

router.get('/', homePage);

router.post('/create-account', getRequestParamsMiddleware, createAccount);

router.get('/auth/microsoft-authorize/:userId', authMicrosoft);

router.get('/auth/microsoft/callback', authMicrosoftCallback);

router.get('/dashboard', dataPage);

router.get('/session', (req, res) => { res.send(req.session) });

router.get('/outlook-folders', getOutlookFolders);

router.get('/outlook-emails', getOutlookMails);

router.get('/outlook-sync', outlookSyncDelta);

router.get('/outlook-initial-sync', initialSync);

router.get('/logout', logout);


/* Error handling */
router.use('/', (req, res, next) => {
	console.log('Route not found: ', req.url);
	res.status(404);
	res.send('404 Not Found');
});

module.exports = router;
