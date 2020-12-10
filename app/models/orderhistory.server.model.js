var knex  = require('../../config/knex');
var debug = require('debug')('orders.model');

exports.getUnitsbyFoodParkId=function(id){
  return knex('units').where('food_park_id',id).returning('*');
}

exports.creategrouppayment = function(data){
  return knex('group_payment').insert(data).returning('*');
};

exports.getgrouppayment = function(id){
  return knex('group_payment').select('*').where('order_id', id);
};

exports.updategrouppayment = function (order_id, user_id, amount) {
  return knex('group_payment').update({ 'payment_status': 'paid', 'amount_paid': amount }).where({ 'order_id': order_id, 'user_id': user_id }).returning('*');
};

exports.customQuery = function (query) {
  return knex('order_history').select('*').whereRaw(query);
};

exports.getSingle = function (id) {
  return knex('order_history').select('*').where('id', id).first();
};

exports.getStatus = function(id) {
  return knex('order_history').select('status').where('id', id);
};

exports.getCompanyOrder = function(id) {
  return knex('order_history').select('*').where('company_id', id);
};

exports.getCustomerOrder = function(id) {
  return knex('order_history').select('*').where('customer_id', id);
};

exports.getOrder = function(id) {
  return knex.raw(`select * from order_history where order_detail->>'id'='${id}';`)
};

exports.deleteOrder = function(id){
  return knex('order_history').where('id',id).del();
}

exports.updateOnDeliver = function(id){
  return knex.raw(`UPDATE order_history SET driver_id = NULL where order_detail->>'id'='${id}';`);
}

exports.getUnitOrder = function(id) {
  return knex('order_history').select('*').where('unit_id', id);
};

exports.getHistoryDriverOrder = function(id) {
  return knex('order_history').select('*').where('driver_id', id);
};

exports.deleteOrderFromDriverTask = function(id){
  return knex('driver_task').where('id',id).del();
}

exports.updatePriority = function(id, priority){
  return knex('driver_task').update({priority}).where('id',id).returning('*');
}

exports.getDriverOrder = function(id) {
  return knex('driver_task').select('*').where('driver_id', id);
};

exports.createDriverOrder = function(data) {
  return knex('driver_task').insert(data).returning('*');
};

exports.updateDriverOrder = function (driver_id, order_id, { priority }) {
  return knex('driver_task').update({ priority }).where({ order_id, driver_id }).returning('*');
};

exports.updateDriverUnitOrder = function (driver_id, unit_id, { priority }) {
  return knex('driver_task').update({ priority }).where({ unit_id, driver_id }).returning('*');
};

exports.getSingleCompanyByunit = function(id) {
  return knex('units').select('*').where('id', id)
};

exports.getWeekDriverOrder = function(id) {
  return knex.raw(`select * from order_history where created_at > now() - interval '1 week' AND driver_id=${id} AND order_detail->>'status'='complete';`);
};

// Driver payout based on week working days and hours
exports.getWeekWorkingDayDriverOrder = function(id) {
  return knex.raw(`select distinct count(*)  from order_history where created_at > now() - interval '1 week' AND driver_id=${id} AND order_detail->>'status'='complete';`);
};

// Driver payout for a week based on delivery charges at different restaurant
exports.getWeekDeliveryChargesDriverOrder = function(id) {
  return knex.raw(`select distinct unit_id  from order_history where created_at > now() - interval '1 week' AND driver_id=${id} AND order_detail->>'status'='complete' group by unit_id;`);
};
exports.getWeekDeliveryChargesTotalDriverOrder = function(id,unitid) {
  return knex.raw(`select * from order_history where created_at > now() - interval '1 week' AND driver_id=${id} AND order_detail->>'status'='complete' AND unit_id=${unitid};`);
};


// Driver payout for a day based on delivery charges at different restaurant
exports.getPerDayDeliveryChargesDriverOrder = function(id) {
  let date = new Date();
  return knex.raw(`select distinct unit_id  from order_history where created_at > '${date.getFullYear()+'-'+((date.getMonth()+1) > 10 ? (date.getMonth()+1) :'0'+(date.getMonth()+1))+'-'+date.getDate()}' AND driver_id=${id} AND order_detail->>'status'='complete' group by unit_id;`);
};

exports.getOrders = function() {
  return knex.raw(`select * from order_history where order_detail->>'status'='complete';`);
};

exports.getPerDayDeliveryChargesTotalDriverOrder = function(id,unitid) {
  let date = new Date();
  return knex.raw(`select * from order_history where created_at > '${date.getFullYear()+'-'+((date.getMonth()+1) > 10 ? (date.getMonth()+1) :'0'+(date.getMonth()+1))+'-'+date.getDate()}' AND driver_id=${id} AND order_detail->>'status'='complete' AND unit_id=${unitid};`);
};


// Vendor payout for a day based on driver will pay for the day
exports.calculateVendorWagesPerdayForDriver = function(id) {
  let date = new Date();
  return knex.raw(`select distinct driver_id  from order_history where created_at > '${date.getFullYear()+'-'+((date.getMonth()+1) > 10 ? (date.getMonth()+1) :'0'+(date.getMonth()+1))+'-'+date.getDate()}' AND unit_id=${id} AND order_detail->>'status'='complete' group by driver_id;`);
};
exports.getPerDayVendorWagesForDriver = function(id,driverId) {
  let date = new Date();
  return knex.raw(`select * from order_history where created_at > '${date.getFullYear()+'-'+((date.getMonth()+1) > 10 ? (date.getMonth()+1) :'0'+(date.getMonth()+1))+'-'+date.getDate()}' AND unit_id=${id} AND order_detail->>'status'='complete' AND driver_id=${driverId};`);
};

