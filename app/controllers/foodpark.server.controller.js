var User = require('../models/user.server.model');
var FoodPark = require('../models/foodpark.server.model');
var auth = require('./authentication.server.controller');
var msc = require('./moltin.server.controller');
var config = require('../../config/config');
var debug = require('debug')('storefront');
var OrderHistory  = require('../models/orderhistory.server.model');
var _ = require('lodash');
var logger = require('winston');
var Company = require('../models/company.server.model');
const request = require('request-promise');

exports.getUnitsbyFoodPark = function*(){
  try{
    let units = yield OrderHistory.getUnitsbyFoodParkId(this.params.food_park_id);
    if(units.length){
      this.body={status:200, message:"Units of a food park", data:units};
      return;
    }else{
      this.body = {status:404, message:"No units found!"};
      return;
    }
  }catch(error){
    console.error('error getting foodpark units')
    this.body = {status:400,message:'error getting foodpark units'}
    return;
  }
}


exports.createHub = function*(){
  try{
    var apikey = '07575882452c47d09baf188e72e1bba5';
    if(this.body.latitude){
      var response = yield request.get(`https://api.opencagedata.com/geocode/v1/json?q=${this.body.latitude}+${this.body.longitude}&key=${apikey}`);
      var data = JSON.parse(response);
      var city = data.results[0].components.city;
      var state = data.results[0].components.state_code;
    }
    let body={
      name: this.body.name,
      latitude: this.body.latitude,
      longitude: this.body.longitude,
      territory_id : this.body.territory_id,
      address : this.body.address,
      city,state,
      postal_code: this.body.postal_code,
      type : this.body.type
    }
    let hub = yield FoodPark.createHub(body);
    if(hub){
      this.body = {status:200, message:"Food park created", data:hub};
      return;
    }
  }catch(error){
    console.error(error)
    this.body = {status:400,message:'error creating foodpark'}
    return;
  }
}


exports.getFoodPark = function * (id, next) {
  this.foodpark = {id: id};
  yield next;
}

exports.getFoodParkUnitId = function * (id, next) {
  this.foodpark.unit_id = id;
  yield next;
}

exports.getFoodParkCheckins = function * (next) {
  var user = this.passport.user
  var id = this.foodpark.id

  if (!user || !user.role == 'FOODPARKMGR') {
    this.status = 401
    return
  }

  debug('authorized...')
  debug('getFoodParkCheckins')
  debug('id ' + id)

  if (!id || isNaN(id)) {
    this.status = 400;
    return
  }

  try {
    var units = yield FoodPark.getFoodParkCheckins(id);
    this.body = {data : units,message:'Get Food Park Checkins',status:200};
    return;
  } catch (err) {
    console.error('error getting foodpark checkins');
    this.body = {status:400,message:'error getting foodpark checkins'}
    return;
    // throw(err)
  }

  debug(units.rows)
  return;
}

exports.getFoodParkUnits = function * (id, next) {
  var user = this.passport.user
  var id = this.foodpark.id

  if (!user || !user.role == 'FOODPARKMGR') {
    this.status = 401
    return
  }

  debug('authorized...')
  debug('getFoodParkCheckins')
  debug('id ' + id)

  if (!id || isNaN(id)) {
    this.status = 400;
    return
  }

  try {
    var units = yield FoodPark.getFoodParkUnits(id);
    this.body = {data:units.rows,message:'get food parks unit', status:200};
    return;
  } catch (err) {
    console.error('error getting foodpark units')
    this.body = {status:400,message:'error getting foodpark units'}
    return;
    // throw(err)
  }

  debug(units.rows)
  return;
}

exports.getFoodParkCompanies = function * (next) {
  var user = this.passport.user
  var foodParkId = this.params.foodParkId;

  if (!user || !user.role === 'FOODPARKMGR') {
    this.status = 401;
    return
  }

  if (!foodParkId || isNaN(foodParkId)) {
    this.status = 400;
    return
  }

  try {
    var companies = yield FoodPark.getFoodParkCompanies(foodParkId);
    this.body = {data:companies.rows,message:'Get food park companies',status:200};
    return;
  } catch (err) {
    console.error('error getting foodpark companies');
    // throw(err)
    this.body = {status:400,message:'error getting foodpark companies'}
    return;
  }

  debug(companies.rows);
};

