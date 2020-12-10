var knex  = require('../../config/knex');
var debug = require('debug')('reviews.model');

exports.getPointBalance = function(customerId, companyId) {
  var custId = parseInt(customerId);
  var coId = parseInt(companyId);
  return knex('loyalty').select('id', 'balance').where({company_id: coId, customer_id: custId});
};

exports.createNew = function(customerId, companyId, initBalance) {
  var custId = parseInt(customerId);
  var coId = parseInt(companyId);
  var initBal = parseInt(initBalance);
  return knex('loyalty').insert({company_id: coId, customer_id: custId, balance: initBal});
};

exports.updateLoyalty = function (customer, company, updatedLoyalty) {
  return knex('loyalty').where({'company_id' : company, 'customer_id' : customer}).update(updatedLoyalty);
};

exports.getTierPackage = function (company, tier) {
  return knex('loyalty_packages').select('*').where({company_id : company, tier : tier}).first();
};

exports.getLoyaltyInfo = function (customer, company) {
  return knex.raw(`select packages.name as "prize_name", packages.items as "prize_items", packages.description as "prize_description", 
                  loyalty.balance, loyalty.company_id, loyalty_packages.tier, loyalty.customer_id from loyalty_packages join loyalty on 
                  loyalty_packages.company_id = loyalty.company_id join packages on packages.id = loyalty_packages.package_id where 
                  loyalty_packages.company_id = ${company} and loyalty.customer_id = ${customer};`)
};

exports.getCompanyLoyaltyInfo = function (company) {
  return knex.raw(`select packages.name as "prize_name", packages.items as "prize_items", packages.description as "prize_description", 
                  loyalty_packages.company_id, loyalty_packages.tier from loyalty_packages join packages 
                  on packages.id = loyalty_packages.package_id where 
                  loyalty_packages.company_id = ${company}`)
};
