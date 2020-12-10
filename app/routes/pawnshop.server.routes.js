/**
 * @author Sávio Muniz
**/
var pawnshop = require('../controllers/pawnshop.server.controller');
var request = require('../controllers/request.server.controller');
var offer = require('../controllers/offer.server.controller');
var orderhistory = require('../controllers/orderhistory.server.controller')
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports = function (app) {
  var router = new Router();
  var apiPath = '/api/'+ config.apiVersion + '/rel/';

  // Customer Offers
  router.get(apiPath + 'customers/:customer_id/requests/:request_id', request.getRequestsById);
  router.get(apiPath + 'customers/:customer_id/requests', request.getAllRequestsByCustomerId);
  router.post(apiPath + 'customers/:customer_id/requests', request.createRequest);
  router.delete(apiPath + 'customers/:customer_id/requests/:request_id', request.deleteRequest);
  router.put(apiPath + 'customers/:customer_id/requests/:request_id', requireJWT, request.updateRequest);
    
  // Pawn Shop Offers
  router.get(apiPath + 'companies/:company_id/offers', offer.getOffersByCompany);
  router.get(apiPath + 'companies/:company_id/requests', offer.getOffersEmptyRequestsByCompany);
  router.get(apiPath + 'companies/:company_id/units/:unit_id/requests', offer.getOffersEmptyRequestsByCompanyUnit);
  router.post(apiPath + 'companies/:company_id/units/:unit_id/offers', offer.createOffer);
  router.put(apiPath + 'companies/:company_id/offers/:offer_id', requireJWT, offer.updateOffer);
  router.put(apiPath + 'companies/:company_id/units/:unit_id/offers/:offer_id', requireJWT, offer.updateOffer);
  router.delete(apiPath + 'companies/:company_id/units/:unit_id/offers/:offer_id', offer.deleteOffer);
  router.get(apiPath + 'companies/:company_id/units/:unit_id/offers', offer.getOffersByUnit);

  router.put(apiPath + 'companies/:company_id/units/:unit_id/order_history/:order_history_id', requireJWT, orderhistory.updateOrderHistory);

  // Pawn Shop and Customer Contracts
  router.get(apiPath + 'companies/:company_id/contracts', request.getRequestsContractApprovedByCompany);
  router.get(apiPath + 'customers/:customer_id/contracts', request.getRequestsContractApprovedByCustomer);
  router.get(apiPath + 'requests', pawnshop.getAllRequests);


  router.get(apiPath + 'contracts/:contract_id', pawnshop.getContractsById);
  router.delete(apiPath + 'contracts/:contract_id', pawnshop.deleteContract);
  router.post(apiPath + 'contracts', pawnshop.createContract);
  router.get(apiPath + 'contracts/qrcode/:qr_code', pawnshop.getContractsByQrCode);

  // Map Search Pawn Shops
  router.get(apiPath + 'count/*', pawnshop.getCountByContext);
  router.get(apiPath + 'mapsearch/pawnshops', pawnshop.getPawnshopsByCoordinates);

  app.use(router.routes());	
  app.use(router.allowedMethods());
};