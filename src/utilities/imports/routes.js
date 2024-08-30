const fs = require('fs');
const BASE_PATH = "./src/routes";

function getRoutes() {
	const routes = fs.readdirSync(BASE_PATH);
	return routes;
}

module.exports = getRoutes;
