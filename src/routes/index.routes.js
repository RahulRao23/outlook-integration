const express = require('express');
const {
	createAccount,
	homePage,
	linkAccountPage,
} = require('../controllers/index.controller');

const getRequestParamsMiddleware = require('../middlewares/getRequestParams.middleware');

const router = express.Router();

router.get('/', homePage);

router.get('/link-options', linkAccountPage);

router.post('/create-account', getRequestParamsMiddleware, createAccount);

/* Error handling */
router.use('/', (req, res, next) => {
	console.log('Route not found: ', req.url);
	res.status(404);
	res.send('404 Not Found');
});

module.exports = router;
