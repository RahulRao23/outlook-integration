function setQueryParams(socket, next) {
	socket.parameters = socket.handshake.query;
	next();
}

module.exports = {
	setQueryParams
};