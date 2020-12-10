/**
 * @author Sávio Muniz
 */
var prepay = require('../controllers/prepay.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports = function (app) {
  var router = new Router();
  var apiPath = '/api/' + config.apiVersion + '/rel/prepay/';

  router.post(apiPath + 'recharge', requireJWT, prepay.recharge);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
