var knex  = require('../../config/knex');
var debug = require('debug')('driver.model');

exports.getDriversForUnit = function(customerId) {
  return knex('drivers').select().where('unit_id', customerId);
};

exports.getSingleDriver = function(id) {
  return knex('drivers').select().where('id', id);
};

exports.createDriver = function(hash) {
  debug('createDriver');
  debug(hash);
  return knex('drivers').insert(hash).returning('*');
};

exports.updateDriver = function(id, hash) {
  debug('updateDriver');
  debug(hash);
  return knex('drivers').update(hash).where('id',id).returning('*');
};

exports.deleteDriver = function(id) {
  return knex('drivers').where('id', id).del()
};

exports.getDriversByUser = function(id) {
  return knex('drivers').where('user_id',id);
};

exports.createDriverWage = function(hash){
  return knex('driver_wages').insert(hash).returning('*');
}

exports.getDriverWage=function(id){
  return knex('driver_wages').where('driver_id',id).returning('*');
}

exports.getSingleUser = function(id){
  return knex('users').where('id',id).returning('*');
}


exports.getDriverWagebyUnits=function(id, driverId){
  return knex('driver_wages').where({'unit_id':id,'driver_id':driverId}).returning('*');
}

exports.updateStatus=function(id){
  return knex('driver_wages').update({status:'Paid'}).where('id',id).returning('*');
}
