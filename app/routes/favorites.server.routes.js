//var Router = require('koa-router');
var favorites = require('../../app/controllers/favorites.server.controller');
var config = require('../../config/config');
var Router = require('koa-router');
var passport = require('passport');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports=function(app) {
	var router = new Router();
	var apiversion = '/api/'+ config.apiVersion + '/fav';

	router.get(apiversion + '/companies/:companyId/favorites', favorites.getCompanyFavorites);
	router.get(apiversion + '/companies/:companyId/units/:unitId/favorites', favorites.getCompanyUnitFavorites);
	router.get(apiversion + '/customers/:customerId/favorites', favorites.getCustomerFavorites);

	router.post(apiversion + '/customers/:customerId/favorites', requireJWT, favorites.toggleCustomerFavorite);
	
  router.param('companyId', favorites.getCompany);
  router.param('unitId', favorites.getUnit);
	router.param('customerId', favorites.getCustomer);

	app.use(router.routes());
  app.use(router.allowedMethods())
};
