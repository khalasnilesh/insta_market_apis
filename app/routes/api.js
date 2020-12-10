 var passport = require('passport');
var api = require('koa')();
var config = require('../../config/config');
var geo = require('../../app/controllers/geo.server.controller');
var Resteasy = require('../../koa-resteasy')(require('../../config/knex'));
var RestOptions = require('../rest_options');
var Router = require('koa-router');
var geoservices = new Router();

geoservices.get('/mapsearch', geo.searchUnits);

api.use(passport.authenticate(['jwt','anonymous'], {session:false}));
api.use(function *(next) {
  console.log("loggedin: ",this.passport.user);
  yield next;
});
api.use(geoservices.routes());
api.use(Resteasy(RestOptions));

module.exports = api;
