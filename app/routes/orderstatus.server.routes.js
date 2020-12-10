var Router = require('koa-router');
var status = require('../../app/controllers/orderstatus.server.controller');

module.exports = function(app) {
  var router = new Router();

  // router.get('/note/:noteId', status.getStatus);
  // router.post('/note/update/:statId', status.updateOrdStatus);
  // router.post('/note/create/:statId', status.createOrdStatus);

  router.get('/stat/:statId', status.getStatus);

  router.post('/stat/update', status.updateOrdStatus);
  router.post('/stat/create', status.createOrdStatus);

  // router.param('noteId', status.getStatusId);
  router.param('statId', status.getStatusId);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
