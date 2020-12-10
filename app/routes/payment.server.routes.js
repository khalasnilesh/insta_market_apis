//var Router = require('koa-router');
var payment = require('../../app/controllers/payment.server.controller');
var push = require('../../app/controllers/push.server.controller');
var config = require('../../config/config');


var Router = require('koa-router');


module.exports=function(app) {
	var router = new Router();
  var paymentApiversion = '/api/'+ config.apiVersion + '/payment';
  /*
	router.post('/oauth/payment/token', payment.createCheckout);
	router.get('/oauth/push/sendPush', push.sendPush);
  */ 

  router.post('/payment/get-access-token', payment.getAccessToken);
  router.post('/payment/make-payment', payment.makePayment);
  router.post('/payment/make-refund', payment.refundAmount);

  router.get(paymentApiversion + '/green-money-generate-widget/:orderId', payment.GenerateWidget);
  router.post(paymentApiversion + '/green-money-generate-check/:orderId', payment.GenerateCheck);
  router.get(paymentApiversion + '/get-payment-status/:orderId', payment.getPaymentStatus);


  

  router.post(paymentApiversion + '/get-payment-sumup/:orderId', payment.getPaymentForSumup);
  // router.post(paymentApiversion + '/create-sumup-checkout', payment.sumupCheckout);
  // router.post(paymentApiversion + '/complete-sumup-checkout/:checkoutId', payment.updateSumupCheckout);

    
  router.post(paymentApiversion + '/eCheque-create-customer/:orderId', payment.echequeCreateCustomer);
  router.post(paymentApiversion + '/eCheque-delete-customer/:orderId', payment.echequeDeleteCustomer);
  router.post(paymentApiversion + '/eCheque-cancel-cheque/:orderId', payment.echequeCancelCheque);

  router.get(paymentApiversion + '/get-payor/:userId', payment.getPayorId);
  
  
	app.use(router.routes());
  app.use(router.allowedMethods())
};
