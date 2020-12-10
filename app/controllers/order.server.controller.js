var config  = require('../../config/config');
var auth = require('./authentication.server.controller');
var Company = require ('../models/company.server.model');
var Customer = require ('../models/customer.server.model');
var User = require('../models/user.server.model');
var moltin  = require('./moltin.server.controller');
var orderhistory  = require('../models/orderhistory.server.model');
var TimeHelper = require('../utils/timeutils');
var Unit    = require ('../models/unit.server.model');
var Driver = require ('../models/driver.server.model');
var debug   = require('debug')('orders');
var logger = require('winston');


var ORDER = '/orders';

exports.createDriverWage =function*(){
  try{
    let body = {
      driver_id : this.params.driverId,
      unit_id: this.body.unit_id,
      per_hour_price: this.body.per_hour_price,
      work_time : this.body.work_time,
      work_date : new Date(this.body.work_date)
    }

    let wage = yield Driver.createDriverWage(body);
    console.log({wage})
    if(wage){
      this.body = {status:200, message:"Wage created", data:wage};
      return;
    }
  }catch(error){
    this.status =400;
    this.body = { status: 400, message: "Something went wrong!", error }
    return;
  }
}

exports.getDriverWage = function*(){
  try{
    let wage = yield Driver.getDriverWage(this.params.driverId);
    let driver = (yield Driver.getSingleUser(this.params.driverId))[0];
    if(wage.length){
      let today = new Date();
      let after_week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let temp = wage.filter(x => x.work_date <= today);
      let final = temp.filter(x=> x.work_date >= after_week);
      this.body = {status:200, message:"Wages", data:{ result: final, driver}};
      return
    }
  }catch(error){
    this.status =400;
    this.body = { status: 400, message: "Something went wrong!", error }
    return;
  }
}


exports.deleteOrder = function*(){
  try{
    let order = yield orderhistory.getOrder(this.params.orderId);
    if(order.rows.length){
      let del = yield orderhistory.deleteOrder(order.rows[0].id);
      if(del){
        this.body = {status:200, message:"order deleted",data:del};
        return;
      }
    }else{
      this.status=404;
      this.body = {status:404, message:"Order not found!"};
      return;
    }
  }catch(error){
    this.status=400;
    this.body = {status:400, message:"Something went wrong", error};
    return;
  }
}

exports.approvePayment = function*(){
  try{
    let units = this.body.units;
    for(let item of units){
      let wages = yield Driver.getDriverWagebyUnits(item, this.params.driverId);
      for(let i of wages){
        let update = yield Driver.updateStatus(i.id);
      }
    }
    this.body = {status:200, message:"Status updated"};
    return;
  }catch(error){
    this.status =400;
    this.body = { status: 400, message: "Something went wrong!", error }
    return;
  }
}

exports.getusers = function* () {
  try {
    let users = yield User.listusers('CUSTOMER');
    if (users) {
      this.body = { status: 200, message: "Users fetched successfully", data: users };
      return;
    } else {
      this.body = { status: 404, message: "Users not found!" };
      return;
    }
  } catch (err) {
    this.body = { status: 400, message: "Something went wrong!", err }
    return;
  }
}

exports.grouppay = function* () {
  try {
    var order_id = this.body.order_id;
    var participant = this.body.participant_id;
    var payment_type = this.body.payment_type;

    if (!participant.length) {
      this.body = { status: 404, message: "No participant added, please add one" };
      return;
    }
    let order = yield orderhistory.getOrder(order_id);
    if (!order.rows.length) {
      this.body = { status: 404, message: "No Order found!" };
      return;
    }
    var customer_id = order.rows[0].customer_id;
    let user = yield Customer.getSingleCustomer(customer_id);
    var user_id = user[0].user_id;
    var order_amount = order.rows[0].amount;
    var obj = {
      user_id, order_id, payment_type, is_initiator: true, order_amount, payment_status: "processing"
    }
    let setrootuser = yield orderhistory.creategrouppayment(obj);
    for (let item of participant) {
      let body = {};
      body['user_id'] = item;
      body['order_id'] = order_id;
      body['payment_type'] = payment_type;
      body['order_amount'] = order_amount;
      body['payment_status'] = "processing";
      let setparticipant = yield orderhistory.creategrouppayment(body);
    }
    if (setrootuser) {
      this.body = { status: 200, message: "Group-payment initiated" };
      return;
    }
  } catch (error) {
    this.body = { status: 400, message: "Something went wrong!", error }
    return;
  }
};


