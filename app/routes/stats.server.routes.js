/**
 * @author Sávio Muniz
 */

var stats = require('../../app/controllers/stats.server.controller');
var config = require('../../config/config');
var passport = require('passport');
var Router = require('koa-router');

const STATS_ENDPOINT = '/api/'+ config.apiVersion + '/stats/';

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports=function(app) {
  var router = new Router();

  // UNIT
  router.get(STATS_ENDPOINT + 'company/:companyId/unit/sum', stats.getUnitSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/unit/sum', stats.getUnitSumStats);
  router.get(STATS_ENDPOINT + 'support/unit/sum', stats.getUnitSumStats);

  router.get(STATS_ENDPOINT + 'company/:companyId/unit/percentage', stats.getUnitPercentageStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/unit/percentage', stats.getUnitPercentageStats);
  router.get(STATS_ENDPOINT + 'support/unit/percentage', stats.getUnitPercentageStats);

  //ITEM
  router.get(STATS_ENDPOINT + 'company/:companyId/item/sum', stats.getItemSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/item/sum', stats.getItemSumStats);
  router.get(STATS_ENDPOINT + 'support/item/sum', stats.getItemSumStats);

  router.get(STATS_ENDPOINT + 'company/:companyId/item/percentage', stats.getItemPercentageStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/item/percentage', stats.getItemPercentageStats);
  router.get(STATS_ENDPOINT + 'support/item/percentage', stats.getItemPercentageStats);

  //CUSTOMER
  router.get(STATS_ENDPOINT + 'company/:companyId/customer/sum', stats.getCustomerSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/customer/sum', stats.getCustomerSumStats);
  router.get(STATS_ENDPOINT + 'support/customer/sum', stats.getCustomerSumStats);

  router.get(STATS_ENDPOINT + 'company/:companyId/customer/percentage', stats.getCustomerPercentageStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/customer/percentage', stats.getCustomerPercentageStats);
  router.get(STATS_ENDPOINT + 'support/customer/percentage', stats.getCustomerPercentageStats);

  //BILLING
  router.get(STATS_ENDPOINT + 'company/:companyId/billing/sum', stats.getBillingSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/billing/sum', stats.getBillingSumStats);
  router.get(STATS_ENDPOINT + 'support/billing/sum', stats.getBillingSumStats);

  router.get(STATS_ENDPOINT + 'company/:companyId/billing/percentage', stats.getBillingPercentageStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/billing/percentage', stats.getBillingPercentageStats);
  router.get(STATS_ENDPOINT + 'support/billing/percentage', stats.getBillingPercentageStats);

  //COMMISSIONS
  router.get(STATS_ENDPOINT + 'company/:companyId/commission/detailed', stats.getCommissionDetailedStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/commission/detailed', stats.getCommissionDetailedStats);
  router.get(STATS_ENDPOINT + 'support/commission/detailed', stats.getCommissionDetailedStats);

  router.get(STATS_ENDPOINT + 'company/:companyId/commission/sum', stats.getCommissionSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/commission/sum', stats.getCommissionSumStats);
  router.get(STATS_ENDPOINT + 'support/commission/sum', stats.getCommissionSumStats);


  //TOTAL
  router.get(STATS_ENDPOINT + 'company/:companyId/total/sum', stats.getTotalSumStats);
  router.get(STATS_ENDPOINT + 'foodpark/:foodParkId/total/sum', stats.getTotalSumStats);
  router.get(STATS_ENDPOINT + 'support/total/sum', stats.getTotalSumStats);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
