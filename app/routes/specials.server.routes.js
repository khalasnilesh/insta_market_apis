//var Router = require('koa-router');
var specials = require('../../app/controllers/specials.server.controller');
var config = require('../../config/config');
var Router = require('koa-router');
var passport = require('passport');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports=function(app) {
	var router = new Router();
	var apiversion = '/api/'+ config.apiVersion + '/dly';

	router.post(apiversion + '/specials', specials.getSpecials);

	app.use(router.routes());
    app.use(router.allowedMethods());

};
