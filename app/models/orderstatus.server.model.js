var knex  = require('../../config/knex');
var debug = require('debug')('orderstatus.server.model');

exports.getOrderStatus = function(orderStatusId) {
  return knex('order_status').select('step_name', 'step_status').where('id', orderStatusId);
};

exports.updateOrderStatusRecord = function(orderStatusId, stepName, stepStatus, apiCall,
  paramString, errorInfo, callInfo) {
    return knex('order_status').update(
      {
        step_name: stepName,
        step_status: stepStatus,
        api_call: apiCall,
        param_string: paramString,
        error_info: errorInfo,
        info: callInfo
      }
    ).where('id', orderStatusId).returning('*');
  };


exports.createOrderStatusRecord = function(orderId, stepName, stepStatus, apiCall,
  paramString, errorInfo, callInfo) {
    return knex('order_status').insert(
      {
        order_sys_order_id: orderId,
        step_name: stepName,
        step_status: stepStatus,
        api_call: apiCall,
        param_string: paramString,
        error_info: errorInfo,
        info: callInfo
      }).returning('*');
  };
