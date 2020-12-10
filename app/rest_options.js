var _ = require('lodash');
var Queries = require('../koa-resteasy').Queries;
var Company = require('./models/company.server.model');
var Customer = require('./models/customer.server.model');
var FoodPark = require('./models/foodpark.server.model');
var DeliveryAddress = require('./models/deliveryaddress.server.model');
var Favorites = require('./models/favorites.server.model');
var Loyalty = require('./models/loyalty.server.model');
var LoyaltyRewards = require('./models/loyaltyrewards.server.model');
var OrderHistory = require('./models/orderhistory.server.model');
var Reviews = require('./models/reviews.server.model');
var User = require('./models/user.server.model');
var Territories = require('./models/territories.server.model');
var config = require('../config/config');
var msc = require('./controllers/moltin.server.controller');
var Square = require('./controllers/square.server.controller');
var payload = require('./utils/payload');
var timestamp = require('./utils/timestamp');
var T = require('./utils/translate');
var push = require('./controllers/push.server.controller');
var Prepay = require('./controllers/prepay.server.controller');
var ParseUtils = require('./utils/parseutils');
var User = require('./models/user.server.model');
var Unit = require('./models/unit.server.model');
var Driver = require('./models/driver.server.model');
var Format = require('./utils/formatutils')
var ContextHandler = require('./utils/contexthandler');
var debug = require('debug')('rest_options');
var logger = require('winston');
var request = require('requestretry');
var knex = require('../config/knex.js');

const translator = new T();

const softDeleteTables =  ['companies', 'food_parks', 'territories', 'units', 'users', 'requests'];
const CENTS_IN_ONE = 100;

function *simplifyDetails(orderDetail) {
    var meta = {fn: 'simplifyDetails', user_id: this.passport.user.id, role: this.passport.user.role}
    logger.info('Simplifying order details', meta);
    if (!orderDetail) {
      meta.error = 'Missing order details';
      logger.error('No order details provided', meta);
      return '';
    }
    debug('Order Detail:');
    debug(orderDetail);
    var items = orderDetail; 
    var itemsData = items[0].data;
    debug('Number of items in order: '+ itemsData.length);
    meta.num_items = itemsData.length;
    logger.info('Processing '+ itemsData.length + ' items in order', meta);

    var menuItems = getSkuFromOrderDetail(itemsData);
    for (var key in menuItems) {
      menuItems[key].options = getExtraSkuFromOrderDetail(itemsData, menuItems[key].sku);
      delete menuItems[key].sku;
    }

    logger.info('Order details simplified', meta);
    debug(menuItems);
    return menuItems;
}

function getSkuFromOrderDetail(orderDetailItems) {
  var menuItems = {};
  for (i = 0; i < orderDetailItems.length; i++ ) {
    item = orderDetailItems[i];
    if (!item.sku.startsWith("Extra")) {
      var itemDetail = {
          title: item.name,
          sku: item.sku,
          quantity: item.quantity,
          options: [],
          selections: {}
      }
      menuItems[item.product_id] = itemDetail;
    }
  }

  return menuItems;
}

function getExtraSkuFromOrderDetail(orderDetailItems, productSku){
  extraOptionItems = []
  for (i = 0; i < orderDetailItems.length; i++ ) {
    item = orderDetailItems[i];
    /*
     * Considering the productSku:
     *  koolaid-1530795364335-burrito
     *
     * This filter will return one extra sku like the following:
     *  Extra-Chips-and-Salsa-koolaid-1530795364335-burrito
     *
     * But not:
     *  Extra-Chips-and-Salsa-koolaid-1530795364335-burrito2
     */
    if (item.sku.startsWith("Extra") && item.sku.endsWith(productSku)) {
      extraOptionItems.push(item.name);
    }
  }

  return extraOptionItems;
}

function * calculateDeliveryPickup(unitId, deliveryTime) {
  logger.info('Calculating delivery pickup', {fn: 'calculateDeliveryPickup',
    user_id: this.passport.user.id, role : this.passport.user.role, unit_id: unitId,
    delivery_time: deliveryTime});
  var pickup = '';
  if (deliveryTime) {
    var delivery = new Date(deliveryTime);
    var unit = '';
    try {
      unit = (yield Unit.getSingleUnit(unitId))[0];
      debug('..unit');
      debug(unit);
    } catch (err) {
      logger.error('Error getting unit',
          {fn: 'calculateDeliveryPickup', user_id: this.passport.user.id,
          role: this.passport.user.role, error: err});
      throw err;
    }
    if (unit.delivery_time_offset) {
      pickup = new Date( delivery.getTime() - unit.delivery_time_offset * 60000);
    } else {
      pickup = new Date(delivery.getTime() - config.deliveryOffset * 60000);
    }
    debug('..delivery pickup time is '+ pickup.toISOString());
  }
  var puTime = pickup.toISOString();
  logger.info('Delivery pickup time '+ puTime,
    {fn: 'calculateDeliveryPickup', user_id: this.passport.user.id, role: this.passport.user.role,
    unit_id: unitId, delivery_time: deliveryTime, pickup_time: puTime });

  return pickup;
}

function getSquareMoneyValue(value) {
    return value / CENTS_IN_ONE;
}

