var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require ('../../app/models/user.server.model');
var debug = require('debug')('strategies.local');

module.exports = function() {
    const localLogin = new LocalStrategy(function(username, password, done) {
        debug('logging in user '+ username)
        User.getUserByUsername(username, function(err, results) {
          if (err) {
            console.error('error during login: '+ err);
            return done(err);
          }
          var user = results[0];
          debug(user);
          if (!user) {
            console.error('error during login: could not find user')
            // return done(null, false, {message: 'We could not verify your login details. Really sorry. Please try again.'});
            return done(null, {message: 'We could not verify your login details. Really sorry. Please try again.'});
          }
          else if (user.is_deleted){
            console.error('error during login: user has been deleted')
            // return done(null, false, {message: 'We could not verify your login details. Really sorry. Please try again.'});
            return done(null, {message: 'We could not verify your login details. Really sorry. Please try again.'});
          }
          if (!User.authenticate(user.password, password)) {
            console.error('error during login: authentication failed')
            // return done(null, false, {message: 'Invalid password'});
            return done(null, {message: 'Invalid password'});
          }
          this.user = user
          return done(null, user);
        });
    });
    passport.use(localLogin);
};