exports.acceptPaymentFromUser = function* () {
  try {
    let order_id = this.body.order_id;
    let user_id = this.body.user_id;
    let paid_amount = this.body.paid_amount;

    let partialorders = yield orderhistory.getgrouppayment(order_id);
    let val = partialorders.filter(x => x.user_id == user_id)[0];
    if(val.payment_status == 'paid'){
      this.status = 422;
      this.body = {status: 422, message:"Payment already done by user"};
      return;
    }
    if (val.payment_type == 'equal') {
      if (val.is_initiator == true || val.is_initiator == 'true') {
        let rest = partialorders.filter(x => x.user_id != user_id);
        let amount = 0;
        for (let item of rest) {
          if (item.payment_status == 'processing') {
            this.body = { status: 400, message: "Other participants payment is not done yet!" };
            return;
          } else {
            amount = amount + parseInt(item.paid_amount);
          }
        }
        let payable = parseInt(val.order_amount) - parseInt(amount);
        if (parseInt(payable) == parseInt(paid_amount)) {
          let update = yield orderhistory.updategrouppayment(order_id, user_id, parseInt(payable));
          this.body = { status: 200, message: "Paid successfully" };
          return;
        } else {
          this.status = 422;
          this.body = { status: 422, message: "Paid amount is not equal to rest amount" };
          return;
        }
      } else {
        let payable = (val.order_amount) / partialorders.length;
        if (parseInt(payable) == parseInt(paid_amount)) {
          let update = yield orderhistory.updategrouppayment(order_id, user_id, parseInt(payable));
          this.body = { status: 200, message: "Paid successfully" };
          return;
        } else {
          this.status = 422;
          this.body = { status: 422, message: "Paid amount is not equal to one part" };
          return;
        }
      }
    } else {
      if (val.is_initiator == true || val.is_initiator == 'true') {
        let rest = partialorders.filter(x => x.user_id != user_id);
        let amount = 0;
        for (let item of rest) {
          if (item.payment_status == 'processing') {
            this.body = { status: 400, message: "Other participants payment is not done yet!" };
            return;
          } else {
            amount = amount + parseInt(item.paid_amount);
          }
        }
        let payable = parseInt(val.order_amount) - parseInt(amount);
        if (parseInt(payable) == parseInt(paid_amount)) {
          let update = yield orderhistory.updategrouppayment(order_id, user_id, parseInt(payable));
          this.body = { status: 200, message: "Paid successfully" };
          return;
        } else {
          this.status = 422;
          this.body = { status: 422, message: "Paid amount is not equal to rest amount" };
          return;
        }
      } else {
        let update = yield orderhistory.updategrouppayment(order_id, user_id, paid_amount);
        this.body = { status: 200, message: "Paid successfully" };
        return;
      }
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
};

exports.listUnitOrder=function*(){
  try{
    let unit_id = this.params.unitId;
    let unitOrders = yield orderhistory.getUnitOrder(unit_id);
    let unit = (yield orderhistory.getSingleCompanyByunit(unit_id))[0];
    unit.order_count = unitOrders.length;
    if(unitOrders){
      this.status = 200;
      this.body = {status: 200, message:"Orders for a unit", data: unit};
      return;
    }else{
      this.status= 404;
      this.body = {status: 404, message:"Orders not found!"};
      return;
    }
  }catch(error){
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}


exports.listUnitOrderItems=function*(){
  try{
    let unit_id = this.params.unitId;
    let unitOrders = yield orderhistory.getUnitOrder(unit_id);
    let result = [];
    if(unitOrders.length>0){
      for(let item of unitOrders){
        let itd = (yield moltin.getorderItems(item.order_detail.id));
        item.order_items = itd;
        result.push(item);
      }
      this.status = 200;
      this.body = {status: 200, message:"Orders for a unit", data: result};
      return;
    }else{
      this.status= 404;
      this.body = {status: 404, message:"Orders not found!"};
      return;
    }
  }catch(error){
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}


exports.getGroupPaymentStatus = function* () {
  try {
    let order_id = this.params.orderId;
    let partialorders = yield orderhistory.getgrouppayment(order_id);
    if (partialorders.length <= 0) {
      this.status = 404;
      this.body = { status: 404, message: "Other not Found!" };
      return;
    } else {
      let count = 0;
      for (let item of partialorders) {
        if (item.payment_status == 'processing') {
          count++;
        }
      }
      if (count == 0) {
        this.body = { status: 200, message: "All participants payment done!" };
        return;
      } else {
        this.status = 400;
        this.body = { status: 400, message: "Payments not completed by all participant!" };
        return;
      }
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
};


exports.getOrders = function*(next){
  logger.info('Getting Orders',{fn:'getOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  var search = this.query;
  var query = '';
  for(var q in search){
    query = (query)? query + '&'+ q + '=' + search[q]:'?'+ q + '=' + search[q];
  }
  logger.info('Order Query',{fn:'getOrders',query:query});
  var orders = {};
  try{
    var flow = ORDER + '/' + 'search' + query
    orders = yield moltin.getOrder(flow);
  }catch(e){
    logger.error('Error retrieving Query',{fn:'getOrders',query:query,error:err});
    throw(e);
  }
  logger.info('Orders retrieved',{fn:'getOrders',orders:orders});
  this.body = {status:200,message:"get order list here",data:orders};
  return;
}

exports.getHotelContextOrders = function * (next) {
  if (!this.query.room_number) {
    this.body = {
      error : 'Correct endpoint format: /hotel?room_number={room number}&start={ISODate start}&end={ISODate end}'
    };
    this.status = 412;
    return;
  }

  var start = new Date(this.query.start ? Number(this.query.start) : 0);
  var end = this.query.end ? new Date(Number(this.query.end)) : new Date();
  var roomNumber = this.query.room_number;


  end = TimeHelper.getEndOfDay(end);

  var orders = (yield orderhistory.getRoomServiceOrders(roomNumber, start, end)).rows;
  this.status = 200;
  this.body = {data:orders,message:"get hotel orders",status : 200};
  
};


exports.getActiveOrders = function * (next) {
  logger.info('Getting Active Orders',{fn:'getActiveOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  debug('getActiveOrders');
  if (!this.company || !this.unit) {
    logger.error('Company/unit id missing',{fn:'getActiveOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company/unit id missing'});
    throw new Error('Company/unit id missing', 422);
  }
  logger.info('checking authorization');
  debug('..check authorization');
  var user = this.passport.user;
  var orders = {};
  var unit_manager_fbid = user.fbid;
  var returnBody = {};
  logger.info(user);
  logger.info(this.unit);
  if (user.role == 'OWNER' && user.id == this.company.user_id ||
      user.role == 'UNITMGR' && user.id == this.unit.unit_mgr_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      logger.info("UM FBID: " + unit_manager_fbid);
      orders = yield orderhistory.getUserActiveOrders(this.company.id, this.unit.id);
      logger.info("UM ORDERS: ",this.company.id,this.unit.id,orders);
    } catch (err) {
      logger.error('Error getting active orders',{fn:'getActiveOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    // order.unit_manager_fbid = unit_manager_fbid;
    if (orders) {
      for (i = 0; i < orders.length; i++) {
        logger.info("Order customerID: " + orders[i].customer_id);
        orders[i].unit_manager_fbid = unit_manager_fbid;
        orders[i].customer_fbid = (yield User.getFBID(orders[i].customer_id))[0].fbid;
      }
    }
    else {
      orders = [];
    }
    this.body = {status : 200, data:orders};
    logger.info("Return: " + orders);
    return;
  } else {
    logger.error('User not authorized',{fn:'getActiveOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {message: 'User not authorized',status : 401}
    return;
  }
}

exports.getClosedOrders = function * (next) {
  debug('getClosedOrders');
  logger.info('Getting Closed Orders',{fn:'getClosedOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  if (!this.company || !this.unit) {
    logger.error('Company/unit id missing',{fn:'getClosedOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company/unit id missing'});
    throw new Error('Company/unit id missing', 422);
  }
  debug('..check authorization');
  var user = this.passport.user;
  if (user.role == 'OWNER' && user.id == this.company.user_id ||
      user.role == 'UNITMGR' && user.id == this.unit.unit_mgr_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      var orders = yield orderhistory.getClosedOrders(this.company.id, this.unit.id);
    } catch (err) {
      logger.error('Error getting closed orders',{fn:'getClosedOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    logger.info("Closed Orders retrieved", {fn:'getClosedOrders',orders:orders});
    this.body = {data:orders,status : 200};
    return;
  } else {
    logger.error('User not authorized',{fn:'getClosedOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {status : 401,message: 'User not authorized'}
    return;
  }
}

exports.getRequestedOrders = function * (next) {
  debug('getRequestedOrders');
  logger.info('Getting Requested Orders',{fn:'getRequestedOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  if (!this.company || !this.unit) {
    logger.error('Company/unit id missing',{fn:'getRequestedOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company/unit id missing'});
    throw new Error('Company/unit id missing', 422);
  }
  debug('..check authorization');
  var user = this.passport.user;
  if (user.role == 'OWNER' && user.id == this.company.user_id ||
      user.role == 'UNITMGR' && user.id == this.unit.unit_mgr_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      var orders = yield orderhistory.getRequestedOrders(this.company.id, this.unit.id);
    } catch (err) {
      logger.error('Error getting requested orders',{fn:'getRequestedOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    logger.info("Requested Orders retrieved", {fn:'getRequestedOrders',orders:orders});
    this.body = {data:orders,status : 200};
    return;
  } else {
    logger.error('User not authorized',{fn:'getRequestedOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {status : 401,message: 'User not authorized'}
    return;
  }
}

exports.getCustomerActiveOrders = function * (next) {
  
  logger.info('Getting Customer Active Orders',{fn:'getCustomerActiveOrders'}); //, user_id: this.passport.user.id,
  
    // role:this.passport.user.role});
  if (!this.customer) {
    logger.error('Company id missing',{fn:'getCustomerActiveOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company id missing'});
    this.status= 422;
    this.body = {status:422,message: 'Customer id missing'};
    return;
  }
  debug('..check authorization');
  var user = this.passport.user;
  var customer_fbid = user.fbid;
  if (user.role == 'CUSTOMER' && user.id == this.customer.user_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      debug('getCustomerActiveOrders1111111111111111111111111111111111111111111111111111',this.customer.id);
      orders = yield orderhistory.getCustomerActiveOrders(this.customer.id);
      if (orders) {
        for (i = 0; i < orders.length; i++) {
          logger.info("Order unitId: " + orders[i].unit_id);
          orders[i].unit_manager_fbid = (yield User.getUserIdForUnitMgrByUnitId(orders[i].unit_id))[0].fbid;
          orders[i].customer_fbid = customer_fbid;
        }
      }
      else {
        orders = [];
      }
    } catch (err) {
      logger.error('Error getting customer active orders',{fn:'getCustomerActiveOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    this.body = {data:orders,status:200,message:'Active order get successfully'};
    logger.info("Return: " + orders);
    return;
  } else {
    logger.error('User not authorized',{fn:'getCustomerActiveOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {status:401,message: 'User not authorized'}
    return;
  }
}

exports.getCustomerClosedOrders = function * (next) {
  debug('getCustomerClosedOrders');
  logger.info('Getting Customer Closed Orders',{fn:'getCustomerClosedOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  if (!this.customer) {
    logger.error('Company id missing',{fn:'getCustomerClosedOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company id missing'});
    this.status= 422;
    this.body = {status : 422,message: 'Customer id missing'};
    return;
  }
  debug('..check authorization');
  var user = this.passport.user;
  if (user.role == 'CUSTOMER' && user.id == this.customer.user_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      var orders = yield orderhistory.getCustomerClosedOrders(this.customer.id);
    } catch (err) {
      logger.error('Error getting customer closed orders',{fn:'getCustomerClosedOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    logger.info("Customer Closed Orders retrieved", {fn:'getCustomerClosedOrders',orders:orders});
    this.body = {data:orders,status : 200};
    return;
  } else {
    logger.error('User not authorized',{fn:'getCustomerClosedOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {message: 'User not authorized',status : 401}
    return;
  }
}

exports.getCustomerRequestedOrders = function * (next) {
  debug('getCustomerRequestedOrders');
  logger.info('Getting Customer Requested Orders',{fn:'getCustomerRequestedOrders'}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  if (!this.customer) {
    logger.error('Company id missing',{fn:'getCustomerRequestedOrders'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:'Company id missing'});
    this.status= 422;
    this.body = {message: 'Customer id missing',status : 422};
    return;
  }
  debug('..check authorization');
  var user = this.passport.user;
  if (user.role == 'CUSTOMER' && user.id == this.customer.user_id ||
      user.role == 'ADMIN') {
    debug('..authorized');
    try {
      var orders = yield orderhistory.getCustomerRequestedOrders(this.customer.id);
    } catch (err) {
      logger.error('Error getting customer requested orders',{fn:'getCustomerRequestedOrders'}); //, user_id: this.passport.user.id,
        // role:this.passport.user.role, error:err});
      throw err;
    }
    debug('..orders');
    debug(orders);
    logger.info("Customer Requested Orders retrieved", {fn:'getCustomerRequestedOrders',orders:orders});
    this.body = {data:orders,status : 200};
    return;
  } else {
    logger.error('User not authorized',{fn:'getCustomerRequestedOrders',user_id: this.passport.user.id,
      role: this.passport.user.role, error:'User not authorized'});
    this.status=401
    this.body = {message: 'User not authorized',status : 401}
    return;
  }
}

exports.getCompany=function *(id, next) {
  logger.info('Getting Company',{fn:'getCompany',id:id}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  debug('getCompany');
  debug('id ' + id);
  var company = '';
  try {
    company = (yield Company.getSingleCompany(id))[0];
  } catch (err) {
    logger.error('Error getting company',{fn:'getCompany'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:err});
    throw(err);
  }
  debug(company);
  logger.info('Company retrieved',{fn:'getCompany',company:company});
  this.company = company;
  yield next;
}

exports.getCustomer=function *(id, next) {
  logger.info('Getting Customer',{fn:'getCustomer',id:id, pp : this.passport});// user_id: this.passport.user.id, role: this.passport.user.role});
  debug('getCustomer');
  debug('id ' + id);
  var customer = '';
  try {
    customer = (yield Customer.getSingleCustomer(id))[0];
   
  } catch (err) {
    logger.error('Error getting customer',{fn:'getCustomer'}); //}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:err});
    throw(err);
  }
  debug(customer);
  logger.info('Customer retrieved',{fn:'getCustomer',customer:customer});
  this.customer = customer;
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',(yield Customer.getSingleCustomer(id)),id,this.customer)
  yield next;
}

exports.getUnit=function *(id, next) {
  logger.info('Getting Unit',{fn:'getUnit',id:id}); //, user_id: this.passport.user.id,
    // role:this.passport.user.role});
  debug('getUnit');
  debug('id ' + id);
  var unit = '';
  try {
    unit = (yield Unit.getSingleUnit(id))[0];
  } catch (err) {
    logger.error('Error getting unit',{fn:'getUnit'}); //, user_id: this.passport.user.id,
      // role:this.passport.user.role, error:err});
    throw(err);
  }
  debug(unit);
  logger.info('Unit retrieved',{fn:'getUnit',unit:unit});
  this.unit = unit;
  yield next;
}

exports.getDriverActiveOrders = function * (next) {
  debug('getDriverActiveOrders');
  var meta={fn:'getDriverActiveOrders'};
  logger.info('Getting Driver Active Orders',meta); 
  if (!this.params.userId) {
    logger.error('Driver User id missing',{fn:meta}); 
    this.status= 422;
    this.body = {message: 'Driver User id missing',status : 422};
    return;
  }
  debug('..check authorization');
  var user = this.passport.user;
  var driverUserId=this.params.userId;
  meta.driver_user_id=driverUserId;


  if (user.role === 'DRIVER' && user.id == driverUserId ||
      user.role === 'ADMIN') {
    debug('..authorized');
    try {
      //get list of driver ids
      console.log(driverUserId);
      meta.driver_id=driverUserId;
      var orders = driverUserId ? yield orderhistory.getDriverActiveOrders(driverUserId) : [];
      console.log(orders);
      if (orders && orders.length > 0) {
        for (i = 0; i < orders.length; i++) {
          logger.info("Order unitId: " + orders[i].unit_id);
          orders[i].order_type = orders[i].context === 'hotel' ? 'room' : (orders[i].context === 'cod' ? 'cod' : 'normal');

          if (orders[i].order_type === 'room') {
            orders[i].room_number = orders[i].status.bill_to_room;
          }

          orders[i].unit_manager_fbid = (yield User.getUserIdForUnitMgrByUnitId(orders[i].unit_id))[0].fbid;
          orders[i].customer_fbid = (yield User.getFBID(orders[i].customer_id))[0].fbid;
        }
      }
      else {
        orders = [];
      }
    } catch (err) {
      meta.error=err;
      logger.error('Error getting driver active orders',meta); 
      throw err;
    }
    debug('..orders');
    debug(orders);
    this.body = {data:orders,status : 200};
    logger.info("Return: " + orders);
    return;
  } else {
    meta.error='User not authorized';
    meta.user_id=this.passport.user.id;
    meta.role=this.passport.user.role;
    logger.error('User not authorized',meta);
    this.status=401
    this.body = {message: 'User not authorized',status : 401}
    return;
  }
}
