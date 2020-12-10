var knex  = require('../../config/knex');
var debug = require('debug')('favorites.model');

var createFavorite = function(companyId, customerId, unitId) {
  return knex('favorites').insert(
    {
      company_id: companyId,
      customer_id: customerId,
      unit_id: unitId
    }).returning('*')
};

var deleteFavorite = function(companyId, customerId, unitId) {
  return knex('favorites').whereRaw('company_id = ? and customer_id = ? and unit_id = ?',
  [companyId, customerId, unitId]).del();
};

exports.toggleFavorite = function *(companyId, customerId, unitId) {
  var exist = (yield doesExist(companyId, customerId, unitId))[0];
  console.log(exist);
  if (exist.count >0 ) {
    return deleteFavorite(companyId,customerId,unitId);
  } else {
    return createFavorite(companyId,customerId,unitId);
  }
}

exports.getForCustomer = function(id) {
  return knex('favorites').select().where('customer_id',id);
};

exports.getForCompany = function(id) {
  return knex('favorites').select().where('company_id', id);
};

exports.getForCompanyUnit = function(companyId, unitId) {
  return knex('favorites').select().where('company_id',companyId).andWhere('unit_id', id);
};

function doesExist (companyId, customerId, unitId) {
  return knex('favorites').count('*').whereRaw('company_id = ? and customer_id = ? and unit_id = ?',
  [companyId, customerId, unitId]);
};

