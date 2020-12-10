var passport = require('passport');
var config = require('../config');
var AnonymousStrategy = require('passport-anonymous').Strategy;

module.exports = function() {
  passport.use(new AnonymousStrategy());
};