exports.addFoodParkUnits = function * (id, next) {
  var user = this.passport.user


  if (!user || !user.role == 'FOODPARKMGR' || !user.role == 'UNITMGR') {
    this.status = 401
    return
  }

  if (!this.body) {
    this.status = 400;
    return
  }

  var id = this.foodpark.id
  var unit_id = this.body.unit_id

  if (!id || isNaN(id)) {
    this.status = 400;
    return
  }

  if (unit_id === undefined) {
    this.status = 400;
    return
  }

  debug('authorized...')
  debug('addFoodParkUnits')
  debug('id ' + id)

  var b = {
    unit_id: unit_id,
    food_park_id: id
  }
  try {
    let foodparkunit = yield FoodPark.addFoodParkUnits(b);
    this.body = {status:200,message:'Added food park unit',data:foodparkunit}
    return;
  } catch (err) {
    console.error('error adding foodpark units')
    this.body = {status:400,message:'error getting foodpark unit'}
    return;
    // throw(err)
  }

  return
}

exports.removeFoodParkUnits = function * (id, next) {
  var user = this.passport.user
  var foodParkId = this.params.foodParkId;
  var unit_id = this.params.fpUnitId;

  if (!user || !user.role == 'FOODPARKMGR' || !user.role == 'UNITMGR') {
    this.status = 401
    return
  }

  debug('authorized...')
  debug('addFoodParkUnits')
  debug('id ' + foodParkId)

  if (!foodParkId || isNaN(foodParkId)) {
    this.status = 400;
    return
  }

  console.log(unit_id);

  if (!unit_id || isNaN(unit_id)) {
    this.status = 400;
    return
  }

  try {
    b = {'food_park_id': foodParkId, 'unit_id': unit_id}
    console.log(b)
    let msg = yield FoodPark.removeFoodParkUnits(b)
    this.body = {"message": "successfully deleted",data:msg};
    return;
  } catch (err) {
    console.error('error removing foodpark units')
    this.body = {status:400,message:'error removing foodpark units'}
    return;
    // throw(err)
  }

  return
}

exports.getUnitsActiveOrders = function * (next) {
  var user = this.passport.user;
  var unit_id = this.params.foodParkId;
  var unitsDetails = (yield Company.getSingleCompanyByunit(unit_id));
  var food_park_id = unitsDetails[0].food_park_id;

  // var food_park_id = this.params.foodParkId;
  // if (!user || !user.role == 'FOODPARKMGR') {
  //   this.status = 401
  //   return
  // }
  // debug('authorized...');
  // debug('getUnitsActiveOrders');


  if (!food_park_id || isNaN(food_park_id)) {
    this.status = 400;
    return;
  }

  try {
    debug('getActiveOrders');
    var units = yield FoodPark.getFoodParkUnits(food_park_id);
    console.log('unitssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',food_park_id,units.rows)
    var response = [];
    let obj ={};
    logger.info(user);
    
    for (var i in units.rows) {
      let unit = units.rows[i];
      // unit.orders = yield OrderHistory.getActiveOrders(unit.company_id, unit.id);
      let nnnn = yield OrderHistory.getActiveOrders(unit.company_id, unit.id);
      // response.push(unit);
      console.log('sdasjhdkjhsakgjdgjkaskdgasjkd',nnnn)

      obj['company_name']=nnnn[0].company_name;
      obj['actual_pickup_time']=nnnn[0].actual_pickup_time;
      obj['driver_name']=nnnn[0].driver_name;
      obj['customer_name']=nnnn[0].customer_name;
      obj['status']=nnnn[0].status;
      obj['id']=nnnn[0].id;
      obj['amount']=parseFloat(nnnn[0].amount);
      obj['delivery_address']= nnnn[0].delivery_address_details;
     
      response.push(obj);
    };
    
    this.body = {data:response,message:'get active unit order',status:200};
    return;
  } catch (err) {
    console.error('error getting foodpark active units orders');
    this.body = {status:400,message:'error getting foodpark active units orders'}
    return;
    // throw(err);
  }

  return;
};

