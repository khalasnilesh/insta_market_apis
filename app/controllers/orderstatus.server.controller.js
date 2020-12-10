var ord = require('../../app/models/orderstatus.server.model');
var debug = require('debug')('orderstatus');
var logger = require('winston');


exports.getStatus = function *(next) {
  logger.info('Get Order Status',{fn:'getStatus',order_status_id:this.orderStatusId});
  try{
    this.body = {status:200,message:"get order successfully",data:ord.getOrderStatus(this.orderStatusId)};
  }
  catch(err){
    logger.error('Error while retrieving Order Status',{fn:'getStatus',order_status_id:this.orderStatusId});
    throw err;
  }
  logger.info('Order Status retrieved',{fn:'getStatus',order_status_id:this.orderStatusId});
  yield next();
};

exports.updateOrdStatus = function *(next) {
  logger.info('Updating Order Status',{fn:updateOrdStatus,order_status_id:this.orderStatusId});
  if (!body){
    logger.error('No order details provided', {fn:'updateOrdStatus', user_id: this.passport.user.id, role: this.passport.user.role,
      error: 'Missing order details'});
    return '';
  }
  try{
    var orderStatusId = this.orderStatusId;
    var stepName = this.body.stepName;
    var stepStatus = this.body.stepStatus;
    var apiCall= this.body.apiCall;
    var paramString = this.body.paramString;
    var errorInfo = this.body.errorInfo;
    var callInfo = this.body.callInfo;
    let updateorderstatus = (yield ord.updateOrderStatusRecord(orderStatusId, stepName, stepStatus, apiCall,
      paramString, errorInfo, callInfo))[0];

      logger.info('Order Status Updated',{fn:'updateOrdStatus', order_status_id:this.orderStatusId, step_name:stepName,
      step_status:stepStatus, api_call:apiCall, param_string:paramString, error_info: errorInfo,
      call_info: callInfo});

      this.body = {data:updateorderstatus,message:'Update order status',status:200}

  } catch (err) {
    logger.error('Error updating order status',
      {fn: 'updateOrdStatus',  user_id: this.passport.user.id,
        role: this.passport.user.role, error: err});
        this.body={status:400,message:'Error updating order status'}
    // throw err;
  }

  return;
};

exports.createOrdStatus = function *(next) {
  logger.info('Creating Order Status',{fn:createOrdStatus});
  try{
    var orderId = this.body.orderId;
    var stepName = this.body.stepName;
    var stepStatus = this.body.stepStatus;
    var apiCall= this.body.apiCall;
    var paramString = this.body.paramString;
    var errorInfo = this.body.errorInfo;
    var callInfo = this.body.callInfo;
    logger.info('yield');
    let createorderstatus = (yield ord.createOrderStatusRecord(orderId, stepName, stepStatus, apiCall,
      paramString, errorInfo, callInfo))[0];
    this.body = {data:createorderstatus,message:'created order status',status:200}
    logger.info('Order Status Created',{fn:'updateOrdStatus', order_status_id:this.orderStatusId, step_name:stepName,
      step_status:stepStatus, api_call:apiCall, param_string:paramString, error_info: errorInfo,
      call_info: callInfo});
  }
  catch (err){
    logger.error('Error updating order status',
      {fn: 'updateOrdStatus',  user_id: this.passport.user.id,
        role: this.passport.user.role, error: err});
    // throw err;
    this.body={status:400,message:'Error updating order status'}
  }
  return;
};

exports.getStatusId = function *(id, next) {
  logger.info('Get Order Status ID',{fn:'getStatusId',id:id});
  yield function() {
    logger.info(id);
  }
  this.orderId = id;
  return;
};
