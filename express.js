// blog_app/index.js
const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const router = require('./src/routes/index.routes');
const path = require('path');
const minify = require('express-minify');
const bodyParser = require('body-parser');

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To parse JSON bodies

app.use(minify());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: process.env.SECRET_KEY,
	resave: false,
	saveUninitialized: true
}));

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
