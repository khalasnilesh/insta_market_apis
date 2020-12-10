var Router = require('koa-router');
var config = require('../../config/config');
var passport = require('passport');
var requireJWT = passport.authenticate('jwt', { session: false });
var companies = require('../controllers/company.server.controller');
var units = require('../controllers/units.server.controller');
var Address = require('../controllers/deliveryaddress.server.controller');
module.exports = function (app) {
    var router = new Router();
    var apiPath = '/api/'+ config.apiVersion + '/rel';

    router.put(apiPath + '/companies/:companyId' , companies.updateCompany);
    router.delete(apiPath + '/companies/:companyId' , companies.deleteCompany);
    router.put(apiPath + '/updatecompanies/:companyId' , companies.updateGoogleSheetDetails);
    router.put(apiPath + '/updateCompanyDetails/:companyId', companies.updateCompanyDetails);
    
    router.post(apiPath + '/companies/:companyId/units', units.createUnits);
    router.post(apiPath + '/customers/:customerId/delivery_addresses', Address.createAddress);
    router.get(apiPath + '/customers/:customerId/delivery_addresses', Address.getAddress);

    router.post(apiPath + '/create-manager', units.createManager);
    router.get(apiPath + '/list-units', units.listUnits);

    router.post(apiPath + '/delete-manager', units.deleteManager);
    
    
    app.use(router.routes());
    app.use(router.allowedMethods());
  };
  