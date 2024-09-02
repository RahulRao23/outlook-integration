const express = require('express');
const passport = require('passport');
const {
	homePage,
	dataPage,
	createAccount,
	logout,
} = require('../controllers/index.controller');

const getRequestParamsMiddleware = require('../middlewares/getRequestParams.middleware');

const router = express.Router();

router.get('/', homePage);

router.post('/create-account', getRequestParamsMiddleware, createAccount);

router.get('/auth/microsoft', passport.authenticate('oauth2'));

router.get('/auth/microsoft/callback', passport.authenticate('oauth2', { failureRedirect: '/' }), dataPage);

router.get('/dashboard', (req, res) => {
	if (!req.isAuthenticated()) {
			return res.redirect('/');
	}
	res.send(`Hello, ${req.user.displayName}! Your email is ${req.user.email}. ${req.user}`);
});

router.get('/logout', logout);

/* Error handling */
router.use('/', (req, res, next) => {
	console.log('Route not found: ', req.url);
	res.status(404);
	res.send('404 Not Found');
});

module.exports = router;
