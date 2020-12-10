/**
 * @author Sávio Muniz
 */

var knex = require('../../config/knex');
var debug = require('debug')('commissions.model');

const COMMISSION_TABLE = "commissions";

exports.getCommission = function (name) {
  return knex(COMMISSION_TABLE).select().where('name', name).first();
};

exports.getAllCommissions = function () {
  return knex(COMMISSION_TABLE).select();
};
