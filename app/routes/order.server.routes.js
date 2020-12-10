//var Router = require('koa-router');
var orders = require('../../app/controllers/order.server.controller');
var ack    = require('../../app/controllers/acknowledgement.server.controller');
var config = require('../../config/config');
var Router = require('koa-router');
var passport = require('passport');

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports=function(app) {
	var router = new Router();
	var apiversion = '/api/'+ config.apiVersion + '/ord';

	router.get(apiversion + '/hotel', orders.getHotelContextOrders);
	router.get(apiversion + '/companies/:companyId/units/:unitId/active_orders', requireJWT, orders.getActiveOrders);
	router.get(apiversion + '/companies/:companyId/units/:unitId/closed_orders', requireJWT, orders.getClosedOrders);
	router.get(apiversion + '/companies/:companyId/units/:unitId/requested_orders', requireJWT, orders.getRequestedOrders);

  router.param('companyId', orders.getCompany);
  router.param('unitId', orders.getUnit);

	router.get(apiversion + '/customers/:customerId/active_orders', requireJWT, orders.getCustomerActiveOrders);
	router.get(apiversion + '/customers/:customerId/closed_orders', requireJWT, orders.getCustomerClosedOrders);
	router.get(apiversion + '/customers/:customerId/requested_orders', requireJWT, orders.getCustomerRequestedOrders);

	router.get(apiversion + '/drivers/users/:userId/active_orders', requireJWT, orders.getDriverActiveOrders);

	router.get(apiversion + '/listusers',  orders.getusers);

	router.post(apiversion + '/group-payment', orders.grouppay)
	router.post(apiversion + '/accept-payment-from-user', orders.acceptPaymentFromUser);
	router.get(apiversion  + '/get-group-payment-status/:orderId', orders.getGroupPaymentStatus);

	router.get(apiversion + '/list-unit-order-items/:unitId',  orders.listUnitOrderItems);

	router.get(apiversion + '/list-unit-order/:unitId',  orders.listUnitOrder);



	router.post(apiversion + '/create-wage/:driverId', orders.createDriverWage);
	router.get(apiversion + '/get-driver-wage/:driverId', orders.getDriverWage);
	router.post(apiversion + '/approve-payment/:driverId', orders.approvePayment);

	router.get(apiversion + '/delete-order/:orderId', orders.deleteOrder);
	

  /* Foodpark Management */

	router.post(apiversion + '/ack', ack.createOrUpdateAck);

	router.param('customerId', orders.getCustomer);

	app.use(router.routes());
  app.use(router.allowedMethods())
};