exports.updateMoneyReceived = function(vendorId,driverId) {
  console.log('jkgdkjgaskjdkjhkhkjhkjhkjhkhhd,sbahdj,as',vendorId,driverId)
  return knex.raw(`UPDATE order_history SET is_payment_received_by_driver=true where unit_id=${vendorId} AND driver_id=${driverId};`);
};


exports.getCompany = function(id){
  return knex('units').where('id',id).returning('*');
}

exports.getDayWageDriverOrder = function(id) {
  let date = new Date();
  return knex.raw(`select * from order_history where created_at > '${date.getFullYear()+'-'+((date.getMonth()+1) > 10 ? (date.getMonth()+1) :'0'+(date.getMonth()+1))+'-'+date.getDate()}' AND driver_id=${id} AND order_detail->>'status'='complete';`);
};

exports.getTotalOrderCount = function(customerId) {
  return knex('order_history').count('*').where('customer_id', customerId)
};

exports.updateOrder = function(id, hash) {
  return knex('order_history').update(hash).where('id',id).returning('*');
};

exports.updateOrderStatus = function(id,data){
  return knex.raw(`Update order_history SET order_detail='${JSON.stringify(data)}' where order_detail->>'id'='${id}'`);
};

exports.getRoomServiceOrders = function (roomNumber, start, end) {
  //and created_at > '${start.toISOString()}' and created_at > '${end.toISOString()}'
  return knex.raw(`select order_history.*, units.name as unit_name from order_history left join units on order_history.unit_id = units.id where status #> '{bill_to_room}' = '${roomNumber}' and order_history.created_at > '${start.toISOString()}' and order_history.created_at < '${end.toISOString()}'`);
};

exports.getUserActiveOrders = function(companyId, unitId) {
  if (!companyId || !unitId) {
    console.error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
    throw new Error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
  }
  return knex('order_history').select('*').
    whereRaw("company_id="+companyId+" and unit_id="+unitId).returning('*');
};

exports.getActiveOrders = function(companyId, unitId) {
  if (!companyId || !unitId) {
    console.error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
    throw new Error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
  }
  return knex('order_history').select('*').
    whereRaw("status \\? ? and not (status \\?| ?) "+
    " and company_id = ? and unit_id = ?",
    ['order_paid', ['order_picked_up', 'order_delivered', 'no_show'], companyId, unitId]).returning('*');
};

exports.getClosedOrders = function(companyId, unitId) {
  if (!companyId || !unitId) {
    console.error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
    throw new Error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
  }
  return knex('order_history').select('*').
    whereRaw("company_id = ? and unit_id = ? and status \\?| ?",
    [companyId, unitId,['order_picked_up', 'order_delivered', 'no_show']]).returning('*');
};

exports.getRequestedOrders = function(companyId, unitId) {
  if (!companyId || !unitId) {
    console.error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
    throw new Error('Missing company id ('+ companyId+') or unit id ('+ unitId +')');
  }
  return knex('order_history').select('*').
    whereRaw("status \\? ? and not (status \\?| ?) "+
    " and company_id = ? and unit_id = ?",
    ['order_requested', ['order_accepted', 'order_declined'], companyId, unitId]).returning('*');
};


exports.getCustomerActiveOrders = function(customerId) {
  if (!customerId) {
    console.error('Missing customer id ('+ customerId+')');
    throw new Error('Missing customer id ('+ customerId+')');
  }
  return knex('order_history').select('*').
    whereRaw("customer_id="+customerId).returning('*');

  // if (!customerId) {
  //   console.error('Missing customer id ('+ customerId+')');
  //   throw new Error('Missing customer id ('+ customerId+')');
  // }
  // return knex('order_history').select('*').
  //   whereRaw("status \\? ? and not (status \\?| ?) and customer_id = ?",
  //   ['order_paid', ['order_picked_up', 'order_delivered', 'no_show'], customerId]).returning('*');
};

exports.getCustomerClosedOrders = function(customerId) {
  if (!customerId) {
    console.error('Missing customer id ('+ customerId+')');
    throw new Error('Missing customer id ('+ customerId+')');
  }
  return knex('order_history').select('*').
    whereRaw("customer_id = ? and status \\?| ?",
    [customerId,['order_picked_up', 'order_delivered', 'no_show']]).returning('*');
};

exports.getCustomerRequestedOrders = function(customerId) {
  if (!customerId) {
    console.error('Missing customer id ('+ customerId+')');
    throw new Error('Missing customer id ('+ customerId+')');
  }
  return knex('order_history').select('*').
    whereRaw("status \\? ? and not (status \\?| ?) "+
    " and customer_id = ? ",
    ['order_requested', ['order_paid', 'pay_fail'], customerId]).returning('*');
};


exports.getDriverActiveOrders = function(driverId) {
  if (!driverId) {
    console.error('Missing driver ids ('+ driverId+')');
    throw new Error('Missing driver ids ('+ driverId+')');
  }
  var query= knex('order_history').select('*').
    whereRaw("status \\? ? and not (status \\?| ?) and driver_id=? and for_delivery=true",
    ['order_paid', ['order_picked_up', 'order_delivered', 'no_show'], driverId]).returning('*');
  return query;
};