function * beforeSaveOrderHistory() {
  debug('beforeSaveOrderHistory');
  debug(this.resteasy.object);
  debug('..operation '+ this.resteasy.operation)
  debug(this.passport.user.role)
  logger.info('Prepare to save order ',
    {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id, role :
    this.passport.user.role, order_sys_order_id: this.resteasy.object.order_sys_order_id});

  if (this.resteasy.operation == 'create') {

    var eCommerce = true; //is an ecommerce system being used to place this order?

    if (this.passport.user.role != 'CUSTOMER' && this.passport.user.role !== 'FOODPARKMGR' && this.passport.user.role !== "UNITMGR") {
      logger.error('User unauthorized',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
          role: this.passport.user.role, error: 'User unauthorized'});
      throw new Error('User unauthorized', 401);
    }

      debug('...create')
    debug('..getting customer name')
    try {
      debug('..user ')
      debug(this.passport.user)

      var customer = undefined;
      var user = undefined;

      if (this.resteasy.object.customer_id) {
        customer = yield Customer.getSingleCustomer(this.resteasy.object.customer_id);
        customer = customer[0];

        if (!customer.user_id)
          throw new Error('Invalid customer id', 422);

        user = yield User.getSingleUser(customer.user_id);
        user = user[0];
      }
      else {
        user = this.passport.user;
        customer = (yield Customer.getForUser(user.id))[0];
      }

      if(!this.resteasy.object.commission_type) {
        logger.error('No commission type provided for e-commerce system',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
            role: this.passport.user.role, error: 'Missing e-commerce commission type (commission_type)'});

        throw new Error('commission_type is required', 422);
      }

      var customStatus = undefined;
      if(this.resteasy.object.context) {
        customStatus = ContextHandler(this.resteasy.object.context, user);
      }


      debug('..customer');
      debug(customer)
    } catch (err) {
      logger.error('Error getting customer',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
          role: this.passport.user.role, order_sys_order_id: osoId, error: err});
      throw err;
    }
    var customerName = user.first_name + " " + user.last_name.charAt(0);
    debug("..customer name is "+ customerName);
    this.resteasy.object.customer_name = customerName;
    this.resteasy.object.customer_id = customer.id;

    logger.info('Order by customer '+ customerName,
      {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id, role :
      this.passport.user.role, order_sys_order_id: osoId});
    //set company
    debug('..get company id');
    if (!this.resteasy.object.company_id) {
      debug(this.params.context)
      var coId = this.params.context.match(/companies\/(\d+)\//)
      debug(coId)
      this.resteasy.object.company_id = coId[1];
    }
    var coId = this.resteasy.object.company_id;
    debug('..getting company name')
    var company = '';
    try {
      debug('..company id ');
      debug(coId);
      company = (yield Company.getSingleCompany(coId))[0];
      debug('..company');
      debug(company);
    } catch (err) {
      logger.error('Error getting company',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
          role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, error: err});
      throw err;
    }
    debug("..company name is "+ company.name);
    this.resteasy.object.company_name = company.name;

    logger.info('Order for company '+ company.name,
      {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
      role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId});

    //set unit
    debug('..get unit id');
    var unitId = '';
    if (!this.resteasy.object.unit_id) {
      debug(this.params.context)
      unitId = this.params.context.match(/units\/(\d+)/);
      debug(unitId);
      unitId = unitId[1];
      debug(unitId);
      this.resteasy.object.unit_id = unitId;
    }
    logger.info('Order for unit '+ unitId,
      {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
      role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, unit_id: unitId});

    var osoId = this.resteasy.object.order_sys_order_id;
    if (! this.resteasy.object.order_sys_order_id) {
      if (this.resteasy.object.context === 'prepay') {
        if (!this.resteasy.object.menu_items_data) {
            eCommerce = false;

            yield Prepay.registerGranuoDebit(this.resteasy.object.amount, this.resteasy.object.company_id, this.resteasy.object.customer_id);

            this.resteasy.object.amount = Format.formatPrice(this.resteasy.object.amount, this.resteasy.object.currency);
            this.resteasy.object.order_detail = { 0 :
              {
                "title" : "Pre-pay Debit",
                "quantity" : 1
              }
            };

            this.resteasy.object.qr_code = ParseUtils.getRandomNumber(15);

          var priorBalance = (yield Loyalty.getPointBalance(this.resteasy.object.customer_id, coId))[0];
          if (!priorBalance) {
            logger.info('creating new loyalty points record for customer ' + this.resteasy.object.customer_id + ' at company ' + coId);
            var initBalance = '1';
            var newLoyalty = (yield Loyalty.createNew(this.resteasy.object.customer_id, coId, initBalance))[0];
            debug(newLoyalty);
          } else {
            debug(priorBalance);
            logger.info('incrementing loyalty points for customer ' + this.resteasy.object.customer_id + ' at company ' + coId);

            var priorBalValue = parseInt(priorBalance.balance);
            var updatedBalValue = priorBalValue + 1;
            var isEligible_five = false;
            var isEligible_ten = false;
            var isEligible_fifteen = false;
            if (updatedBalValue >= 5) {
              isEligible_five = true;
            }
            if (updatedBalValue >= 10) {
              isEligible_ten = true;
            }
            if (updatedBalValue >= 15) {
              isEligible_fifteen = true;
            }
            var incrementedLoyalty = {
              balance: updatedBalValue,
              eligible_five: isEligible_five,
              eligible_ten: isEligible_ten,
              eligible_fifteen: isEligible_fifteen,
              updated_at: this.resteasy.knex.fn.now()
            };

            this.resteasy.queries.push(
              this.resteasy.transaction.table('loyalty').where('loyalty.id', priorBalance.id).update(incrementedLoyalty)
            );
          }

          delete this.resteasy.object.currency;
        }

        else {
          yield Prepay.registerGranuoDebit(this.resteasy.object.amount, this.resteasy.object.company_id, this.resteasy.object.customer_id);
          this.resteasy.object.qr_code = ParseUtils.getRandomNumber(15);
        }

      }
      else {
        logger.error('No order id provided for e-commerce system',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
            role: this.passport.user.role, error: 'Missing e-commerce (order_sys) order id'});
        throw new Error('order_sys_order_id is required', 422);
      }

    }

    if (eCommerce) {
        // get order details and streamline for display
        var moltin_order_id = osoId;
        var order_details = {};
        logger.info('Moltin order');
        debug('..order sys order id: ' + moltin_order_id);

        try {
          if (!this.resteasy.object.menu_items_data)
            throw new Error('menu_items_data field missing');
          order_details = this.resteasy.object.menu_items_data;
          delete this.resteasy.object.menu_items_data;

          order_details = yield simplifyDetails.call(this, order_details)
        } catch (err) {
          logger.error('Error retrieving order items from ecommerce system ',
            {
              fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
              role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, unit_id: unitId,
              error: err
            });
          throw(err)
        }
        debug('...total amount ' + this.resteasy.object.amount)
        debug('...order details ')
        debug(order_details)
        this.resteasy.object.order_detail = order_details;
        // Set the initial state

        if (this.resteasy.object.context) {
          this.resteasy.object.status = {
            order_requested: new Date(),
            order_paid: new Date(),
            order_accepted: new Date()
          };

          this.resteasy.object.qr_code = ParseUtils.getRandomNumber(15);
        } else {
          this.resteasy.object.status = {
            order_requested : ''
          }
        }

        if (this.passport.user.role !== 'CUSTOMER')
          this.resteasy.object.status.created_by = this.passport.user.id;

        if (customStatus) {
          var customStatusKeys = Object.keys(customStatus);
          var savingContext = this;

          customStatusKeys.forEach(function (key) {
            savingContext.resteasy.object.status[key] = customStatus[key];
          });
        }

        debug(this.resteasy.object);

        // Handle delivery details
        if (this.resteasy.object.for_delivery) {
          debug('..delivery order')
          if (!this.resteasy.object.delivery_address_id) {
            logger.error('No delivery address provided',
              {
                fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
                role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, unit_id: unitId,
                error: 'No delivery address provided'
              });
            throw new Error('No delivery address provided', 422);
          }
          // Get and streamline address for display
          var addrDetails = '';
          try {
            addrDetails = (yield DeliveryAddress.getSingleAddress(this.resteasy.object.delivery_address_id))[0];
          } catch (err) {
            logger.error('Error getting delivery address',
              {
                fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
                role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, unit_id: unitId,
                delivery_address_id: this.resteasy.object.delivery_address_id, error: err
              });
            throw(err)
          }
          debug(addrDetails);
          var details = {
            nickname: addrDetails.nickname,
            address1: addrDetails.address1,
            address2: addrDetails.address2,
            city: addrDetails.city,
            state: addrDetails.state,
            phone: addrDetails.phone
          };
          debug(details);
          this.resteasy.object.delivery_address_details = details;

          // Set time to pickup up by delivery driver
          var deliveryTime = this.resteasy.object.desired_delivery_time;
          if (deliveryTime) {
            var pickup = '';
            try {
              pickup = yield calculateDeliveryPickup.call(this, this.resteasy.object.unit_id,
                this.resteasy.object.desired_delivery_time);
            } catch (err) {
              logger.error('Error calculating delivery pickup time',
                {
                  fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
                  role: this.passport.user.role, order_sys_order_id: osoId, company_id: coId, unit_id: unitId,
                  delivery_address_id: this.resteasy.object.delivery_address_id,
                  delivery_time: deliveryTime, error: err
                });
              throw (err);
            }
            this.resteasy.object.desired_pickup_time = pickup;
          }
        }

      // Ready to save
      debug(this.resteasy.object);
      console.log(this.resteasy.object);
      debug('...preprocessing complete. Ready to save');
    }

  } else if (this.resteasy.operation == 'update') {
    if (this.resteasy.object.cod_payment_option) {
      var order = yield OrderHistory.getSingle(this.params.id);

      if (order.context !== 'cod'){
        throw new Error('Order is not in cod context');
      }

      var paymentOption = this.resteasy.object.cod_payment_option;

      if (paymentOption !== 'cash' && paymentOption !== 'credit') {
        throw new Error("Valid payment options are 'cash' and 'credit'");
      }
      this.resteasy.object.cod_payment_option = undefined;

      var currentStatus = order.status;
      currentStatus.cod_payment_option = paymentOption;

      this.resteasy.object.status = currentStatus;
    }

    debug('...update')
    debug('...limit payload elements')
    try {
      // this will modify this.resteasy.object
      yield payload.limitOrderHistPayloadForPut.call(this, this.resteasy.object)
    } catch (err) {
      logger.error('Error limiting order payload for PUT',
        {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
        role: this.passport.user.role, order_id: this.params.id, error: err});
      throw(err)
    }
    debug('..limited payload is..');
    debug(this.resteasy.object);
    if (this.resteasy.object.status && typeof(this.resteasy.object.status) !== 'object') { //meaning it's a processed update on the status, no extra work is required
      var newStat = this.resteasy.object.status;
      debug('..status sent is '+ newStat)
      logger.info('PUT includes a status update ',
        {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
        role: this.passport.user.role, order_id: this.params.id, new_status: newStat});
      try {
        var savedStatus = (yield OrderHistory.getStatus(this.params.id))[0]
      } catch (err) {
        logger.error('Error getting prior order status',
          {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
          role: this.passport.user.role, order_sys_order_id: osoId,
          new_status: this.resteasy.object.status,
          delivery_time: deliveryTime, error: 'Error getting prior order status'});
        throw(err)
      }
      debug (savedStatus)
      logger.info('Got previous statuses',
        {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
        role: this.passport.user.role, order_id: this.params.id, new_status: newStat});
      if (!savedStatus.status[newStat]) {
        // add subsequent state
        savedStatus.status[newStat] = ''
      } // else previously set
      debug(savedStatus)
      this.resteasy.object.status = savedStatus.status;
    } else {
      debug('...not a status update')
      logger.info('PUT does not involve a status update '+ unitId,
        {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
        role: this.passport.user.role, order_sys_order_id: osoId});
      console.log(this.resteasy.object.status);
    }
  }
  logger.info('Pre-flight for order save completed '+ unitId,
    {fn: 'beforeSaveOrderHistory', user_id: this.passport.user.id,
    role: this.passport.user.role, order_sys_order_id: osoId});
  debug('returning from beforeSaveOrderHistory');
}

function shouldNotify(orderHistory) {
  return orderHistory.context !== 'prepay';
}

function *afterCreateOrderHistory(orderHistory) {
  if (!shouldNotify(orderHistory)) {
    return;
  }

  debug('afterCreateOrderHistory')
  debug(orderHistory);
  logger.info('afterCreateOrderHistory');
  var meta = {fn: 'afterCreateOrderHistory',user_id: this.passport.user.id,role: this.passport.user.role}
  meta.order_id = orderHistory.id;
  meta.company_id = orderHistory.company_id;
  meta.unit_id = orderHistory.unit_id;
  meta.customer_id = orderHistory.customer_id;
  var osoId = orderHistory.order_sys_order_id;
  meta.order_sys_order_id = osoId;
  var lang = this.passport.user.default_language;
  debug('language: '+ lang)
  meta.lang = lang;

  logger.info('Post order creation processing started for order '+ orderHistory.id, meta);
  var unit = '';
  try {
    unit = (yield Unit.getSingleUnit(orderHistory.unit_id))[0];
  } catch (err) {
    meta.error = err;
    logger.error('Error retrieving unit', meta);
    throw err;
  }
  debug(unit);
  if (!unit.gcm_id && !unit.fcm_id) {
    return;
    // meta.error = 'No fcm/gcm for unit';
    // logger.error('No fcm/gcm id for unit ', orderHistory.unit_id, meta);
    // throw new Error ('No fcm/gcm id for unit '+ unit.name +' ('+ unit.id +'). Cannot notify')
  }

  var customer = '';
  try {
    customer = (yield Customer.getSingleCustomer(orderHistory.customer_id))[0];
  } catch (err) {
    meta.error = err;
    logger.error('Error retrieving customer', meta);
    throw err;
  }
  debug(customer);

  var orderDetail = JSON.stringify(orderHistory.order_detail, null, 2);
  debug(orderDetail);
  var custName = this.passport.user.first_name +' '+ this.passport.user.last_name.charAt(0);
  var msg = '';
  var title = '';

  logger.info('Translating message', meta)
  if (orderHistory.for_delivery) {
    var deliverytime = orderHistory.desired_delivery_time.toISOString();
    title = translator.translate(lang,"orderRequested_delivery");
    msg = translator.translate(lang,"orderRequested_deliveryMessage", deliverytime, custName, orderDetail);
  } else {
    var pickuptime = orderHistory.desired_pickup_time.toISOString();
    title = translator.translate(lang,"orderRequested_pickup");
    msg = translator.translate(lang,"orderRequested_pickupMessage", pickuptime, custName, orderDetail);
  }

  debug('msg');
  debug(msg);
  var msgTarget = {
    to     : 'unit',
    toId   : unit.id,
    gcmId  : unit.gcm_id,
    fcmId  : unit.fcm_id,
    title  : title,
    message : msg,
    body : msg,
    status : "order_requested"
  }

  if (unit.apns_id)
    msgTarget.os = 'ios';
  else
    msgTarget.os = 'android';


  debug('sending notification to unit '+ unit.id);
  debug(meta);
  var mm = meta;
  debug(mm);
  mm.message = msg;
  debug(mm);
  logger.info('sending notification to unit '+ unit.id, mm);

  var orderNum = orderHistory.order_sys_order_id;
  orderNum = orderNum.substring(orderNum.length-4);
  yield push.notifyOrderUpdated(orderNum, msgTarget)
  debug('..returned from notifying')

  logger.info('Unit '+ unit.id +' notified of order '+ orderNum, meta);
  debug(timestamp.now());
  var hash = {
    status : {
      order_requested: timestamp.now()
    }
  }

  var orderKeys = Object.keys(orderHistory.status);
  if (orderKeys.length > 1) {
    orderKeys.forEach(function (key) {
        if (key !== 'order_requested')
          hash.status[key] = orderHistory.status[key];
    });
  }

  console.log(hash);

  this.resteasy.queries.push(
    this.resteasy.transaction.table('order_history').where('order_history.id', orderHistory.id).update(hash)
  );
  logger.info('Post order creation processing completed for order '+ orderHistory.id, meta);
}