exports.setDriversToOrder = function *(next) {
  let data = this.body.data;
  if(data && data.length > 0){
    var user = this.passport.user;
    if (!user || !user.role == 'FOODPARKMGR') {
      this.status = 401
      this.body = {status:401, message:"not accessable"}
      return
    }
  try {
    let customerOrder ={};
    for(let item of data){
      let driver_id = item.driver_id;
      let delivery_address_id = item.delivery_address_id;
      // let company_id = item.company_id;
      let customer_id = item.customer_id;
      let order_id = item.order_id;
      
      customerOrder = yield OrderHistory.getCustomerOrder(customer_id);
      let status = customerOrder.findIndex((item1,index)=>{
        return item1.order_detail.id==order_id;
      });
      if(status!=-1){
        yield OrderHistory.updateOrder(customerOrder[status].id ,{'driver_id': driver_id,"delivery_address_id":delivery_address_id});
      }else{
        console.log('no order, no order, no order')
      }
      
    }
    this.body = {status:200,message:'Driver updated successfully!'};
    return;
  } catch(err) {
    console.error('error seting driver by foodpark manager');
    this.body = {status:400,message:'error seting driver by foodpark manager',err:err}
    return;
  }
}else{
  this.status = 400; // Internal Server Error - Operation Failed
  this.body = { status:400,message: 'Please send required parameters.' };
  return;
}
};

exports.assignDriverToAParticularOrder = function* () {
  let data = this.body.driver_id;
  if (data) {
    var user = this.passport.user;
    if (!user || !user.role == 'FOODPARKMGR') {
      this.status = 401
      this.body = { status: 401, message: "not accessable" }
      return
    }
    try {
      let customerOrder = {};
      let result = [];
      let body = {};
      let priority = 1;
      let driver_id = this.body.driver_id;
      let unit_id = this.body.vendor_id;
      let order_id = this.body.order_id;
      if (unit_id) {
        var driverOrder = yield OrderHistory.getDriverOrder(driver_id);
        if (driverOrder) {
          if (driverOrder.length != 0) {
            priority = driverOrder.length + 1;
          }
          body = {
            driver_id, priority, unit_id
          }
          yield OrderHistory.createDriverOrder(body);
          var driverOd = yield OrderHistory.getDriverOrder(driver_id);
          for (let val of driverOd) {
            if (val.unit_id) {
              unitaddress = yield OrderHistory.getSingleCompanyByunit(val.unit_id);
              for (let item of unitaddress) {
                let obj = {
                  street: item.from_street,
                  city: item.from_city,
                  state: item.from_state,
                  zip: item.from_zip,
                  country: item.from_country,
                  priority: val.priority
                }
                result.push(obj);
              }
            }
          }
          this.body = { status: 200, data: result };
          return;
        }
      } else {
        customerOrder = yield OrderHistory.getOrder(order_id);
        if (customerOrder.rows.length) {
          var driverOrder = yield OrderHistory.getDriverOrder(driver_id);
          let delivery_address_id = customerOrder.rows[0].delivery_address_id;
          if (driverOrder) {
            if (driverOrder.length != 0) {
              priority = driverOrder.length + 1;
            }
            body = {driver_id, delivery_address_id, priority, order_id};
            dat = yield OrderHistory.updateOrder(customerOrder.rows[0].id, { 'driver_id': driver_id, "delivery_address_id": delivery_address_id });
            yield OrderHistory.createDriverOrder(body);
            var driverOrd = yield OrderHistory.getDriverOrder(driver_id);
            var driverOrders = yield OrderHistory.getHistoryDriverOrder(driver_id);
            for (let item of driverOrders) {
              let pro = driverOrd.filter(i => i.order_id == item.order_detail.id)
              let obj = {};
              obj.order_id = item.order_detail.id;
              obj.driver_id = driver_id;
              obj.delivery_address_id = delivery_address_id;
              obj.customer_id = customerOrder.rows[0].customer_id;
              obj.order_details = item.order_detail.shipping_address;
              obj.priority = pro.length ? pro[0].priority : null;
              result.push(obj)
            }
            this.body = { status: 200, message: 'Driver updated successfully!', data: result };
            return;
          }
        } else {
          console.log('no order, no order, no order')
          this.body = { status: 404, message: "No such order exist" }
          return;
        }
      }
    } catch (err) {
      console.error('error seting driver by foodpark manager', err);
      this.body = { status: 400, message: 'error seting driver by foodpark manager', err: err }
      return;
    }
  } else {
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status: 400, message: 'Please send required parameters.' };
    return;
  }
};


