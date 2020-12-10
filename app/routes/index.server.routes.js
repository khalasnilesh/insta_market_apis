var Router = require('koa-router');
var passport = require('passport');
var _ = require('lodash');
const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = function(app) {
  var router = new Router();

  router.get('/api/whoami', passport.authenticate(['jwt','anonymous'], { session: false }), function *(next) {

  
    if(this.passport && this.passport.user) {
    var u = _.clone(this.passport.user);
    delete u.password;
      this.body = u;
    } else {
      this.body = { id: null, username: 'anonymous' };
    }
  });
  
  console.log('Mounting WHOAMI!');

  app.use(router.routes());
  app.use(router.allowedMethods());

  //	var index = require('../controllers/index.server.controller');
  //	app.get('/', index.render);

};