var display = {
  order_requested  : 'was requested',
  order_declined   : 'was rejected',
  order_accepted   : 'was accepted',
  pay_fail         : 'payment failed',
  order_in_queue   : 'is in queue',
  order_cooking    : 'is cooking',
  order_ready      : 'is ready',
  order_picked_up  : 'was picked up',
  no_show          : ': customer was no show',
  order_dispatched : 'was dispatched',
  order_delivered  : 'was delivered'
}

function *afterUpdateOrderHistory(orderHistory) {
  debug('afterUpdateOrderHistory')
  var meta = {fn: 'afterUpdateOrderHistory',user_id: this.passport.user.id,role: this.passport.user.role}
  meta.order_id = orderHistory.id;
  meta.company_id = orderHistory.company_id;
  meta.unit_id = orderHistory.unit_id;
  meta.customer_id = orderHistory.customer_id;
  var osoId = orderHistory.order_sys_order_id;
  meta.order_sys_order_id = osoId;
  meta.status = orderHistory.status;
  var lang = this.passport.user.default_language;
  meta.lang = lang;
  logger.info('Post order update processing started for order '+ orderHistory.id, meta);
  var deviceId = ''
  var title = ''
  var orderHistoryStatus = orderHistory.status
  debug(orderHistoryStatus)
  var keys = Object.keys(orderHistoryStatus)
  debug("...number of entries= "+ keys.length)
  var updated = false
  var orderAccepted;

  var customer ='';
  try {
    customer = (yield Customer.getSingleCustomer(orderHistory.customer_id))[0];
  } catch (err) {
    var ce = meta;
    ce.error = err;
    logger.error('Error retrieving customer ', orderHistory.customer_id, ce);
    throw err;
  }
  debug(customer);

  var notify = true;

  if (!customer.gcmId && !customer.fcmId){
    notify = false;
    updated = true;
    console.log("=====================********************")
  }

  for (var i = 0; i < keys.length; i++) {
    debug(' name=' + keys[i] + ' value=' + orderHistoryStatus[keys[i]]);
    if (!orderHistoryStatus[keys[i]]) { // notification not yet sent
      var status = keys[i]
      logger.info('Notification not yet sent for status '+status+' for order '+ orderHistory.id, meta);
      debug('...status '+ status)
      var user ='';
      try {
        user = (yield User.getSingleUser(customer.user_id))[0];
      } catch (err) {
        var ue = meta;
        ue.error = err;
        logger.error('Error retrieving user ', customer.user_id, ue);
        throw err;
      }
      debug(user);
      var company = '';
      try {
        company = (yield Company.getSingleCompany(orderHistory.company_id))[0];
      } catch (err) {
        var coe = meta;
        coe.error = err;
        logger.error('Error retrieving company ', orderHistory.company_id, coe);
        throw err;
      }
      debug(company);
      var msgTarget = { order_id : orderHistory.id }
      if (status == 'order_paid' || status == 'pay_fail') {
        debug('...status update from customer. Notify unit');
        logger.info('Customer order update. Notify unit', meta);
        // get unit
        try {
          var unit = (yield Unit.getSingleUnit(orderHistory.unit_id))[0];
        } catch (err) {
          var eru = meta;
          eru.error = err;
          logger.error('Error retrieving unit ', orderHistory.unit_id, eru);
          throw err;
        }
        debug('..Unit gcm id is '+ unit.gcm_id)
        msgTarget.to = 'unit'
        msgTarget.toId = unit.id

        if (unit.apns_id)
          msgTarget.os = 'ios';
        else
          msgTarget.os = 'android';

        msgTarget.gcmId = unit.gcm_id
        msgTarget.fcmId = unit.fcm_id
        if (status == 'order_paid') {
          logger.info('order paid status processing');
          orderAccepted = yield afterOrderPaid(orderHistory, this.passport, user, customer, company, this.resteasy.knex);
        }
      } else {
        debug('...status update from unit. Notify customer '+ orderHistory.customer_id);
        logger.info('Unit order update. Notify customer', meta);
        // get customer device id
        debug('..Customer gcm id is '+ customer.gcm_id)
        msgTarget.to = 'customer';
        msgTarget.toId = customer.id;

        if (customer.apns_id)
          msgTarget.os = 'ios';
        else
          msgTarget.os = 'android';

        msgTarget.gcmId = customer.gcm_id;
        msgTarget.fcmId = customer.fcm_id;
      }

      var orderNum = osoId;
      orderNum = orderNum.substring(orderNum.length-4);
      debug('..order number '+ orderNum);
      var custName = user.first_name +' '+ user.last_name.charAt(0);
      debug(custName);
      debug(status);
      switch(status) {
          // From Customer
          case 'order_paid':
              msgTarget.title = translator.translate(lang, "payProcessed", orderNum);//"Payment Processed - Order #"+ orderNum;
              msgTarget.message = translator.translate(lang, "payProcessedMessage", custName, timestamp.now());//custName +"'s payment
              break;
          case 'pay_fail':
              msgTarget.title = translator.translate(lang, "payFailed", orderNum);//"Payment Failed - Order #"+ orderNum;
              msgTarget.message = translator.translate(lang, "payFailedMessage", custName, timestamp.now());//"custName +" payment failed at "+ timestamp.now();
              break;
          // From Unit
          case 'order_declined':
              msgTarget.title = translator.translate(lang, "orderDeclined");//"Order Declined;
              msgTarget.message = translator.translate(lang, "orderDeclinedMessage", company.name);//"company.name +" did not accept your order at this time. Please try again some other time.";
              break;
          case 'order_accepted':
              msgTarget.title = translator.translate(lang, "orderAccepted");//"Order Accepted";
              msgTarget.message =  translator.translate(lang, "orderAcceptedMessage", timestamp.now());//"Order accepted at "+ timestamp.now();
              break;
          case 'order_in_queue':
              msgTarget.title = translator.translate(lang, "orderQueued");//"Order In Queue";
              msgTarget.message = translator.translate(lang, "orderQueuedMessage", orderNum);//Your order #"+ orderNum +" is queued for preparation";
              break;
          case 'order_cooking':
              msgTarget.title = translator.translate(lang, "orderCooking");//"Order Cooking";
              msgTarget.message = translator.translate(lang, "orderCookingMessage", orderNum);//"Your order #"+ orderNum +" started cooking";
              break;
          case 'order_ready':
              msgTarget.title = translator.translate(lang, "orderReady");//"Order Ready";
              msgTarget.message = translator.translate(lang, "orderReadyMessage", orderNum); //Your order #"+ orderNum +" is ready!";
              break;
          case 'order_picked_up':
              msgTarget.title = translator.translate(lang, "orderPickedUp");//"Order Picked Up";
              msgTarget.message = translator.translate(lang, "orderPickedUpMessage", orderNum);// "Your order #"+ orderNum +" was picked up!";
              break;
          case 'no_show':
              msgTarget.title = translator.translate(lang, "NoShow");//"No Show";
              msgTarget.message = translator.translate(lang, "NoShowMessage", orderNum);//"Your order #"+ orderNum +" was not picked up! Did you forget?";
              break;
          case 'order_dispatched':
              msgTarget.title = translator.translate(lang, "orderDispatched");//"Order Dispatched";
              msgTarget.message = translator.translate(lang, "orderDispatchedMessage", orderNum);//"Your order #"+ orderNum +" is on its way!";
              break;
          case 'order_delivered':
              msgTarget.title = translator.translate(lang, "orderDelivered");//"Order Delivered";
              msgTarget.message = translator.translate(lang, "orderDeliveredMessage", orderNum);//"Your order #"+ orderNum +" was delivered. Thanks again!";
              break;
          default:
            console.log(status);
            if (status !== 'cod_payment_option') {
              var eso = meta;
              eso.error = 'Unknown status for order ';
              logger.error('Unknown status for order ', fge);
              throw new Error ('Unknown status '+ status +' for order #'+ orderHistory.id)
            }
            else {
              notify = false;
            }

      }

      if (notify) {
        msgTarget.body = msgTarget.message;
        msgTarget.status = status;
        debug(msgTarget);
        var msgTime = timestamp.now();
        var supplemental = {};
        supplemental.unit_id = ''+ orderHistory.unit_id;
        supplemental.company_id = ''+ orderHistory.company_id;
        supplemental.order_sys_order_id = orderHistory.order_sys_order_id;
        supplemental.order_id = ''+ orderHistory.id;
        supplemental.time_stamp = msgTime;
        supplemental.status = status;

        supplemental.payload = yield addCloudPushSupport(msgTarget,supplemental);
        msgTarget.data = supplemental;

        debug(msgTarget);
        debug('sending notification to '+ msgTarget.to +' ('+ msgTarget.toId +')');


        var mt = meta;
        mt.message_payload = msgTarget.message;

        logger.info('sending notification to unit '+ orderHistory.unit_id, mt);

        yield push.notifyOrderUpdated(orderNum, msgTarget);

        logger.info(msgTarget.to +' notified of order '+ orderHistory.id, meta);

        debug('..returned from notifying');

        // record notification time
      }

      orderHistoryStatus[keys[i]] = timestamp.now();
      debug(orderHistoryStatus);

      updated = true;

      // grant loyalty points
      if (status == 'order_paid') {
        var priorBalance = (yield Loyalty.getPointBalance(orderHistory.customer_id, orderHistory.company_id))[0];
        if (!priorBalance) {
          logger.info('creating new loyalty points record for customer ' + orderHistory.customer_id + ' at company ' + orderHistory.company_id);
          var initBalance = '1';
          var newLoyalty = (yield Loyalty.createNew(orderHistory.customer_id, orderHistory.company_id, initBalance))[0];
          debug(newLoyalty);
        } else {
          debug(priorBalance);
          logger.info('incrementing loyalty points for customer ' + orderHistory.customer_id + ' at company ' + orderHistory.company_id);

          var priorBalValue = parseInt(priorBalance.balance);
          var updatedBalValue = priorBalValue + 1;
          var isEligible_five = false;
          var isEligible_ten = false;
          var isEligible_fifteen = false;
          if (updatedBalValue >= 5) {
            isEligible_five = true;
          }
          if (updatedBalValue >= 10) {
            isEligible_ten = true;
          }
          if (updatedBalValue >= 15) {
            isEligible_fifteen = true;
          }
          var incrementedLoyalty = {
            balance: updatedBalValue,
            eligible_five: isEligible_five,
            eligible_ten: isEligible_ten,
            eligible_fifteen: isEligible_fifteen,
            updated_at: this.resteasy.knex.fn.now()
          };

          this.resteasy.queries.push(
            this.resteasy.transaction.table('loyalty').where('loyalty.id', priorBalance.id).update(incrementedLoyalty)
          );
        }
      }
    }
  }
  if (updated) {
    if (orderAccepted) {
      orderHistoryStatus.order_accepted = orderAccepted;
    }
    debug(orderHistoryStatus)
    console.log('=========================+>UPDATING STATUS')
    this.resteasy.queries.push(
      this.resteasy.transaction.table('order_history').where('order_history.id', orderHistory.id).update({ status: orderHistoryStatus})
    );
  }
  logger.info('Post order update processing completed for order '+ orderHistory.id, meta);
}

