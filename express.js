// blog_app/index.js
const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const router = require('./src/routes/index.routes');
const path = require('path');
const minify = require('express-minify');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { dbConnect } = require('./config/dbConnect');
const { setQueryParams } = require('./src/sockets/middlewares');

const PORT = 3000;

const socketHandler = require('./src/sockets/index');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* Establish DB connection */
dbConnect();

app.enable('trust proxy');
app.set('io', io);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To parse JSON bodies

app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: process.env.SECRET_KEY,
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// OAuth2 strategy configuration
passport.use(new OAuth2Strategy({
	authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: process.env.REDIRECT_URI,
	scope: ['openid', 'profile', 'email', 'Mail.ReadWrite', 'Mail.Read', 'offline_access'],
	state: true
},
async (accessToken, refreshToken, params, profile, done) => {
	try {
		const idToken = params.id_token;
		const decoded = jwt.decode(idToken);
		
		const user = {
			id: decoded.sub,
			displayName: decoded.name,
			email: decoded.preferred_username,
			accessToken,
			refreshToken
		};
		
		return done(null, user);
	} catch (error) {
		console.error('Error decoding token:', error);
		return done(error);
	}
}
));

// Serialize user info into session
passport.serializeUser((user, done) => {
	done(null, user);
});

// Deserialize user info from session
passport.deserializeUser((user, done) => {
	done(null, user);
});

app.use('/', router);

/* Socket Middlerware */
io.use(setQueryParams);

io.on('connection', socket => {
	console.log('Socket connected: ', socket.id);

	socket.on('debug', () => {
		io.emit('debug', 'socket successful');
	});

	socketHandler(io, socket);
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
