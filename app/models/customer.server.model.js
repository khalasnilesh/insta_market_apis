var knex  = require('../../config/knex');
var debug = require('debug')('customer.model');
var logger = require('winston');

exports.getAllCustomers = function() {
  return knex('customers').select()
};

exports.getSingleCustomer = function(id) {
  return knex('customers').select().where('id', id)
};

exports.getForUser = function(userId) {
  return knex('customers').select().where('user_id', userId)
};

exports.verifyUser = function(customerId, userId) {
  return knex('customers').select().where({
    id: customerId,
    user_id: userId
  })
};

exports.getUser = function (customerId) {
  return knex.raw(`select users.* from users left outer join customers on customers.user_id = users.id where customers.id=${customerId}`);
};

exports.getCustomerIdForUser = function(userId) {
  logger.info('getting customer for id: ' + userId);
  return knex('customers').select('id').where('user_id', userId).returning('*');
}

exports.createCustomer = function(userId) {
  return knex('customers').insert(
    {
      user_id: userId
    }).returning('*')
};

exports.modifyCustomer = function(userId,phone,room,city){
  return knex('customers').update({phone,room_number : room.room_number, billing_responsible : room.billing_responsible,city})
  .where('user_id',userId).returning('*');
}