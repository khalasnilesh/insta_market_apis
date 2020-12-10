var passport = require('koa-passport');
var User = require('../app/models/user.server.model');

module.exports = function() {
  const localOptions = { usernameField: 'username' };

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.getSingleUser(id).asCallback(done);
  });

  require('./strategies/local.js')();
  require('./strategies/jwt.js')();
  require('./strategies/anonymous.js')();

  return passport;
};
