const express = require('express');
const {
	debug,
	signUp,
	getAllUsers
} = require('../controllers/user.controller');

const getRequestParamsMiddleware = require('../middlewares/getRequestParams.middleware');

const router = express.Router();

/* User Routes */
router.get('/debug', debug);

router.get('/', );

router.get('/getAllUsers', getAllUsers);

router.post('/signUp', getRequestParamsMiddleware, signUp);

/* Error handling */
router.use('/', (req, res, next) => {
	console.log('Route not found: ', req.url);
	res.status(404);
	res.send('404 Not Found');
});

module.exports = router;
