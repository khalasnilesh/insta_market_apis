//var Router = require('koa-router');
var push = require('../../app/controllers/push.server.controller');

var Router = require('koa-router');


module.exports=function(app) {
	var router = new Router();

	/*router.post('/push/eventTrack', push.eventTrack);
	router.post('/push/setDeviceToken', push.setDeviceToken);
	router.post('/push/orderAcceptDeclice', push.orderAcceptDeclice);
	*/
	//router.get('/oauth/push/sendPush', push.sendPush);

	router.post('/push/setDeviceToken', push.testnotifyUpdated);

	app.use(router.routes());
  	app.use(router.allowedMethods())
};
