var category = require('../controllers/categories.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports = function (app) {
  var router = new Router();
  var apiPath = '/api/'+ config.apiVersion + '/rel/';

  router.post(apiPath + 'category', category.addCategory);
  router.get(apiPath + 'category', category.getCategory);


//   router.get(apiPath + 'get-unit-checkin/:unitId', checkin.getcheckins);
//   router.get(apiPath + 'google/auth', checkin.getauthenticatedbygoogle);
//   router.get(apiPath + 'google/callback', checkin.getcallbackfromgoogle);
//   router.get(apiPath + 'google/createfolder', checkin.getcallbackfromgoogle);


  app.use(router.routes());	
  app.use(router.allowedMethods());
};