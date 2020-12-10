/**
 * @author Sávio Muniz
 */

var packages = require('../controllers/packages.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports = function (app) {
  var router = new Router();
  var apiPath = '/api/' + config.apiVersion + '/rel/packages/';
  var apiCompanyPath = '/api/' + config.apiVersion + '/rel/companies/';
  var apiUserPackages = '/api/' + config.apiVersion + '/rel/users/:userId/packages/';
  var apiPackageGiven = '/api/' + config.apiVersion + '/rel/users/:userId/packages/:packageId';

  router.post(apiPath, requireJWT, packages.createPackage);
  router.get(apiPath + ':packageId', requireJWT, packages.getPackage);
  router.get(apiCompanyPath + ':companyId/packages' , requireJWT, packages.getCompanyPackages);
  router.put(apiPath + ':packageId', requireJWT, packages.updatePackage);

  router.post(apiPackageGiven, requireJWT, packages.givePackage);
  router.get(apiUserPackages, requireJWT, packages.getUserGiftedPackages);
  router.get(apiCompanyPath + ':companyId/packages/gifted', requireJWT, packages.getCompanyGiftedPackages);
  router.delete(apiPackageGiven, requireJWT, packages.deletePackageGiven);

  router.get(apiPath + ':qrcode/redeem', requireJWT, packages.redeemPackage);
  router.get(apiPackageGiven + '/redeem', requireJWT, packages.redeemPackage);
  router.post(apiPath + 'redeem/multiple', requireJWT, packages.redeemMultiplePackages);
  router.post(apiUserPackages + 'redeem/code', requireJWT, packages.registerManualRedeem);


  router.post(apiPath + 'redeem/manual', requireJWT, packages.manualRedeemPackage);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
