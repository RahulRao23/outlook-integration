
const getRequestParamsMiddleware = (req, res, next) => {
	console.log(req.body, req.query);
	
	res.locals.reqParams = Object.keys(req.body).length ? req.body : req.query;
	next();
}

module.exports = getRequestParamsMiddleware;