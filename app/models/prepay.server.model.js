/**
 * @author Sávio Muniz
 */

var knex = require('../../config/knex');

const RECHARGES_TABLE = "prepay_recharges";
const PREPAY_HISTORY_TABLE = "prepay_history";

exports.createRecharge = function (rechargeObj) {
  return knex(RECHARGES_TABLE).insert(rechargeObj).returning('*');
};

exports.registerTransaction = function (transaction) {
  return knex(PREPAY_HISTORY_TABLE).insert(transaction).returning('*');
};

exports.getPrepayRecharges = function (perspective, id, start, end) {
  if (perspective === 'foodpark') {
    return knex.raw(`select prepay_history.*, prepay_recharges.amount, prepay_recharges.user_id, prepay_recharges.unit_id, units.company_id, customers.id as "customer_id" 
                    from prepay_history join prepay_recharges on prepay_recharges.id = prepay_history.transaction_id join 
                    food_park_management on food_park_management.unit_id = prepay_recharges.unit_id and food_park_management.food_park_id = ${id} join 
                    units on units.id = prepay_recharges.unit_id join customers on customers.user_id = prepay_recharges.user_id where prepay_history.type = 'recharge'
                    and date between to_timestamp(${start}) and to_timestamp(${end});`)
  } else if (perspective === 'vendor') {
    return knex.raw(`select prepay_history.*, prepay_recharges.amount, prepay_recharges.user_id, prepay_recharges.unit_id, units.company_id, customers.id as "customer_id"  
                    from prepay_history join prepay_recharges on prepay_recharges.id = prepay_history.transaction_id join 
                    units on units.id = prepay_recharges.unit_id and units.company_id = ${id} join customers on customers.user_id = prepay_recharges.user_id  
                    where prepay_history.type = 'recharge' and date between to_timestamp(${start}) and to_timestamp(${end});`)
  } else {
    return knex.raw(`select prepay_history.*, prepay_recharges.amount, prepay_recharges.user_id, prepay_recharges.unit_id, units.company_id, customers.id as "customer_id" 
                    from prepay_history join prepay_recharges on prepay_recharges.id = prepay_history.transaction_id join 
                    units on units.id = prepay_recharges.unit_id join customers on customers.user_id = prepay_recharges.user_id where prepay_history.type='recharge' and
                    date between to_timestamp(${start}) and to_timestamp(${end});`)
  }
};
