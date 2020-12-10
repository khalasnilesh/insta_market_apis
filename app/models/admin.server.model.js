var knex = require('../../config/knex');
var debug = require('debug')('admin.model');

/* exports.getAllAdmins = function() {
  knex('admins').select().asCallback(callback);
};*/

exports.getSingleAdmin= function(id) {
  return knex('admins').select().where('id', id);
};

exports.getForUser = function(userId) {
  return knex('admins').select().where('user_id', userId)
};

exports.createAdmin = function(userId) {
  return knex('admins').insert(
    {
      user_id: userId
    }).returning('*');
};
