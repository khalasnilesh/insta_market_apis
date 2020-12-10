var knex  = require('../../config/knex');
var debug = require('debug')('loyaltyrewards.model');

exports.isCompanyFound = function(companyId) {
  return knex('loyalty_rewards').select('id').where('company_id', parseInt(companyId));
}