function *beforeSaveReview() {
  logger.info('Before save Review - check reviewer and answers',{fn:'beforeSaveReview'});
  debug('beforeSaveReview: user is ')
  debug(this.passport.user)
  // Get the user's first name and initial of last name for the reviewer_name field.
  // The code also handles cases where only a first name or only a last name is provided.
  // Must have either defined, else a 403 Forbidden is returned, without saving the review.
  var firstName = '';
  var lastName = '';
  var separator = '';
  var initialLast = '';
  if (this.passport.user.first_name) {
    firstName = this.passport.user.first_name.trim();
  }
  if (this.passport.user.last_name) {
    lastName = this.passport.user.last_name.trim();
    if (lastName.length > 0) {
      initialLast = lastName.charAt(0) + '.';
    }
  }
  if (firstName == '' && lastName == '') {
    logger.error('Save review rejected because a first name or last name is not defined in user account',{fn:'beforeSaveReview',first_name:firstName,last_name:lastName});
    this.throw('Save review rejected because a first name or last name is not defined in user account',403);
  } else if (firstName.length >= 1 && initialLast.length >=1) {
    separator = ' ';
  }
  this.resteasy.object.reviewer_name = firstName + separator + initialLast;

  var answersField = this.resteasy.object.answers;
  if (answersField) {
    var answers = answersField.answers;

    if (answers && answers.length) {
      debug('answers length: ' + answers.length);
      var total = 0.0;
      for (var i = 0; i < answers.length; i++) {
        total += answers[i].answer;
      }
      this.resteasy.object.rating = total / answers.length;
      debug('Review rating calculated as: ' + total);
    } else {
      logger.info('Review rating not calculated - unexpected answers value',{fn:'beforeSaveReview', answers:answers});
    }
  } else {
    logger.info('Review rating not calculated - answersField is null',{fn:'beforeSaveReview'});
  }
  logger.info('Ready to save Review',{fn:'beforeSaveReview'});
}


function *beforeSaveCustomer(){
  debug('beforeSaveCustomer');
  var meta = {fn: 'beforeSaveCustomer',user_id: this.passport.user.id, role: this.passport.user.role,
    target_user_id: this.params.id}

  logger.info('Before Save customer', meta);
  if (this.resteasy.operation == 'update') {
    // If APNS id provided, retrieve and set GCM id
    if (this.resteasy.object.apns_id) {
      var gcmId = '';
      try {
        gcmId = yield push.importAPNS.call(this,this.resteasy.object.apns_id);
        debug('got here')
      } catch (err) {
        debug(err);
        meta.error = err;
        logger.error('Error sending APNS token to GCM', meta);
        throw err;
      }
      // Set Customer's gcm to that mapped to the apns token just pushed to Google
      debug('Setting GCM id');
      this.resteasy.object.gcm_id = gcmId;
      meta.gcm_id = gcmId;
      meta.apns_id = this.resteasy.object.apns_id;
      debug('APNS and GCM ids set');
      logger.info('Customer\'s GCM mapped', meta);
    }

    // If username or password is changed, we need to update the Users table
    var username = this.resteasy.object.username;
    var password = this.resteasy.object.password;
    if (username || password) {
    // Username and/or password was changed
      if (!this.params.id) {
        var noIdErr = 'No customer id provided. Update operation requires customer id';
        meta.error = noIdErr;
        logger.error('No customer id provided', meta);
        throw new Error(noIdErr);
      }
      var customer = '';
      try {
        customer = (yield Customer.getSingleCustomer(this.params.id))[0];
      } catch (err) {
        meta.error = err;
        logger.error('Error getting existing Customer', meta);
        throw err;
      }
      debug('..customer');
      debug(customer);
      var user = '';
      try {
        user = (yield User.getSingleUser(customer.user_id))[0];
      } catch (err) {
        meta.error = err;
        logger.error('Error getting existing user', meta);
        throw err;
      }
      debug('..customer');
      debug(user);
      var userHash = {};
      if (username) {
        userHash.username = username;
        delete this.resteasy.object.username;
      }
      if (password) {
        userHash.password = password;
        delete this.resteasy.object.password;
      }
      debug('..updating customer');
      try {
        user = (yield User.updateUser(user.id, userHash))[0];
      } catch (err) {
        meta.error = err;
        logger.error('Error updating user', meta);
        throw err;
      }
      logger.info('Customer updated', meta);
      debug('..customer after update');
      debug(user);
    }
  }
  logger.info('Ready to save Customer', meta);
}

function * beforeSaveFoodpark() {
  logger.info('Starting update of existing Foodpark', meta);
  debug('..starting update of existing Foodpark');

  if (this.resteasy.object.apns_id) {
    meta.apns_id = this.resteasy.object.apns_id;
    var gcmId = '';
    try {
      gcmId = yield push.importAPNS.call(this,this.resteasy.object.apns_id);
    } catch (err) {
      meta.error = err;
      logger.error('Error sending APNS token to GCM', meta);
      throw err;
    }
    this.resteasy.object.gcm_id = gcmId;
    meta.gcm_id = gcmId;
    logger.info('Foodpark\'s GCM mapped', meta);
  }

  logger.info('Ready to update Foodpark', meta);
}

function *beforeSaveUnit() {
  debug('beforeSaveUnit');
  var meta = {fn: 'beforeSaveUnit', user_id: this.passport.user.id,
        role: this.passport.user.role, unit_id: this.params.id, context:this.params.context};
  logger.info('Before Save Unit - validate unit information',meta);
  if (!this.resteasy.object){ // Not sure what this is checking
    logger.error('No Unit information provided', meta);
    throw new Error('No Unit information provided',422);
  }
  // If username or password is changed, we need to update the Users table
  var username = this.resteasy.object.username;
  var password = this.resteasy.object.password;
  var countryId = this.resteasy.object.country_id;
  if (this.resteasy.operation == 'create') {
    logger.info('Starting create of new Unit',meta);
    debug('..starting create of new Unit');
    // get the company context
    debug('..getting company')
    var companyId = '';
    if (this.params.context && (m = this.params.context.match(/companies\/(\d+)$/))) {
      debug('..company '+ m[1]);
      companyId = m[1];
    } else {
      // no company context is an error
      meta.error = 'No company context for unit';
      logger.error('No company context for unit', meta);
      throw new Error ('No company context for unit', 422)
    }
    if (!username || !password) {
      // need both to create new User and Unit
      logger.error('Username/password are required', meta);
      throw new Error ('Username/password are required', 422);
    }
    // make sure it's a unique username
    var existingUser = '';
    try {
      existingUser = (yield User.userForUsername(username))[0];
    } catch (err) {
      meta.error = err;
      logger.error('Error during User creation', meta);
      throw err;
    }
    debug('..user exists for username '+ username +'? Yes: user details; No: undefined');
    debug(existingUser)
    if (existingUser) {
      meta.error = 'Name must be unique';
      logger.error('Tried to create unit with duplicate name. Name must be unique within Unit/User tables.', meta);
      throw new Error('That name already exists. Try another name', 422);
    }

    var unitmgr = { role: 'UNITMGR', username: username, password: password, country_id: (countryId ? countryId : 1)};
    var user = '';
    try {
      user = (yield User.createOrUpdateUser(unitmgr))[0];
    } catch (err) {
      meta.error = err;
      logger.error('Error creating User-UnitMgr', meta);
      throw err;
    }
    debug('..user created');
    debug(user);
    this.resteasy.object.unit_mgr_id = user.id;
    this.resteasy.object.company_id = parseInt(companyId);

    //get the territory's currency
    var currency='';
    var currencyId='';
    var currency_symbol='';
    try{
      var company = (yield Company.getSingleCompany(this.resteasy.object.company_id))[0];
      if (company){
        var currencyObject=(yield this.resteasy.knex('countries')
            .select('currency', 'currency_id', 'currency_symbol')
            .where('id', company.country_id))[0];
        if (currencyObject){
          currency=currencyObject.currency;
          currencyId=currencyObject.currency_id;
          currency_symbol=currencyObject.currency_symbol;
        }
      }
    } catch (err) {
      meta.error = err;
      logger.error('Error retrieving country currency', meta);
      throw err;
    }
    meta.currency=currency;
    meta.currencyId=currencyId;
    meta.currency_symbol=currency_symbol;
    if (currency){
      this.resteasy.object.currency=currency;
    }
    if (currencyId){
      this.resteasy.object.currency_id=currencyId;
    }
    if (currency_symbol){
      this.resteasy.object.currency_symbol=currency_symbol;
    }
    debug('..ready to create unit');
    debug(this.resteasy.object);
    meta.company_id = companyId;
    logger.info('Unit Manager created, ready to create Unit', meta);
  } else if (this.resteasy.operation == 'update') {
    logger.info('Starting update of existing Unit', meta);
    debug('..starting update of existing Unit');
     // If APNS id provided, retrieve and set GCM id
    if (this.resteasy.object.apns_id) {
      meta.apns_id = this.resteasy.object.apns_id;
      var gcmId = '';
      try {
        gcmId = yield push.importAPNS.call(this,this.resteasy.object.apns_id);
      } catch (err) {
        meta.error = err;
        logger.error('Error sending APNS token to GCM', meta);
        throw err;
      }
      // Set Unit's gcm to that mapped to the apns token just pushed to Google
      this.resteasy.object.gcm_id = gcmId;
      meta.gcm_id = gcmId;
      logger.info('Unit\'s GCM mapped', meta);
    }
    // This block of code checks to see if username/password, if provided,
    // was/were changed. If so, update User.
    if (username || password) {
      var unitId = this.params.id;
      if (!unitId) {
        var noUnitIdErr = 'No unit id provided. Update operation requires unit id';
        meta.error = noUnitIdErr;
        logger.error('No unit id provided', meta);
        throw new Error(noUnitIdErr, 422);
      }
      var unit = '';
      try {
        unit = (yield Unit.getSingleUnit(this.params.id))[0];
      } catch (err) {
        meta.error = err;
        logger.error('Error getting existing unit', meta);
        throw err;
      }
      debug('..unit');
      debug(unit);
      if (username && username != unit.username || password && password != unit.password) {
        // username or password was changed
        var user = '';
        try {
          user = (yield User.getSingleUser(unit.unit_mgr_id))[0];
        } catch (err) {
          meta.error = err;
          logger.error('Error getting existing user', meta);
          throw err;
        }
        debug('..user');
        debug(user);
        var userHash = {};
        if (username) userHash.username = username;
        if (password) userHash.password = password;
        debug('..updating user');
        try {
          user = (yield User.updateUser(user.id, userHash))[0];
        } catch (err) {
          meta.error = err;
          logger.error('Error updating user', meta);
          throw err;
        }
        debug('..user after update');
        debug(user);
        meta.unit_mgr_id = user.id;
        logger.info('Unit Manager updated', meta);

      }
    }
    if (this.resteasy.object.territory_id){
      logger.info('unit territory changed - finding new currency and updating driver territories');
      meta.territoryId=this.resteasy.object.territory_id;
      //get the territory's currency
      var currency='';
      var currencyId='';
      try{
        var territory = (yield Territories.getSingleTerritory(this.resteasy.object.territory_id))[0];
        if (territory){
          var currencyObject=(yield this.resteasy.knex('countries').select('currency','currency_id').where('id',territory.country_id))[0];
          if (currencyObject){
            currency=currencyObject.currency;
            currencyId=currencyObject.currency_id;
          }
        }
      } catch (err) {
        meta.error = err;
        logger.error('Error retrieving country currency', meta);
        throw err;
      }
      meta.currency=currency;
      meta.currencyId=currencyId;
      if (currency){
        this.resteasy.object.currency=currency;
      }
      if (currencyId){
        this.resteasy.object.currency_id=currencyId;
      }
       logger.info('unit currency will be updated', meta);

      //Updating teritory Id
       var unitId = this.params.id;

        if (!unitId) {
          var noUnitIdErr = 'No unit id provided. Update operation requires unit id';
          meta.error = noUnitIdErr;
          logger.error('No unit id provided', meta);
          throw new Error(noUnitIdErr, 422);
        }
        var unit = '';
        try {
          unit = (yield Unit.getSingleUnit(this.params.id))[0];
        } catch (err) {
          meta.error = err;
          logger.error('Error getting existing unit', meta);
          throw err;
        }
        var drivers = '';
        var user_ids = [];

        try {
          drivers = (yield Driver.getDriversForUnit(this.params.id));

          if(drivers.length > 0){
            drivers.forEach(function(value){
              if(value.id !== null)
                user_ids.push(value.id);
            });
          }

        } catch (err) {
          meta.error = err;
          logger.error('Error getting existing unit', meta);
          throw err;
        }

        if(user_ids.length > 0){
          userHash = {};
          userHash.territory_id = this.resteasy.object.territory_id;
          userHash.country_id = territory.country_id;

         var user = '';
          try {
            user = (yield User.updateUserByIds(user_ids,userHash));
          } catch (err) {
            meta.error = err;
            logger.error('Error getting existing user', meta);
            throw err;
          }
        }

        logger.info('driver territories updated', meta);

      //Updating teritory Id
    }
    logger.info('Ready to update Unit', meta);
  }
}

