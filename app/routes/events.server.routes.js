/**
 * @author Sávio Muniz
 */

var events = require('../controllers/events.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');
var config = require('../../config/config');

module.exports = function (app) {
    var router = new Router();
    var apiPath = '/api/' + config.apiVersion + '/rel/events/';

    router.post(apiPath, events.createEvent);
    router.get(apiPath + ':eventId/manager', events.getManager);
    router.post(apiPath + ':eventId/guests', events.addGuest);
    router.get(apiPath + ':eventId/guests', events.getGuests);
    router.get(apiPath + 'mapSearch', events.getNearby);

    app.use(router.routes());
    app.use(router.allowedMethods());
};
