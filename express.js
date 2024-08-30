// blog_app/index.js
const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const ROUTES = require('./src/utilities/imports/routes')();
const path = require('path');
const minify = require('express-minify');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: process.env.SECRET_KEY,
	resave: false,
	saveUninitialized: true
}));

/* Get all routes */
for (let index = 0; index < ROUTES.length; index++) {
	const ROUTE = require("./src/routes/" + ROUTES[index]);
	const SUB_ROUTE = "/" + ROUTES[index].split(".")[0];
	app.use(SUB_ROUTE, ROUTE);
}
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