function *beforeSaveCompanies() {
  var meta = { fn: 'beforeSaveCompanies'}
  logger.info('Before company saved',meta);
  debug('beforeSaveCompanies');
  if (!this.params.id){
    meta.error = 'No company id provided';
    logger.error('No company provided', meta);
    throw new Error ('No company provided',422);
  }
  debug(this.resteasy.object);
  debug(this.params);
  meta.company_id = this.params.id;
  if (this.resteasy.operation == 'update') {
    logger.info('Before company updated - limit payload', meta);
    debug('...update');
    debug('...limit payload elements');
    try {
      // this will modify this.resteasy.object
      yield payload.limitCompanyPayloadForPut.call(this, this.resteasy.object)
    } catch (err) {
      meta.error = err;
      logger.error('Unable to limit payload elements', meta);
      throw(err)
    }
    logger.info('Before company updated - get existing company', meta);
    var company = (yield Company.getSingleCompany(this.params.id))[0];
    if (!company){
      meta.error = "No company for company id "+ this.params.id;
      logger.error('No company exists with the provided id', meta);
      throw new Error('No company exists with the provided id',422);
    }
    debug('company '+ company.id);
    if (this.resteasy.object.delivery_chg_amount && company.delivery_chg_amount != this.resteasy.object.delivery_chg_amount) {
      meta.existing_delivery_chg_amt = company.delivery_chg_amount;
      meta.updated_delivery_chg_amt = this.resteasy.object.delivery_chg_amount;
      logger.info('Before company updated - update delivery charge amount', meta);
      var amount = this.resteasy.object.delivery_chg_amount;
      debug('..delivery charge amount has changed to '+ amount +'. Updating..')
      // Update moltin
      var item = '';
      var data = { price: amount};
      try{
          item = yield msc.updateMenuItem(company.delivery_chg_item_id, data)
      } catch (err) {
        meta.error = err;
        logger.error('Unable to update delivery charge in the ordering system', meta);
        throw new Error ('Error updating delivery charge in ordering system',422);
      }
      logger.info('Delivery charge updated', meta);
      debug('..delivery charge updated')
    }
    else{
      logger.info('No updates needed to company delivery charge amount', meta);
    }
  }
}

function *beforeSaveDriver() {
  meta={fn:'beforeSaveDriver'};
  logger.info('Before driver saved',meta);
  debug('beforeSaveDriver');
  if (!this.resteasy.object){
    meta.error='No driver provided';
    logger.error('No driver provided',meta);
    throw new Error ('No driver provided',422);
  }
  meta.name=this.resteasy.object.name;
  meta.phone=this.resteasy.object.phone;
  debug(meta.driver);
  debug(this.params);
  if (this.resteasy.operation == 'create') {
    logger.info('Before driver created - check for valid company context and unit',meta);
    debug('...create');
    debug('..getting company')
    var companyId = '';
    if (this.params.context && (m = this.params.context.match(/companies\/(\d+)/))) {
      debug('..company '+ m[1]);
      companyId = m[1];
      meta.company_id=companyId;
    } else {
      meta.error='No company context for driver';
      // no company context is an error
      logger.error('No company context for driver',meta);
      throw new Error ('No company context for driver',422);
    }
    var unitId = '';
    if (this.params.context && (n = this.params.context.match(/units\/(\d+)$/))) {
      debug('..unit '+ n[1]);
      unitId = n[1];
      meta.unit_id=unitId;
    } else {
      // no unit context is an error
      meta.error='No unit context for driver';
      logger.error('No unit context for driver',meta);
      throw new Error ('No unit context for driver',422);
    }
    var userId=this.resteasy.object.user_id;
    var createUser=this.resteasy.object.user;
    if (userId){
      debug('..userId' + userId);
      meta.user_id=userId;
      var existingUser='';
      try{
        existingUser = (yield User.getSingleUser(userId))[0]
      } catch (err) {
        meta.error=err;
        logger.error('Error during Driver creation', meta);
        throw err;
      }
      if (!existingUser){
        meta.error = 'Provided User ID did not match an existing User';
        logger.error('Provided User ID did not match an existing User', meta);
        throw new Error('Provided User ID did not match an existing User', 422);
      }
    }
    else if (createUser){
      debug('..user' + createUser);
      var driver={ role: 'DRIVER', first_name:this.resteasy.object.name, last_name:createUser.last_name, username:createUser.username, password:createUser.password, territory_id:createUser.territory_id, phone:createUser.phone };
      delete this.resteasy.object.user; //remove user object from the main objectbecause it's not a real domian field
      var newUser='';
      try{
        newUser = (yield User.createOrUpdateUser(driver))[0];
      }
      catch (err) {
        meta.error=err;
        logger.error('Error creating User-Driver', {meta});
        throw err;
      }
      meta.user_id=newUser.id;
      debug('..user created');
      this.resteasy.object.user_id = newUser.id;
      debug(newUser);
    }

    this.resteasy.object.company_id = companyId;
    this.resteasy.object.unit_id = unitId;

    logger.info('Driver will be created',meta);
  }
}

function *beforeSaveLoyaltyRewards() {
  logger.info('Before loyalty rewards saved',{fn:'beforeSaveLoyaltyRewards'});
  debug('beforeSaveLoyaltyRewards');
  if (this.resteasy.operation == 'create') {
    logger.info('Before loyalty rewards created - check for existing company context',{fn:'beforeSaveLoyaltyRewards'});
    if (this.params.context && (m = this.params.context.match(/companies\/(\d+)$/))) {
      var coId = m[1];
      debug('..company id '+ coId);
      var exists = (yield LoyaltyRewards.isCompanyFound(coId))[0];
      debug('..LoyaltyRewards.isCompanyFound: ')
      debug(exists);
      // if vendor already has loyalty rewards defined for their company ID, do not allow a second set to be saved.
      if (exists) {
        logger.error('Company has existing rewards defined',{fn:'beforeSaveLoyaltyRewards',company_id:coId});
        this.throw('Company has existing rewards defined. Use PUT/PATCH to modify.',405);
      }
      this.resteasy.object.company_id = coId;
      logger.info('Loyalty rewards will be created for company',{fn:'beforeSaveLoyaltyRewards',company_id:this.resteasy.object.company_id});
    } else {
      logger.error('No company context found for loyalty rewards',{fn:'beforeSaveLoyaltyRewards',error:'No company context found for loyalty rewards'});
      this.throw('No company context found for loyalty rewards',422);
    }
  }
}

