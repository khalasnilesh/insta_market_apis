var sts = require('./security.server.controller'),
    jwt = require('jsonwebtoken'),
    config = require('../../config/config');


exports.generateToken = function(user) {
  return jwt.sign(user, config.secret);
};

/* exports.generateToken = function(user) {
  return jwt.sign(user, config.secret, {
    expiresIn: 10080 // seconds
  });
};
*/