exports.deleteOrderFromDriverTaskList = function* () {
  if (this.body.driver_id) {
    var result = [];
    let unit_id = this.body.vendor_id;
    let order_id = this.body.order_id;
    let driver_id = this.body.driver_id;
    try {
      var driverOrders = yield OrderHistory.getDriverOrder(driver_id);
      if (driverOrders.length > 0) {
        if (unit_id) {
          var unitodr = driverOrders.filter(x => x.unit_id == unit_id);
          if(unitodr.length == 0){
            this.body = {status: 422, message:"Order deleted already"}
            return
          }
          yield OrderHistory.deleteOrderFromDriverTask(unitodr[0].id);
        } else {
          var unitodr = driverOrders.filter(x => x.order_id == order_id);
          if(unitodr.length == 0){
            this.body = {status: 422, message:"Order deleted already"}
            return
          }
          yield OrderHistory.deleteOrderFromDriverTask(unitodr[0].id);
          yield OrderHistory.updateOnDeliver(order_id);
        }
        // var driverOrd = yield OrderHistory.getDriverOrder(driver_id);
        let rest = driverOrders.filter(x => x.id != unitodr[0].id);
        for (let item of rest) {
          if (parseInt(item.priority) >= parseInt(unitodr[0].priority)) {
            let response = yield OrderHistory.updatePriority(item.id, (parseInt(item.priority) - 1));
            console.log({ response })
          }
        }
        customerOrder = yield OrderHistory.getOrder(order_id);
        let delivery_address_id = customerOrder.rows[0].delivery_address_id;
        if(unit_id){
          var driverOd = yield OrderHistory.getDriverOrder(driver_id);
          for (let val of driverOd) {
            if (val.unit_id) {
              unitaddress = yield OrderHistory.getSingleCompanyByunit(val.unit_id);
              for (let item of unitaddress) {
                let obj = {
                  street: item.from_street,
                  city: item.from_city,
                  state: item.from_state,
                  zip: item.from_zip,
                  country: item.from_country,
                  priority: val.priority
                }
                result.push(obj);
              }
            }
          }
        }else{
          var driverOrd = yield OrderHistory.getDriverOrder(driver_id);
          var driverOrders = yield OrderHistory.getHistoryDriverOrder(driver_id);
          for (let item of driverOrders) {
            let pro = driverOrd.filter(i => i.order_id == item.order_detail.id)
            let obj = {};
            obj.order_id = item.order_detail.id;
            obj.driver_id = driver_id;
            obj.delivery_address_id = delivery_address_id;
            obj.customer_id = customerOrder.rows[0].customer_id;
            obj.order_details = item.order_detail.shipping_address;
            obj.priority = pro.length ? pro[0].priority : null;
            result.push(obj)
          }
        }
        this.body = { status: 200, message: "Order deleted from task list", data: result };
        return;
      } else {
        this.body = { status: 404, message: 'No order found for driver.' };
        return;
      }
    } catch (err) {
      console.error('error seting driver by foodpark manager', err);
      this.body = { status: 400, message: 'error deleting order from driver task', err }
      return;
    }
  } else {
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status: 400, message: 'Please send required parameters.' };
    return;
  }
}