function *beforeSaveUser() {
  logger.info('Before User saved - encrypt password',{fn:'beforeSaveUser',params:this.params});
  if (!this.params || !this.params.id){
    logger.error('No user id provided',{fn:'beforeSaveUser',params:this.params,error:'No user id provided'});
    throw new Error('No user id provided', 422);
  }
  debug('beforeSaveUser');
  if (this.passport.user.role!='ADMIN' && this.passport.user.id != this.params.id) {
    logger.error('Logged-in user id does not match param user id',{fn:'beforeSaveUser',loggedIn_user_id:this.passport.user.id,param_user_id:this.params.id,error:'Param id does not match logged-in user credentials'});
    throw new Error('Param id does not match logged-in user credentials', 422);
  }
  var password = this.resteasy.object.password;
  debug(password);
  if (password) {
    try{
      this.resteasy.object.password = User.encryptPassword(password);
      logger.info('Password encrypted',{fn:'beforeSaveUser',param_user_id:this.params.id});
      debug(this.resteasy.object);
    }
    catch (err){
      logger.error('Unable to encrypt user password',{fn:'beforeSaveUser',param_user_id:this.params.id,error:err});
      throw err;
    }
  }
}

function *afterUpdateUnit(unit){
   meta={fn:'afterUpdateUnit'};
   logger.info('After Unit updated - check for delivery charge amount change', meta);
  if (this.resteasy.object.delivery_chg_amount){
      logger.info('unit delivery charge amount changed - updating company');
      //also update the companies table
      meta.deliveryChgAmount=this.resteasy.object.delivery_chg_amount;
      var chargeAmt=this.resteasy.object.delivery_chg_amount;

      //get unit by id
      var unitId = this.params.id;

      if (!unitId) {
         var noUnitIdErr = 'No unit id provided. Update operation requires unit id';
         meta.error = noUnitIdErr;
         logger.error('No unit id provided', meta);
         throw new Error(noUnitIdErr, 422);
      }
      var unit = '';
      try {
        unit = (yield Unit.getSingleUnit(this.params.id))[0];
      } catch (err) {
         meta.error = err;
         logger.error('Error getting existing unit', meta);
         throw err;
      }

      //update company by company id
      meta.companyId=unit.company_id;

      try{
        (yield this.resteasy.knex('companies').update('delivery_chg_amount',chargeAmt).where('id',unit.company_id))[0];
      }
      catch (err) {
         meta.error = err;
         logger.error('Error updating company delivery charge', meta);
         throw err;
      }
      logger.info('company charge amount updated');
    }
}

function *afterUpdateTerritory(territory){
  meta={fn:'afterUpdateTerritory'};
  logger.info('After Territory updated - update units with currency', meta);
  if (!territory){
    meta.error='No Territory provided';
    logger.error('No Territory provided',meta);
    throw new Error('No Territory provided', 422);
  }
  meta.territory_id=territory.id;
  //get the territory's currency
  var currency='';
  var currencyId='';
  try{
    if (territory.country_id){
      var currencyObject=(yield this.resteasy.knex('countries').select('currency','currency_id').where('id',territory.country_id))[0];
      if (currencyObject){
        currency=currencyObject.currency;
        currencyId=currencyObject.currency_id;
      }
    }
  } catch (err) {
    meta.error = err;
    logger.error('Error retrieving country currency', meta);
    throw err;
  }
  meta.currency=currency;
  meta.currencyId=currencyId;
  if (currency || currencyId){
    try{
      (yield this.resteasy.knex('units').where('territory_id',territory.id).update({
        'currency':currency,
        'currency_id':currencyId
      }));
    }
    catch(err){
      meta.error=err;
      logger.error('Error save currency to units', meta);
      throw err;
    }
  }
}

function *afterCreateReview(review) {
  logger.info('After review created - add review approval record',{fn:'afterCreateReview',review:review});
  if (!review){
    logger.error('No Review provided',{fn:'afterCreateReview',error:'No Review provided'});
    throw new Error('No Review provided',422);
  }
  try{
    var reviewApproval = { review_id: review.id, status: 'New', updated_at: this.resteasy.knex.fn.now(), created_at: this.resteasy.knex.fn.now() };

    this.resteasy.queries.push(
      this.resteasy.transaction.table('review_approvals')
        .insert(reviewApproval)
    );
    logger.info('Review approval record created',{fn:'afterCreateReview',review_id:review.id,reviewApproval:reviewApproval});
  }
  catch(err){
    logger.error('Unable to create review approval record',{fn:'afterCreateReview',review_id:review.id,error:err});
    throw err;
  }
}

function *afterCreateLoyaltyUsed(loyaltyUsed) {
  logger.info('afterCreateLoyaltyUsed - subtracting redeemed loyalty points for customer',{fn:'afterCreateLoyaltyUsed',loyaltyUsed:loyaltyUsed});
  if (!loyaltyUsed) {
    logger.error('Parameter loyaltyUsed must be defined', {fn:'afterCreateLoyaltyUsed',error:'Parameter loyaltyUsed must be defined'});
    throw new Error('Parameter loyaltyUsed must be defined');
  }
  var priorBalance = (yield Loyalty.getPointBalance(loyaltyUsed.customer_id, loyaltyUsed.company_id))[0];
  if (!priorBalance) {
    logger.error('Unable to get loyalty point balance for customer', {fn:'afterCreateLoyaltyUsed', customer_id:loyaltyUsed.customer_id, company:loyaltyUsed.company_id, error:'Unable to get loyalty point balance for customer'});
    throw new Error('Unable to get loyalty point balance for customer ' + loyaltyUsed.customer_id + ', company ' + loyaltyUsed.company_id);
  }
  var oldBal = parseInt(priorBalance.balance);
  var newBal = oldBal - parseInt(loyaltyUsed.amount_redeemed);
  var isEligible_five = false;
  var isEligible_ten = false;
  var isEligible_fifteen = false;
  if (newBal >= 5) {
    isEligible_five = true;
  }
  if (newBal >= 10) {
    isEligible_ten = true;
  }
  if (newBal >= 15) {
    isEligible_fifteen = true;
  }
  var updateLoyalty = {
    balance: newBal,
    eligible_five: isEligible_five,
    eligible_ten: isEligible_ten,
    eligible_fifteen: isEligible_fifteen,
    updated_at: this.resteasy.knex.fn.now()
  }
  try{
    debug(updateLoyalty);
    this.resteasy.queries.push(
      this.resteasy.transaction.table('loyalty').where('id', priorBalance.id)
        .update(updateLoyalty)
    );
    debug('afterCreateLoyaltyUsed success');
    logger.info('Loyalty point balance updated', {fn:'afterCreateLoyaltyUsed',customer_id:loyaltyUsed.customer_id,company_id:loyaltyUsed.company_id,priorBalanc_id:priorBalance.id,updateLoyalty:updateLoyalty});
  }
  catch (err){
    logger.error('Unable to update loyalty points',{fn:'afterCreateLoyaltyUsed',priorBalance_id:priorBalance.id,updatedLoyalty:updateLoyalty});
    throw err;
  }
}

function *addCloudPushSupport (target, supp) {
  var elements = {};
  elements.alert = target.message;
  elements.title= target.title;
  elements.icon = "push";
  if (target.os === 'ios')
    var payload = { aps: elements};
  else
    var payload = { android: elements};
  return payload;
}

function *afterOrderPaid(orderHistory, passport, user, customer, company, knex) {
  debug('afterOrderPaid')
  debugger;
  var meta = {fn: 'afterOrderPaid', user_id: passport.user.id, role: passport.user.role}
  meta.order_id = orderHistory.id;
  meta.company_id = orderHistory.company_id;
  meta.unit_id = orderHistory.unit_id;
  meta.customer_id = orderHistory.customer_id;
  var osoId = orderHistory.order_sys_order_id;
  meta.order_sys_order_id = osoId;
  meta.status = orderHistory.status;
  var lang = passport.user.default_language;
  meta.lang = lang;
  logger.info('Post order paid processing starter for order '+ orderHistory.id, meta);
  var deviceId = ''
  var title = ''
  var orderHistoryStatus = orderHistory.status
  debug(orderHistoryStatus)
  var keys = Object.keys(orderHistoryStatus)
  debug("...number of entries= "+ keys.length)
  var updated = false
  var status = 'order_accepted';
  logger.info('Notification not yet sent for status '+status+' for order '+ orderHistory.id, meta);
  debug('...status '+ status)
  debug(customer);
  debug(user);
  debug(company);
  var msgTarget = { order_id : orderHistory.id }
  debug('...status update from unit. Notify customer '+ orderHistory.customer_id);
  logger.info('Unit order update. Notify customer', meta);
  // get customer device id
  debug('..Customer gcm id is '+ customer.gcm_id)
  msgTarget.to = 'customer'
  msgTarget.toId = customer.id
  msgTarget.gcmId = customer.gcm_id
  msgTarget.fcmId = customer.fcm_id

  if (customer.apns_id)
    msgTarget.os = 'ios';
  else
    msgTarget.os = 'android';

  var updatedStatus = orderHistory.status;
  updatedStatus.order_accepted = timestamp.now();

  if (!msgTarget.gcmId && !msgTarget.fcmId){
    var fge = meta;
    fge.error = 'No fcm/gcm for '+ msgTarget.to;
    logger.error('No fcm/gcm id for '+ msgTarget.to + ' ' + msgTarget.toId, fge);
    return updatedStatus.order_accepted;
  }
  var orderNum = osoId;
  orderNum = orderNum.substring(orderNum.length-4);
  debug('..order number '+ orderNum);
  var custName = user.first_name +' '+ user.last_name.charAt(0);
  debug(custName);
  debug(status);

  msgTarget.title = translator.translate(lang, "orderAccepted");//"Order Accepted";
  msgTarget.message =  translator.translate(lang, "orderAcceptedMessage", timestamp.now());//"Order accepted at "+ timestamp.now()
  msgTarget.body = msgTarget.message;
  msgTarget.status = status;
  logger.info('message', msgTarget)
  debug(msgTarget);
  var msgTime = timestamp.now();
  var supplemental = {};
  supplemental.unit_id = ''+ orderHistory.unit_id;
  supplemental.company_id = ''+ orderHistory.company_id;
  supplemental.order_sys_order_id = orderHistory.order_sys_order_id;
  supplemental.order_id = ''+ orderHistory.id;
  supplemental.time_stamp = msgTime;
  supplemental.status = status;
  
  supplemental.payload = yield addCloudPushSupport(msgTarget,supplemental);
  msgTarget.data = supplemental;

  debug(msgTarget);
  logger.info('message', msgTarget)
  debug('sending notification to '+ msgTarget.to +' ('+ msgTarget.toId +')');
  logger.info('sending notification to '+ msgTarget.to +' ('+ msgTarget.toId +')');
  var mt = meta;

  updatedStatus.order_accepted = timestamp.now();
  logger.info('updated Status : ', updatedStatus);
  mt.message_payload = msgTarget.message;
  yield push.notifyOrderUpdated(orderNum, msgTarget);
  logger.info('Post order paid processing completed for order: ' + orderHistory.id, meta );
  return updatedStatus.order_accepted;
}

