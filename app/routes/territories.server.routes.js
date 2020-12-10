const territory = require('../controllers/territories.server.controller');
var Router = require('koa-router');
var config = require('../../config/config');
var passport = require('passport');
var requireJWT = passport.authenticate('jwt', { session: false });


module.exports = function (app) {
    var router = new Router();
    var apiPath = '/api/'+ config.apiVersion + '/rel/territories';
  
    
    router.post(apiPath,requireJWT, territory.createTerritory);
    router.put(apiPath + '/:territoryId', requireJWT, territory.updateTerritory);
    router.delete(apiPath + '/:territoryId', requireJWT, territory.deleteTerritory);
    
    app.use(router.routes());
    app.use(router.allowedMethods());
  };
  