exports.setOrderPriority = function* (next) {
  if (this.body.driver_id) {
    var user = this.passport.user;
    if (!user || !user.role == 'FOODPARKMGR') {
      this.status = 401
      this.body = { status: 401, message: "not accessable" }
      return;
    }
    try {
      let value = this.body.data;
      let driver_id = this.body.driver_id;
      let driverOrder = yield OrderHistory.getDriverOrder(driver_id);
      if(driverOrder.length){
        for(let item of value){
          if(item.order_id){
            let update = yield OrderHistory.updateDriverOrder(driver_id,item.order_id, item);
            console.log({update})
          }else{
            let update = yield OrderHistory.updateDriverUnitOrder(driver_id,item.unit_id, item);
            console.log({update});
          }
        }
        let result = yield OrderHistory.getDriverOrder(driver_id);
        this.body = { status: 200, message: 'Order priority updated successfully!', data: result };
        return;
      }else{
        this.body = {status:404, message:"No order found for driver!"};
        return;
      }
      // if(unit_id){
      //   var getOrder = driverOrder.filter(x=> x.unit_id == unit_id);
      //   yield OrderHistory.updatePriority(getOrder[0].id, parseInt(this.body.priority));
      // }else{
      //   var getOrder = driverOrder.filter(x=> x.order_id == order_id);
      //   console.log({getOrder})
      //   yield OrderHistory.updatePriority(getOrder[0].id, parseInt(this.body.priority));
      // }
      // let rest = driverOrder.filter(x => x.id != getOrder[0].id);
      // for (let item of rest) {
      //   if (parseInt(item.priority) >= parseInt(this.body.priority)) {
      //     let response = yield OrderHistory.updatePriority(item.id, (parseInt(item.priority) - 1));
      //     console.log({ response })
      //   }
      // }
      // customerOrder = yield OrderHistory.getOrder(order_id);
      // let delivery_address_id = customerOrder.rows[0].delivery_address_id;
      // if(unit_id){
      //   var driverOd = yield OrderHistory.getDriverOrder(driver_id);
      //   for (let val of driverOd) {
      //     if (val.unit_id) {
      //       unitaddress = yield OrderHistory.getSingleCompanyByunit(val.unit_id);
      //       for (let item of unitaddress) {
      //         let obj = {
      //           street: item.from_street,
      //           city: item.from_city,
      //           state: item.from_state,
      //           zip: item.from_zip,
      //           country: item.from_country,
      //           priority: val.priority
      //         }
      //         result.push(obj);
      //       }
      //     }
      //   }
      // }else{
      //   var driverOrd = yield OrderHistory.getDriverOrder(driver_id);
      //   var driverOrders = yield OrderHistory.getHistoryDriverOrder(driver_id);
      //   for (let item of driverOrders) {
      //     let pro = driverOrd.filter(i => i.order_id == item.order_detail.id)
      //     let obj = {};
      //     obj.order_id = item.order_detail.id;
      //     obj.driver_id = driver_id;
      //     obj.delivery_address_id = delivery_address_id;
      //     obj.customer_id = customerOrder.rows[0].customer_id;
      //     obj.order_details = item.order_detail.shipping_address;
      //     obj.priority = pro.length ? pro[0].priority : null;
      //     result.push(obj)
      //   }
      // };
    } catch (err) {
      console.error('error seting priority by foodpark manager',err);
      this.body = { status: 400, message: 'error seting priority by foodpark manager', err: err }
      return;
      // throw(err);
    }
  } else {
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status: 400, message: 'Please send required parameters.' };
    return;
  }
};