function *afterUpdateReviewApproval(approval) {
  logger.info('Updating review status and company rating', {fn:'afterUpdateReviewApproval',approval:approval});
  debug('begin afterUpdateReviewApproval function');
  if (!approval){
    logger.error('No Approval provided for review',{fn:'afterUpdateReviewApproval', error:'No Approval provided for review'});
    throw new Error('No approval provided for review', 422);
  }
  var hash = { status: approval.status };

  try{
    this.resteasy.queries.push(
      this.resteasy.transaction.table('reviews').where('id', approval.review_id).update(hash)
    );
    logger.info('Updated Review Status',{fn:'afterUpdateReviewApproval', review_id:approval.review_id, hash:hash});
  }
  catch (err){
    logger.error('Unable to Update Review Status',{fn:'afterUpdateReviewApproval', review_id:approval.review_id, hash:hash, error:err});
    throw err;
  }

  // Recalculate company rating
  if (approval.status == "Approved") {
    try{
      var companyId = (yield Reviews.getCompanyId(approval.review_id))[0];
      if (companyId) {
        var averageRating = (yield Reviews.getAverageRating(companyId.company_id, approval.review_id))[0];
        if (averageRating) {
          debug('average rating is now ' + averageRating.avg_rating + ' for company ID ' + companyId.company_id);
          var updateCompanyRating = { calculated_rating: averageRating.avg_rating };

          this.resteasy.queries.push(
            this.resteasy.transaction.table('companies').where('id', companyId.company_id).update(updateCompanyRating)
          );
        } else {
          logger.info('Unable to get Average Rating for company',{fn:'afterUpdateReviewApproval', review_id:approval.review_id, companyId:companyId.company_id});
        }
      }
      logger.info('Updated Average Rating for company',{fn:'afterUpdateReviewApproval', review_id:approval.review_id, companyId:companyId.company_id});
    }
    catch (err){
      logger.error('Unable to update Average Rating', {fn:'afterUpdateReviewApproval', review_id:approval.review_id, error:err});
      throw err;
    }
  }
}

function *afterReadOrderHistory(orderHistory) {
  logger.info('After Read Order History',{fn:'afterReadOrderHistory',orderHistory:orderHistory});
  debug('afterReadOrderHistory')
  if (orderHistory && orderHistory.order_sys_order_id && !orderHistory.order_detail) {
    try {
      var moltin_order_items = yield msc.getOrderDetail(orderHistory.order_sys_order_id)
      var details = yield simplifyDetails(moltin_order_items)
    } catch (err) {
      logger.error('Error getting Order Details',
          {fn: 'afterReadOrderHistory', orderHistory:orderHistory, error: err});
      throw(err)
    }
    debug('..order details')
    debug(details)
    var orderDetail = { order_detail: details};
    try {
      var updatedOrder = yield OrderHistory.updateOrder(orderHistory.id, orderDetail)
    } catch (err) {
      logger.error('Error updating Order',
          {fn: 'afterReadOrderHistory', order_detail:details, orderHistory:orderHistory, error: err});
      throw(err)
    }
    debug('updatedOrder')
    debug(updatedOrder)
    logger.info('Updated Order', {fn:'afterReadOrderHistory',updatedOrder:updatedOrder});
  }
  else{
    if (!orderHistory){
      logger.error('No Order History found', {fn:'afterReadOrderHistory',error:'No Order History found'});
    }
    else {
      if (!orderHistory.order_sys_order_id){
        logger.error('No Order ID exists on the Order History', {fn:'afterReadOrderHistory',orderHistory:orderHistory,error:'No Order ID exists on the Order History'});
      }
      if (orderHistory.order_detail){
        logger.info('Order Detail already exists on the Order History; skipping get', {fn:'afterReadOrderHistory',orderHistory:orderHistory});
      }
    }
  }
  /* this.resteasy.queries.push(
    this.resteasy.transaction.table('order_history').where('order_history.id', order_history.id).update(order_detail)
  );*/
}

function *validUnitMgr(params, user) {
  logger.info('Validating Unit Manager',{fn:'validUnitMgr', user:user, params:params});
  debug('validUnitMgr');
  var compId = '';
  var unitId = '';
  if (params.context && (m = params.context.match(/companies\/(\d+)/))) compId = m[1];

  if (params.table=="units") {
    unitId = params.id;
  } else { // some other table with unit in the context
    if (params.context && (n = params.context.match(/units\/(\d+)$/))) unitId = n[1];
  }
  if (!compId) {
    logger.error('No company id provided for unit', {fn: 'validUnitMgr', user:user, params:params, error: 'No company id provided for unit'});
    throw new Error('No company id provided for unit',422);
  }
  if (!unitId) {
    logger.error('No unit id provided', {fn: 'validUnitMgr', user:user, params:params, error: 'No unit id provided'});
    throw new Error('No unit id provided', 422);
  }
  debug('.. for company '+ compId);
  debug('.. for unit '+ unitId);
  var valid = (yield Unit.verifyUnitManager(compId, unitId, user.id))[0]
  debug('..unit manager is '+ valid);

  if (!valid) {
    logger.info('Unit Manager Invalid',{fn:'validUnitMgr',user:user,valid:valid});
    return false;
  } // else continue
    logger.info('Unit Manager Validated',{fn:'validUnitMgr',user:user,valid:valid});
  return true;
}

