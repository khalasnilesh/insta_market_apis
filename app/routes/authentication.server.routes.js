var auth = require('../../app/controllers/authentication.server.controller');
var passport = require('koa-passport');
var Router = require('koa-router');

var requireAuth = passport.authenticate('jwt', { session: false });
var requireLogin = passport.authenticate('local', { session: false });


module.exports = function(app) {
  var router = new Router();

  router.get('/auth/register', auth.renderRegister);
  router.post('/auth/register', auth.register);
  router.get( '/auth/createNewSheet', auth.createNewSheet);
  

  router.get('/auth/login', auth.renderLogin);
  router.post('/auth/login', requireLogin, auth.login);

  router.get('/auth/logout', auth.logout);

  // fbRegister breaks deployment
  router.post('/auth/fbLogin', auth.fbLogin);
  router.post('/auth/fbRegister', auth.fbRegister);
  router.get('/auth/fb', auth.fbAuth);
  // router.get('/auth/fbDone', auth.fbDone);

  router.get('/oauth/facebook', passport.authenticate('facebook', {
      failureRedirect: '/login',
      scope:['email'],
    }));

  router.get('/oauth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login',
    successRedirect: '/',
    scope:['email'],
  }));

  router.get('/auth/google', auth.googleAuth);
  router.post('/auth/googleLogin', auth.googleLogin);

  router.get('/oauth/google', passport.authenticate('google', {
    failureRedirect: '/login',
    scope:['email'],
  }));

  router.get('/oauth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/',
    scope:['email'],
    // session: false
  }));

  app.use(router.routes())
  app.use(router.allowedMethods())
};