exports.setDriverToOrder = function *(next) {
  // console.log('testing of driver Id:::::::------------------------------------------------------');
  if(this.body.driver_id){
  var user = this.passport.user;
  var food_park_id = this.params.foodparkId;
  var order_id = this.params.OrderId;
  var driver_id = this.body.driver_id;

  
  if (!user || !user.role == 'FOODPARKMGR') {
    this.status = 401
    this.body = {status:401, message:"not accessable"}
    return
  }

  if (driver_id === undefined || driver_id === null || isNaN(driver_id)) {
    this.status = 400;
    this.body = {status:400, message:"Something went wrong"}
    return;
  }

  try {
    let driverData = yield User.getSingleUser(driver_id)[0];
    let name = '';
    if(driverData){
      name = driverData.first_name + driverData.first_name;
    }
    let data=   yield OrderHistory.updateOrder(order_id ,{'driver_id': driver_id,'driver_name':name});
    this.body = {status:200,data:data,message:'set driver to drive'};
    return;
  } catch(err) {
    console.error('error seting driver by foodpark manager');
    this.body = {status:400,message:'error seting driver by foodpark manager',err:err}
    return;
    // throw(err);
  }
}else{
  this.status = 400; // Internal Server Error - Operation Failed
  this.body = { status:400,message: 'Please send required parameters.' };
  return;
}
};


exports.listFoodParkMgr=function *(next) {
  try {
    var foodpark = yield FoodPark.listFoodParkMgr()
  } catch (err) {
    console.error('error getting companies')
    this.body = {status:400, message:"error getting companies"};
    // throw(err)
    return;
  }
  debug(foodpark)
  this.body = {status:200, data:foodpark}
  return;
}

exports.getfoodparkmgrs=function*(){
  try{
    let getuser = yield User.getmanagers(this.body.managerId);
    if(getuser.length){
      let filtered = getuser.filter(x=> x.id != this.body.user_id);
      let data=[];
      for(let item of filtered){
        let getTerr = yield FoodPark.getSingleTerritory(item.territory_id);
        let unit = (yield FoodPark.getUnitsByUserId(item.id))[0];
        // let getFood = yield FoodPark.getManagedFoodPark(this.body.user_id);
        // console.log({getFood})
        item.territory = getTerr[0];
        item.unit = unit;
        data.push(item);
      }
      this.body = {status:200, message:"fetched users", data};
      return;
    }else{
      this.status=404;
      this.body = {status:404, message:"Managers not found!"};
      return;
    }
  }catch(error){
    this.status=400;
    this.body={status:400, message:"Something went wrong", error}
  }
}

exports.getunassingndriver=function *(next) {
  try {
    console.log(this.body)
    var d= [];
      var foodpark = yield FoodPark.getunassingndriver();
      var drivers = yield FoodPark.getdriveruser();
      
      for(let item of drivers){
        let status = foodpark.filter((item1,index)=>{return item1.user_id==item.id});
        if(status.length>0){
          // 
        }else{
          d.push(item)
        }
      }
      // console.log('foodpark',drivers)
  } catch (err) {
    console.error('error getting companies')
    this.body = {status:400, message:"error getting companies"};
    // throw(err)
    return;
  }
  debug(foodpark)
  this.body = {status:200, data:d}
  return;
}

exports.setfooddrivertohub=function *(next) {
  try {
    console.log(this.body)
    for(let item of this.body.list){
      var foodpark_driver = {
        user_id : item.driver_id,
        food_park_id : item.hub_id
    };
      var foodpark = yield FoodPark.addDriver(foodpark_driver);
    }
    
  } catch (err) {
    console.error('error getting companies')
    this.body = {status:400, message:"error getting companies"};
    // throw(err)
    return;
  }
  debug(foodpark)
  this.body = {status:200, data:foodpark}
  return;
}

exports.setfoodparkmgrtohub=function *(next) {
  try {
    console.log(this.body)
    for(let item of this.body.list){
      var foodpark = yield FoodPark.setManager(item.hub_id,item.manager_id)
    }
    
  } catch (err) {
    console.error('error getting companies')
    this.body = {status:400, message:"error getting companies"};
    // throw(err)
    return;
  }
  debug(foodpark)
  this.body = {status:200, data:foodpark}
  return;
}

