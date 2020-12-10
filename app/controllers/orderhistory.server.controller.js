var config  = require('../../config/config');
var User = require('../models/user.server.model');
var orderhistory  = require('../models/orderhistory.server.model');
var debug   = require('debug')('orders');
var logger = require('winston');


exports.updateOrderHistory = function * (next) {
  console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk')
  logger.info('Getting Active Orders', {fn:'updateOrderHistory'});
  if (!this.params.company_id || !this.params.unit_id || !this.params.order_history_id) {
    logger.error('Order history/company/unit id missing',{fn:'updateOrderHistory'});
    throw new Error('Order history/company/unit id missing', 422);
  }

  logger.info('Checking Authorization');
  var user = this.passport.user;
  var orders = {};
  
  if (user.role == 'OWNER' || user.role == 'UNITMGR' || user.role == 'ADMIN' || user.role == 'CUSTOMER' || user.role == 'FOODPARKMGR') {
    debug('..authorized');

    var request = this.body;

    if (request.status) {
     
      if (typeof request.status === 'string') {
        status_list = yield orderhistory.getStatus(this.params.order_history_id);
        console.log('status_liststatus_liststatus_liststatus_liststatus_list',status_list)

        status_list[0].status[request.status] = new Date();
        // order_accepted and order_paid must be included at the same time everytime.
        if (request.status == 'order_accepted') {
          status_list[0].status['order_paid'] = new Date();
        } else if (request.status == 'order_paid') {
          status_list[0].status['order_accepted'] = new Date();
        }

        request.status = status_list[0].status;
      }
    }

    try {
      orders = yield orderhistory.updateOrder(this.params.order_history_id, request);
    } catch (err) {
      logger.error('Error updating Order History',{fn:'updateOrderHistory'});
      throw err;
    }

    this.status = 200
    this.body = {status:200,message : "Update order successfully",data:orders[0]};
    return;
  } else {
    logger.error('User not authorized',{fn:'updateOrderHistory',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status = 401
    this.body = {status:401,message: 'User not authorized'}
    return;
  }
}
