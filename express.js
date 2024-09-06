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
require('dotenv').config();

const { verifyOAuth2Strategy } = require('./src/utilities/oauth/authentication');
const { setQueryParams } = require('./src/sockets/middlewares');

const PORT = 3000;

const socketHandler = require('./src/sockets/index');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
passport.use(
	new OAuth2Strategy(
		{
			authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
			tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: process.env.REDIRECT_URI,
			scope: ['openid', 'profile', 'email', 'Mail.ReadWrite', 'Mail.Read', 'Mail.ReadBasic', 'offline_access'],
			state: true
		},
		verifyOAuth2Strategy
	)
);

// Serialize user info into session
passport.serializeUser((user, done) => {
	done(null, user);
});

// Deserialize user info from session
passport.deserializeUser((user, done) => {
	done(null, user);
});

app.use('/', router);

/* Socket.IO Middleware */
io.use((socket, next) => {
	// Attach session middleware to the Socket.IO handshake
	session({
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: true
	})(socket.request, socket.request.res || {}, next);
});

io.on('connection', socket => {
	console.log('Socket connected: ', socket.id);

	// Access session data
	const session = socket.request.session;
	console.log('Session data:', session);

	socket.on('debug', () => {
		io.emit('debug', 'socket successful');
	});

	socketHandler(io, socket);
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