exports.setAvailable = function * (next) {
  if(this.body.available){
    var user = this.passport.user;
    var foodParkId = this.params.foodParkId;
    var driverId = this.params.userId;

    var driver = yield User.getSingleUser(driverId);

    var available = this.body.available;

    if (!user || !user.role === 'FOODPARKMGR') {
      this.status = 401;
      return;
    }

    if (!driver || driver[0].role !== 'DRIVER') {
      this.status = 400;
      this.body = {message : 'invalid driver'};
      return;
    }

    try {
      var drivers = yield FoodPark.setAvailable(foodParkId, driverId, available);
      this.body = {status:200,message : 'update was successful',data:drivers};
      return;
    } catch (err) {
      console.error ('failed on getting drivers');
      this.body = {message:'failed on getting drivers',status:400};
      return;
      // throw(err);
    }
}else{
  this.status = 400; // Internal Server Error - Operation Failed
  this.body = { status:400,message: 'Please send required parameters.' };
  return;
}
};

exports.getDriversForUnits = function * (next) {
  var unit_id = this.params.unit_id;
  try {
    var companyid = (yield Company.getSingleCompanyByunit(unit_id));
    var drivers = yield FoodPark.getAllDrivers(companyid[0].food_park_id);
    var obj = {};
    var data = [];
    for(let item of drivers.rows){
      delete item.provider;
      delete item.provider_id;
      delete item.provider_data;
      delete item.fbid;
      delete item.fb_token;
      delete item.fb_login;
      delete item.default_language;
      delete item.created_at;
      delete item.updated_at;
      delete item.is_deleted;
      delete item.custom_id;
      delete item.google_api_key;
      delete item.google_sheet_url;
      delete item.google_sheet_tab_name;
      delete item.googleid;
      delete item.google_token;
      delete item.google_login;
      delete item.vendor_name;
      data.push(item);
    }
    // getDefault(data);
    this.body = {data:data,message:'get drivers',status:200};
    return;
  } catch (err) {
    console.error ('failed on getting drivers');
    this.body = {message:'failed on getting drivers',status:400};
    return;
  }
};

exports.getDriversForEveryUnits = function* () {
  try {
    var result = [];
    for (let i of this.body.units) {
      var companyid = (yield Company.getSingleCompanyByunit(i));
      var drivers = yield FoodPark.getAllDrivers(companyid[0].food_park_id);
      var obj = {};
      var data = [];
      for (let item of drivers.rows) {
        delete item.provider;
        delete item.provider_id;
        delete item.provider_data;
        delete item.fbid;
        delete item.fb_token;
        delete item.fb_login;
        delete item.default_language;
        delete item.created_at;
        delete item.updated_at;
        delete item.is_deleted;
        delete item.custom_id;
        delete item.google_api_key;
        delete item.google_sheet_url;
        delete item.google_sheet_tab_name;
        delete item.googleid;
        delete item.google_token;
        delete item.google_login;
        delete item.vendor_name;
        item.unit_id = i;
        data.push(item);
      }
      if(data.length)
      result.push(data);
    }
    this.body = {statu:200, message:"drivers", data:result};
    return;
  } catch (error) {
    console.error('failed on getting drivers', error);
    this.status = 400;
    this.body = { message: 'failed on getting drivers', status: 400, error };
    return;
  }
}


const getDefault = (value)=>{
  for(let i of value){
    if(i.country_id == null){
      i.country_id = 0;
    }
    if(i.city == null){
      i.city = '';
    }
    if(i.state_id == null){
      i.state_id = 0;
    }
    if(i.image == null){
      i.image = '';
    }
  }
  return value;
}

