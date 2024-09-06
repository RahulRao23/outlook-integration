const jwt = require('jsonwebtoken');
const verifyOAuth2Strategy = async (accessToken, refreshToken, params, profile, done) => {
	try {
		const idToken = params.id_token;
		const decoded = jwt.decode(idToken);
		const user = {
			outlook_id: decoded.sub,
			display_name: decoded.name,
			email: decoded.preferred_username,
			outlook_access_token: accessToken,
			outlook_refresh_token: refreshToken,
			access_token_expires: Date.now() + params.expires_in * 1000,
		};
		console.log({authentication_user_id: user.outlook_id});
		
		return done(null, user);
	} catch (error) {
		console.error('Error decoding token:', error);
		return done(error);
	}
}

module.exports = {
	verifyOAuth2Strategy,
}