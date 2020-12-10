
var passport = require('passport');
var config = require('../config');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('../../app/models/user.server.model');

module.exports = function() {
  const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeader(),
      secretOrKey: config.secret,
    };

  const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
    // console.log('hellooooooooooooooooooooooooooooooooooooooooooooooooo',payload)
    User.getSingleUser(payload.id).asCallback(function(err, users) {
      if (err) {
        return done(err, false);
      }

      var user = users[0];
      
      if(payload.company_id){
        user.company_id = payload.company_id;
      }

      if (user) {
        done(null, user);
      } else {
        done(null, {});
      }
    });
  });

  passport.use(jwtLogin);
};