exports.getDrivers = function * (next) {
    var foodParkId = this.params.foodParkId;
    var user = this.passport.user;
    if (!user || user.role !== 'FOODPARKMGR' && user.role !== 'OWNER' && user.role !== 'ADMIN') {
        this.status = 401;
        return;
    }

    try {
      var drivers = yield FoodPark.getAllDrivers(foodParkId);
      this.body = {data:drivers.rows,message:'get drivers',status:200};
      return;
    } catch (err) {
      console.error ('failed on getting drivers');
      this.body = {message:'failed on getting drivers',status:400};
      return;
    }


    // New code based on company Id
    // var company_id = this.params.foodParkId;
    //  try {
    //    var a= [];
    //   var drivers = yield FoodPark.getAllFoodParksByCompanyId(company_id);
    //   for(let item of drivers){
    //     let b = yield FoodPark.getAllDrivers(item.food_park_id);
    //     if(b.rows && b.rows.length > 0) a.push(b.rows)
    //     console.log('yield FoodPark.getAllDrivers(item.food_park_id)',item.food_park_id)
    //   }
    //   this.body = {data:a,message:'get drivers',status:200};
    //   return;
    // } catch (err) {
    //   console.error ('failed on getting drivers');
    //   this.body = {message:'failed on getting drivers',status:400};
    //   return;
    // }
};

exports.addDriver = function * (next) {
  if(this.body.user_id){
    var foodParkId = this.params.foodParkId;
    var user = this.passport.user;

    var driverId = this.body.user_id;

    var driver = yield User.getSingleUser(driverId);

    if (!user || user.role !== 'FOODPARKMGR' && user.role !== 'ADMIN') {
        this.status = 401;
        return;
    }

    if (!driver || driver[0].role !== 'DRIVER') {
        this.status = 400;
        this.body = {message : 'invalid driver'};
        return;
    }

    try {
        var foodpark_driver = {
            user_id : driverId,
            food_park_id : foodParkId
        };

        yield FoodPark.addDriver(foodpark_driver);
        this.status = 200;
        this.body = { message : 'driver-foodpark relationship created!', data : driver,status:200};
        return;
    } catch (err) {
        console.error('failed to create driver');
        this.body = {status:400,message : 'failed to create driver'};
        return;
        // throw(err);
    }
  }else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
  }
};


exports.getCountryId = function * (id, next) {
  this.countryId = {id: id};
  yield next;
};
exports.getUser = function * (id, next) {
    this.user = {id: id};
    yield next;
};

exports.deleteDriver = function * (next, req) {
  
    var foodParkId = this.params.foodParkId;
    var user = this.passport.user;

    var driverId = this.params.userId;
    
    var driver = yield User.getSingleUser(driverId);
    if (!user || user.role !== 'FOODPARKMGR') {
        this.status = 401;
        return;
    }

    if (!driverId || driver[0].role !== 'DRIVER') {
        this.status = 400;
        this.body = {message : 'invalid driver'};
        return;
    }
    console.log('ddsdaasd')
    try {
      
        var deleteDriverRelationship = { food_park_id : foodParkId, user_id : driverId};
        // console.log(';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;',deleteDriverRelationship)
        var deleted = yield FoodPark.deleteDriver(deleteDriverRelationship);
        this.body = {message : 'deleted successfully',status:200,data:deleted};
        return;
    } catch (err) {
        console.error('failed to delete driver');
        this.body = {message : 'failed to delete driver',status:400};
        return;
        // throw(err);
    }
};

exports.getDriverByOrder = function *(next) {
  
  var user = this.passport.user;
  var food_park_id = this.params.foodParkId;
  var order_id = this.params.orderId;
  var driver_id = this.params.driverId;
  
  if (!user || !user.role == 'FOODPARKMGR') {
    this.status = 401;
    return
  }

  if (!food_park_id || isNaN(food_park_id)) {
    this.status = 400;
    return;
  }

  if (!order_id || isNaN(order_id)) {
    this.status = 400;
    return;
  }

  if (!driver_id || isNaN(driver_id)) {
    this.status = 400;
    return;
  }

  try {
    var dataorders = yield OrderHistory.getDriverActiveOrders(parseInt(driver_id, 10));
    
    this.body= {data:dataorders,status:200,message:'get drivers by order'};
    return;
  } catch(err) {
    console.error('error get driver by foodpark manager');
    this.body= {status:400,message:'error get driver by foodpark manager'}
    return;
    // throw(err);
  }

  return;
};
