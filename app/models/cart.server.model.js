var knex = require('../../config/knex');
var debug = require('debug')('food_parks.model');

exports.addcart = function(data) {
    return knex('cart').insert(data);
};
exports.addorderHistory = function(data) {
    return knex('order_history').insert(data);
};

exports.getOrderByid = function(id) {
    return knex('order_history').select('*').where('id',id);
};
exports.updatedOrderByid = function(id,obj) {
    // return knex.raw(`UPDATE order_history SET order_detail=jsonb_set(order_detail,'${obj}') where order_detail->>'id'='${id}';`);
    return knex('order_history').update('order_detail',obj).where('id',id);
};

exports.getOrderById = function(orderId) {
    return knex.raw(`select * from order_history where order_detail->>'id'='${orderId}';`);
};

exports.getOrderByOrderid = function(id) {
    return knex('order_history').select('*').where('order_id',id);
};

exports.updatePayment= function(id, data){
    return knex('order_history').update('payment_response',data).where('id', id);
}

exports.getAllorderItems = function(vendor_id) {
    return knex('orderhistory').where('vendor_id',vendor_id).andWhere('order_status',null).returning('*');
};

exports.acceptOrderByRestaurant = function(orderId) {
    return knex('orderhistory').update({'order_status':'accept'}).where('order_id',orderId);
};
exports.assignOrderToDriver = function(orderId,driverId) {
    return knex('orderhistory').update({'driver_id':driverId}).where('order_id',orderId);
};

exports.getCartForVendor = function(userid,productid,count){
    return knex('cart').select('*').where('userid', userid).andWhere('productid',productid).returning('*');
};

exports.getCart = function(userid,productid,count){
    return knex('cart').select('*').where('userid', userid).andWhere('productid',productid).andWhere('order_count',count).returning('*');
};

exports.getAllCartItems = function(userid) {
    return knex('cart').where('userid',userid).returning('*');
};

exports.deleteCartItem = function(userid) {
    return knex('cart').where('userid',userid).del();
};

exports.updateOrderScreen = function(userid,orderId) {
    return knex('orderhistory').update({'status':'checkout','order_id':orderId}).where('userid',userid);
};

exports.getOrderHistory = function(userid) {
    return knex('orderhistory').where('userid',userid).andWhere({'status':'checkout'}).returning('*');
};

exports.getcustomer = function(id){
    return knex('customers').where('user_id',id).returning('*');
};

exports.getnewOrderHistory = function(id) {
    return knex('order_history').where('customer_id',id).returning('*');
};