module.exports = {
  hooks: {
    authorize: function *(operation, object) {
      console.log('checking authorization of ' + operation + ' on ')
      console.log(this.resteasy.table);

      if (operation == 'create') {
        if (this.params.table == 'companies' || this.params.table == 'roles' ||
            this.params.table == 'order_status_audit' || this.params.table == 'territories' || this.params.table == 'countries') {
          if(!this.isAuthenticated() || !this.passport.user || this.passport.user.role != 'ADMIN') {
            this.throw('Create Unauthorized - Admin only',401);
          } // else continue
        } else if (this.params.table == 'units' || this.params.table == 'loyalty_rewards' || this.params.table === 'loyalty_packages') {
          if(!this.isAuthenticated() || !this.passport.user || (this.passport.user.role != 'OWNER' && this.passport.user.role != 'FOODPARKMGR' && this.passport.user.role != 'ADMIN')) {
            this.throw('Create Unauthorized - Owners/Admin only',401);
          } // else continue          }
        } else if (this.params.table == 'drivers') {
          if(!this.isAuthenticated() || !this.passport.user ||
              (this.passport.user.role != 'OWNER' && this.passport.user.role != 'ADMIN' && this.passport.user.role != 'FOODPARKMGR'  && this.passport.user.role != 'UNITMGR')) {
            this.throw('Create Unauthorized - Unit Manager/Owners/Admin/Food Park Manager only',401);
          }
          var valid = false;
          if (this.passport.user.role == 'ADMIN' || this.passport.user.role === 'FOODPARKMGR'){
            valid=true;
          }
          else{
            valid=yield validUnitMgr(this.params, this.passport.user);
          }
          if (!valid) {
            this.throw('Update Unauthorized - incorrect Unit Manager',401);
          } // else continue
          console.log("...authorized")
        } else if (this.params.table == 'delivery_addresses' || this.params.table == 'favorites' ||
                   this.params.table == 'reviews' || this.params.table == 'order_history' || this.params.table == 'loyalty_used') {
          debug('..checking POST '+ this.params.table)
          if(!this.isAuthenticated() || !this.passport.user || (this.passport.user.role != 'CUSTOMER' && this.passport.user.role != 'FOODPARKMGR' &&  this.passport.user.role != 'UNITMGR')) {
            this.throw('Create Unauthorized - Customers only',401);
          } // else continue
          debug('..get customer id for user')
          var customer = (yield Customer.getForUser(this.passport.user.id))[0]
          debug(customer)
          if (!customer && this.passport.user.role !== 'FOODPARKMGR' && this.passport.user.role !== 'UNIT_MGR') {
            this.throw('Unauthorized - no such customer',401);
          } // else continue
          if(!this.resteasy.object.customer_id) {
            if (this.passport.user.role === 'FOODPARKMGR' || this.passport.user.role === 'UNITMGR')
              throw new Error('You must provide a customer id',422);
            this.resteasy.object.customer_id = customer.id;
          }
          console.log('..authorized')
        } else if (this.params.table == 'loyalty') {
          this.throw('Create Unauthorized', 401); // loyalty create is only allowed in-code when order state is 'order_paid'
        }
        console.log("... create is authorized")
      } else if (operation == 'update' && this.params.table == 'units' && this.isAuthenticated() && this.passport.user && this.passport.user.role == 'UNITMGR') {
        debug('unit mgr update');

        var valid = yield validUnitMgr(this.params, this.passport.user);
        if (!valid) {
          this.throw('Update Unauthorized - incorrect Unit Manager',401);
        } // else continue
        console.log("...authorized")
      } else if (operation == 'update' && this.params.table == 'users' && this.isAuthenticated() &&
                 this.passport.user && this.passport.user.role != 'UNITMGR') {
        debug('..authorized '+ this.passport.user.role +' to update user info');

      } else if (operation == 'update' || operation == 'delete') {
        if (this.params.table == 'territories' || this.params.table == 'food_parks' || this.params.table == 'roles' ||
            this.params.table == 'order_status_audit' || this.params.table == 'users') {
          if(!this.isAuthenticated() || !this.passport.user || this.passport.user.role == 'ADMIN' ||this.passport.user.role == 'OWNER') {
            this.throw('Update/Delete Unauthorized - Admin only',401);
          } // else continue
        } else if (this.params.table == 'companies' && operation == 'update' && this.passport.user.role == 'UNITMGR') {
          if (!this.isAuthenticated() || !this.passport.user || (this.passport.user.role == 'CUSTOMER')) {
            this.throw('Update/Delete Unauthorized - Customer unauthorized');
          }
          else {
            logger.info('...authorized for update');
          }
        }
         else if (this.params.table == 'companies' || this.params.table == 'units' || this.params.table == 'loyalty_rewards') {
          if(!this.isAuthenticated() || !this.passport.user || (this.passport.user.role != 'OWNER' && this.passport.user.role != 'ADMIN' && this.passport.user.role != 'FOODPARKMGR')) {
            this.throw('Update/Delete Unauthorized - Owners/Admin only',401);
          } else {
            if (this.passport.user.role == 'FOODPARKMGR') {
              var unitId = this.params.id;
              var managedUnits = (yield FoodPark.getManagedUnits(this.passport.user.id)).rows;

              var valid = managedUnits.some(function (unit) {
                return unitId == unit.id;
              });
              
              if (!valid)
                this.throw('Update/Delete Unauthorized - FPM does not manage this unit',401);
            }
            if (this.passport.user.role == 'OWNER') {
              // verify user is modifying the correct company
              var coId = this.params.id
              if (this.params.table != 'companies' && (this.params.context && (m = this.params.context.match(/companies\/(\d+)$/)))) {
                coId = m[1]
              }
              console.log('verifying owner')
              var valid = (yield Company.verifyOwner(coId, this.passport.user.id))[0]
              if (!valid) {
                this.throw('Update/Delete Unauthorized - incorrect Owner',401);
              } // else continue
            }
          }
        }  else if (this.params.table == 'drivers') {
          if(!this.isAuthenticated() || !this.passport.user ||
             (this.passport.user.role != 'OWNER' && this.passport.user.role != 'ADMIN' && this.passport.user.role != 'UNITMGR')) {
            this.throw('Update/Delete Unauthorized - Unit Managers/Owners/Admin only',401);
          } else {
            var valid = false;
            if (this.passport.user.role == 'ADMIN'){
              valid=true;
            }
            else{
              valid=yield validUnitMgr(this.params, this.passport.user);
            }
            if (!valid) {
              this.throw('Update Unauthorized - incorrect Unit Manager',401);
            } // else continue
            console.log("...authorized");
          }
        } else if (this.params.table == 'customers' ||  this.params.table == 'delivery_addresses' ||
                   this.params.table == 'favorites' || this.params.table == 'reviews') {
          if(!this.isAuthenticated() || !this.passport.user || (this.passport.user.role != 'CUSTOMER' && this.passport.user.role != 'ADMIN')) {
            this.throw('Update/Delete Unauthorized - Customers/Admins only',401);
          } else {
            console.log('..authorized')
          }
        } else if (this.params.table == 'loyalty' || this.params.table == 'loyalty_used') {
          // loyalty update only allowed in-code when order state is 'order_paid'
          // loyalty_used should never need to be updated, as it is a transaction registry.
          this.throw('Update/Delete Unauthorized', 401);
        }
        console.log("...authorized")
      } else if (operation == 'read') {
        console.log('got a read')
      } else {
        console.error('authorize: unknown operation' + operation)
        this.throw('Unknown operation - '+ operation, 405)
      }
    },
    beforeSave: function *() {
      if (this.resteasy.table == 'reviews') {
        debug('saving reviews')
        yield beforeSaveReview.call(this);
      } else if (this.resteasy.table == 'drivers') {
        debug('saving drivers')
        yield beforeSaveDriver.call(this);
      } else if (this.resteasy.table == 'units') {
        debug('saving units')
        yield beforeSaveUnit.call(this);
      } else if (this.resteasy.table == 'loyalty_rewards') {
        debug('saving loyalty rewards')
        yield beforeSaveLoyaltyRewards.call(this);
      } else if (this.resteasy.table == 'food_parks') {
        debug('saving food_parks')
        yield beforeSaveFoodpark.call(this);
      } else if (this.resteasy.table == 'companies') {
        debug('saving companies')
        yield beforeSaveCompanies.call(this);
      } else if (this.resteasy.table == 'customers') {
        debug('saving customers')
        yield beforeSaveCustomer.call(this);
      } else if (this.resteasy.table == 'order_history') {
        debug('saving order_history')
        yield beforeSaveOrderHistory.call(this);
        debug('saving order_history to repository')
      } else if (this.resteasy.table == 'users') {
        debug('saving users')
        yield beforeSaveUser.call(this);
      }
    },

    afterQuery: function *(res) {
      debug('afterQuery');
      debug(this.resteasy.operation)
      if (this.resteasy.operation == 'create') {
        if (this.resteasy.table == 'reviews') {
          yield afterCreateReview.call(this, res[0]);
        } else if (this.resteasy.table == 'order_history') {
          yield afterCreateOrderHistory.call(this, res[0]);
        } else if (this.resteasy.table == 'loyalty_used') {
          yield afterCreateLoyaltyUsed.call(this, res[0]);
        }
      } else if (this.resteasy.operation == 'update') {
        if (this.resteasy.table == 'review_approvals') {
          yield afterUpdateReviewApproval.call(this, res[0]);
        } else if (this.resteasy.table == 'order_history') {
            yield afterUpdateOrderHistory.call(this, res[0]);
        } else if (this.resteasy.table == 'territories') {
          yield afterUpdateTerritory.call(this,res[0]);
        } else if (this.resteasy.table == 'units') {
          yield afterUpdateUnit.call(this,res[0]);
        }
      } else if (this.resteasy.operation == 'index') {
        debug('..read');
        if (this.resteasy.table == 'order_history') {
          if (this.params.id) { // specific order history
            yield afterReadOrderHistory.call(this, res[0]);
          } // else retrieve all
        }
      }
    },

  },

  checkForSoftDelete: function (query) {

    if (this.resteasy.operation == 'destroy') {
      if (softDeleteTables.indexOf(this.params.table.toLowerCase()) > -1){
        debug('Soft delete table: '+this.params.table);
        debug('Soft delete id: '+this.params.id);
        return query.update( {
          is_deleted: true
        }).where({id: this.params.id});
      }
    }
  },

  // the apply context option allows you to specify special
  // relationships between things, in our case, /companies/:id/units,
  // for example.
  applyContext: function (query) {
    debug('applyContext')
    console.log('context');
    var context = this.params.context;
    console.log(context);
    var m;
    debug('..operation '+ this.resteasy.operation);
    debug('..table '+ this.resteasy.table);
    console.log('..table '+ this.resteasy.table);
    debug('context');
    if (!context) debug('..no context')
    else debug(context);

    if (this.resteasy.operation == 'index') {
      //soft deleted tables
       if (softDeleteTables.indexOf(this.resteasy.table.toLowerCase()) > -1){
        query=query.select('*').where('is_deleted',false);
      }
      //context checks
      if (this.resteasy.table == 'units' && context && (m = context.match(/companies\/(\d+)$/))) {
        debug('..company id '+ m[1]);
        return query.select('*').where('company_id', m[1]);
      } else if (this.resteasy.table == 'order_history' && context
                && (m = context.match(/companies\/(\d+)/))
                && (n = context.match(/units\/(\d+)/))) {
        debug('..query order history');
        debug('..company id '+ m[1]);
        debug('..unit id '+ n[1]);
        return query.select('*').where('company_id',m[1]).andWhere('unit_id',n[1]);
      } else if (this.resteasy.table == 'drivers' && context
                && (m = context.match(/companies\/(\d+)/))
                && (n = context.match(/units\/(\d+)/))) {
        debug('..query drivers');
        debug('..company id '+ m[1]);
        debug('..unit id '+ n[1]);
        return knex('users').select(knex.raw('users.*')).leftJoin('drivers', 'drivers.user_id', 'users.id').where({'drivers.company_id' : m[1], 'drivers.unit_id' : n[1]});
        // return query.select('*').where('company_id',m[1]).andWhere('unit_id',n[1]);
      } else if (this.resteasy.table == 'favorites' || this.resteasy.table == 'reviews') {
        debug('..read favorites / reviews');
        var coId = '';
        var custId = '';
        var unitId = '';
        if (context && (m = context.match(/companies\/(\d+)$/))) coId = m[1];
        if (context && (m = context.match(/customers\/(\d+)$/))) custId = m[1];
        if (context && (m = context.match(/units\/(\d+)$/))) unitId = m[1];
        // doing this the hard way
        debug('..modify query');
        if (custId) {
          debug('..customer id '+ custId);
          return query.select('*').where('customer_id', custId);
        } else if (unitId) {
          debug('..unit id '+ unitId);
          return query.select('*').where('unit_id', unitId);
        } else if (coId) {
          debug('..company id '+ coId);
          return query.select('*').where('company_id', coId);
        }
      } else if (this.resteasy.table == 'food_parks' && context && (m = context.match(/territories\/(\d+)$/))) {
        debug('..territory id '+ m[1]);
        return query.select('*').where('territory_id', m[1]);
      } else if (this.resteasy.table == 'loyalty_rewards' && context && (m = context.match(/companies\/(\d+)$/))) {
        debug('..company id '+ m[1]);
        return query.select('*').where('company_id', m[1]);
      } else if (this.resteasy.table == 'delivery_addresses' && context && (m = context.match(/customers\/(\d+)$/))) {
        debug('..customer id '+ m[1]);
        return query.select('*').where('customer_id', m[1]);
      } else if (this.resteasy.table == 'reviews' && context && (m = context.match(/companies\/(\d+)$/))) {
        debug('..company id '+ m[1]);
        return query.select('*').where('company_id', m[1]);
      } else if (this.resteasy.table == 'checkins' && context && (m = context.match(/territories\/(\d+)$/i))) {
        return query.select(
            knex.raw('((checkins.check_in is null OR checkins.check_in <= current_timestamp) AND (checkins.check_out is null OR checkins.check_out >= current_timestamp)) as is_active')
          ).innerJoin('units','units.id','checkins.unit_id').where('territory_id',m[1]).andWhere('units.is_deleted',false).andWhereRaw('checkins.check_in >= current_date');
      } else if (this.resteasy.table == 'loyalty'
                && context
                && (m = context.match(/companies\/(\d+)/))
                && (n = context.match(/customers\/(\d+)/))) {
        debug('..reading loyalty');
        return query.select('*').where('company_id',m[1]).andWhere('customer_id',n[1]);
      } else if (this.resteasy.table == 'users' && context && (m = context.match(/territories\/(\d+)/) ) ) {
        return query.select('*').where('territory_id', m[1]);
      }  else if (this.resteasy.table == 'territories' && context && (m = context.match(/countries\/(\d+)$/))) {
        debug('..country id '+ m[1]);
        return query.select('*').where('country_id', m[1]);
      }
    }
  },
};
