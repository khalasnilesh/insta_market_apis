var knex  = require('../../config/knex');
var debug = require('debug')('countries.server.model');

exports.getSingleCountry= function(id) {
  return knex('countries').select().where('id', id);
};