/**
 * @author Sávio Muniz
 */
var users = require('../controllers/users.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

module.exports = function (app) {
  var router = new Router();
  var apiPath = '/api/'+ config.apiVersion + '/rel/users/';
  var apinew = '/api/' + config.apiVersion + '/users';
  var apinewbot = '/api/' + config.apiVersion + '/bot';


  router.get(apiPath + 'custom_id/', users.getUsersByCustomId);
  router.get(apiPath + ':userId', users.getUser);
  router.put(apiPath + ':userId', users.modifyUser);

  router.get(apinew + '/check-profile/:userId', users.checkProfile);
  router.post(apinew + '/update-profile/:userId', users.updateProfile);


  router.post(apinew + '/create-group', users.createGroup);
  router.get(apinew + '/get-group/:initiator_id', users.getGroup);
  router.post(apinew + '/update-group/:id', users.updateGroup);
  router.post(apinew + '/delete-group', users.deleteGroup);


  router.post(apinewbot + '/telegram-support-group/:companyId', users.createSupportGroup);
  router.post(apinewbot + '/telegram-group', users.createTelegramGroup);
  router.post(apinewbot + '/telegram-invite', users.createTelegramInvite);
  router.post(apinewbot + '/telegram-add-members', users.addMemberTelegram);

  

  app.use(router.routes());
  app.use(router.allowedMethods());
};
