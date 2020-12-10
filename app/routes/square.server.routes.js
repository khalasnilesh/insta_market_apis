/**
 * @author Sávio Muniz
 */

var square = require('../controllers/square.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

var requireLogin = passport.authenticate('local', { session: false });

module.exports = function(app) {
    var router = new Router();
    var apiversion = '/api/'+ config.apiVersion + '/square';

    router.post(apiversion + '/:userId/token', square.setupToken);
    router.get(apiversion + '/:userId/token', square.getToken);
    router.put(apiversion + '/:userId/token', square.renewToken);

    router.get(apiversion + '/:userId/locations', square.getSquareLocations);
    router.post(apiversion + '/locations/:unitId', square.registerLocation);

    router.param('userId', square.setUser);
    router.param('unitId', square.setUnit);

    app.use(router.routes());
    app.use(router.allowedMethods());
};
