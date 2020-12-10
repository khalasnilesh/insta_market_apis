var User = require ('../models/user.server.model');
var Country = require ('../models/countries.server.model');
var Company = require ('../models/company.server.model');
var Customer = require ('../models/customer.server.model');
var auth = require('./authentication.server.controller');
var msc = require('./moltin.server.controller');
var unit = require('../models/unit.server.model');
var config = require('../../config/config');
var debug = require('debug')('storefront');
var _ = require('lodash');
var logger = require('winston');
var Units = require('../models/unit.server.model');
var Packages = require('../controllers/packages.server.controller');
var PackageModel = require('../models/packages.server.model');
var Loyalty = require('../models/loyalty.server.model');
const { GoogleSpreadsheet } = require('google-spreadsheet');
var OrderHistory  = require('../models/orderhistory.server.model');
var checkins = require('../models/checkin.server.model');

const PRICE_MODIFIER = 100;

var getErrorMessage = function(err) {
    var message = '';
    for (var errName in err.errors) {
            if (err.errors[errName].message)
                message = err.errors[errName].message;
    }
    return message;
};

var isEmpty = function (myObject) {
    for(var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
}

    return true;
}

var sendErrorResponse = function(err, res, status) {
  if (!status) status = 500
  return res.status(status).send({'error': err})
}

exports.readCompany=function *(next) {
  if(this.company){
    this.body = {status:200,data: this.company}
  }else{
    this.body = {status:400, message:"Error in getting company"}
  }
}

exports.getCompanyUnit = function *() {
  var data = (yield Units.getCompanyUnit(this.params.unitId)).rows[0];
  if(data){
    this.body = {status:200,data:data,message:"get company unit"};
    return
  }else{
    this.body = {status:400,message:"Something went wrong"};
    return
  }
};

exports.getCompany=function *(id, next) {
  debug('getCompany')
  debug('id ' + id)
  try {
    var companyid = (yield Company.getSingleCompanyByunit(id));
    console.log('asdasdkjhaskhdkhaskhdhashdkjas',companyid)
    var company = (yield Company.getSingleCompany(companyid[0].company_id ))[0]
    // var company = (yield Company.getSingleCompany(id))[0]
  } catch (err) {
    console.error('error getting company')
    throw(err)
  }
  debug(company)
  
  this.company = company
  yield next;
}

exports.listState=function *(next) {
  console.log('dsaaaaaaaaaa',this.countryId.id)
  try {
    var states = yield Company.listState(this.countryId.id)
  } catch (err) {
    console.error('error getting companies')
    throw(err)
  }
  debug(states)
  this.body = {states:states,status:200,message:"listing all the states"}
  return;
}

exports.getunassignedOrders = function* () {
  try {
    var company = yield Company.getSingleCompany(this.params.compId);
    var data = [];
    if (company) {
      // let unitData = yield unit.getUnitsByCompanyId(company[0].id);
      let order = yield OrderHistory.getCompanyOrder(this.params.compId);
      if (order.length)
        for (let item of order) {
          if (item.driver_id == null) {
            if(item.order_detail.status == 'incomplete'){
              delete item.payment_time;
              delete item.actual_pickup_time;
              delete item.desired_pickup_time;
              delete item.prep_notice_time;
              delete item.status;
              delete item.messages;
              delete item.qr_code;
              delete item.manual_pickup;
              // delete item.driver_id;
              delete item.contact;
              delete item.order_detail.links;
              delete item.order_detail.relationships;
              delete item.order_detail.shipping;
              delete item.order_detail.billing_address;
              delete item.tip_amount;
              delete item.order_count;
              delete item.checkin_id;
              delete item.commission_type;
              delete item.delivery_charge;
              delete item.distance_type;
              delete item.updated_at;
              delete item.delivery_address_id;
              delete item.order_sys_order_id;
              delete item.for_delivery;
              item['short_name'] = item.company_name.substr(0,3).toUpperCase();
              item['amount'] = parseFloat(item.amount)
              item.order_detail.meta.display_price.tax.amount = parseFloat(item.order_detail.meta.display_price.tax.amount / 100);
              item.order_detail.meta.display_price.with_tax.amount = parseFloat(item.order_detail.meta.display_price.with_tax.amount / 100);
              item.order_detail.meta.display_price.without_tax.amount =  parseFloat(item.order_detail.meta.display_price.without_tax.amount / 100);
              data.push(item);
            }
          }
        }
    }
    this.body = { status: 200, message: "UnasignedOrders", data };
    return;
  } catch (error) {
    this.body = { status: 400, message: "error getting Orders" };
    return;
  }
}

exports.listUnits = function*(){
  try{
    let units = yield Company.getAllUnits(this.params.compId);
    if(units.length){
      let data = [];
      for(let i of units){
        let check = (yield checkins.getCheckin(i.id))[0];
        i.checkin_details = check;
        delete i.customer_order_window;
        delete i.prep_notice;
        delete i.delivery_time_offset;
        delete i.qr_code;
        delete i.apns_id;
        delete i.fcm_id;
        delete i.gcm_id;
        delete i.unit_order_sys_id;
        delete i.from_street;
        delete i.created_at;
        delete i.updated_at;
        delete i.currency_id;
        delete i.hub_status;
        delete i.description;
        delete i.number;
        delete i.device_type;
        delete i.from_city;
        delete i.from_zip;
        delete i.from_country;
        delete i.from_state;
        data.push(i);
      }
      this.body = {status:200, message:"Units", data};
      return;
    }else{
      this.body = {status:404, message:"units not found"};
      return;
    }
  }catch(error){
    this.body = { status: 400, message: "error getting units" };
    return;
  }
}

exports.listCompanies = function* (next) {
  try {
    var data = [];
    var obj = {};
    var companies = yield Company.getAllCompanies();
    for (let item of companies) {
      let obj2 = {};
      obj2['id'] = item.id;
      obj2['name'] = item.name;
      obj2['description'] = item.description;
      obj2['email'] = item.email;
      obj2['phone'] = item.phone;
      obj2['facebook'] = item.facebook;
      obj2['twitter'] = item.twitter;
      obj2['instagram'] = item.instagram;
      obj2['photo'] = item.photo;
      obj2['featured_dish'] = item.featured_dish;
      obj2['hours'] = item.hours;
      obj2['schedule'] = item.schedule;
      obj2['business_address'] = item.business_address;
      obj2['tags'] = item.tags;
      obj2['user_id'] = item.user_id;
      obj2['thumbnail'] = item.thumbnail;
      obj2['short_name'] = item.name.substr(0,3).toUpperCase();
      let unitData = yield unit.getUnitsByCompanyId(item.id);

      if (unitData.length > 0) {
        for (let unit of unitData) {
          let obj1 = {};
          obj1['id'] = unit.id;
          obj1['name'] = unit.name;
          obj1['type'] = unit.type;
          obj1['username'] = unit.username;
          obj1['latitude'] = unit.latitude ? unit.latitude : '0.0';
          obj1['longitude'] = unit.longitude ? unit.longitude : '0.0';
          obj1['company'] = obj2;
          obj = obj1;
          data.push(obj);
        }
      }
    }
  } catch (err) {
    console.error('error getting companies')
    this.body = { status: 400, message: "error getting companies" };
    // throw(err)
    return;
  }
  debug(companies)
  this.body = { status: 200, data: data }
  return;
}

var uploadCompanyThumbnailImage=function *(next) {
  debug('uploadCompanyImage')
  debug('id '+ this.company.id)
  debug('..files')
  debug(this.body.files)
  debug('..path')
  debug(this.body.files.file.path)
  debug('..check for files')
  if (!this.body.files) {
    debug('uploadCompanyImage: No image found')
    return;
  }
  debug('..found image')
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('uploadCompanyImage: Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('uploadCompanyImage: error uploading company image: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw(401, 'Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    var data = this.body;
    debug(data)
    var item = '';
    try {
      item = yield msc.uploadImage(this.company.id, this.body.files.file.path,'company')
    } catch (err) {
      console.error('uploadCompanyImage: error uploading menu item image in ordering system ')
      throw(err)
    }
    var cdnPath = item.link.href ;
    debug('..cdnPath '+ cdnPath);
    return cdnPath;
  } else {
    console.error('uploadCompanyImage: User not authorized')
    this.status=401
    this.body = {error: 'User not authorized'}
    return;
  }
}


var uploadCompanyImage=function *(next) {
  debug('uploadCompanyImage')
  debug('id '+ this.company.id)
  debug('..files')
  debug(this.body.files)
  debug('..path')
  debug(this.body.files.file.path)
  debug('..check for files')
  if (!this.body.files) {
    debug('uploadCompanyImage: No image found')
    return;
  }
  debug('..found image')
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('uploadCompanyImage: Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('uploadCompanyImage: error uploading company image: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw(401, 'Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    var data = this.body;
    debug(data)
    var item = '';
    try {
      item = yield msc.uploadImage(this.company.id, this.body.files.file.path,'company')
    } catch (err) {
      console.error('uploadCompanyImage: error uploading menu item image in ordering system ')
      throw(err)
    }
    /*var domain = item.segments.domain;
    var suffix = item.segments.suffix;
    debug('..domain ' + domain);
    debug('..suffix ' + suffix);
    debug('..domain string length '+ domain.length)
    var domainLen = domain.length - 1 // eliminate extra slash
    debug('..len '+ domainLen);*/
    //var cdnPath = domain.substring(0,domainLen) + suffix;
    var cdnPath = item.link.href ;
    
    debug('..cdnPath '+ cdnPath);
    return cdnPath;
  } else {
    console.error('uploadCompanyImage: User not authorized')
    this.status=401
    this.body = {error: 'User not authorized'}
    return;
  }
}

exports.uploadCompanyPhoto= function *(next) {
  debug('uploadCompanyPhoto')
  try {
    var cdnPath = yield uploadCompanyImage.apply(this);
    var co = yield Company.updatePhoto(this.company.id, cdnPath);
  } catch (err) {
    console.error('uploadCompanyPhoto: error assigning image to company')
    this.body = {status:400, message:"Something went wrong"};
    throw(err)
  }
  this.body = {status:200,data: co}
  return;
}

exports.uploadCompanyThumbnail= function *(next) {
  console.log('uploadCompanyThumbnail',this.body.files.file.size)
  if(this.body.files.file && this.body.files.file.size<=100000){
      try {
      var cdnPath = yield uploadCompanyThumbnailImage.apply(this);
      var co = yield Company.updateThumbnail(this.company.id, cdnPath);
    } catch (err) {
      console.error('uploadCompanyThumbnail: error assigning image to company');
      this.body = {status:400, message:"Something went wrong"};
      throw(err)
    }
    this.body = {status:200,data: co}
  }else{
    this.body = {status:400,message:'Please upload image max upto 100KB'}
  }
  
  return;
}

exports.uploadCompanyFeaturedDish= function *(next) {
  debug('uploadCompanyFeaturedDish')
  try {
    var cdnPath = yield uploadCompanyImage.apply(this);
    var co = yield Company.updateFeaturedDish(this.company.id, cdnPath);
  } catch (err) {
    console.error('uploadCompanyFeaturedDish: error assigning image to company');
    this.body = {status:400, message:"Something went wrong"};
    throw(err)
  }
  this.body = {status:200,data: co}
  return;
}

exports.deleteCompany=function *(next) {
  var meta = {fn: 'deleteCompany', company_id: this.company.id};
  debug('deleteCompany')
  debug('id '+ this.company.id)
  debug('order sys order id '+ this.company.order_sys_id)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    var user = this.passport.user;
    meta.user_id = user.id;
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('error deleting company: Owner '+ user.id + 'not associated with '+ this.company.name, meta)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    var results = '';
    try {
      results = yield msc.deleteCompany(this.company.order_sys_id)
      // results = yield msc.softDeleteMoltinCompany(this.company);
      //get and delete
      /* 
      var categories = yield msc.listCategories(this.company);
      if (categories && categories.length > 0){
        // for (category in categories){
        for (var i=0; i<categories.length; i++){
          var category=categories[i];
          var menuItems = yield msc.listMenuItems(category);
          if (menuItems && menuItems.length > 0){
            for (var j=0; j<menuItems.length; j++){
              var menuItem=menuItems[j];
              //delete menuitem 
              yield msc.deleteMenuItem(menuItem.id);
            } //for menuitems
          } //if menuitems
          //delete category
          yield msc.deleteCategory(category.id);
        }//for categories
      } //if categories
      //delete company
      msc.deleteCompany(this.company.id);
      */
    } catch (err) {
      console.error('error deleting company ('+ this.company.id +') in ordering system')
      throw(err)
    }
    debug(results)
    try {
      results = yield Company.softDeleteCompany(this.company.id)
    }catch (err) {
      console.error('error deleting company ('+ this.company.id +') in SFEZ')
      throw(err)
    }

    debug(results)

    this.body = {
	    "status":200,
    	"message":"Deleted successfully"
    };
    return;
  } else {
    console.error('deleteCompany: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}


exports.readCategory=function *(next) {
	
 debug(this.category)
 if(this.category){
   this.category.title = this.category.name
   this.body={status:200,data: this.category};
   return;
  }else{
    this.body = {status:400,message:"Something went wrong"};
    return;
  }
}

exports.getCategory=function *(id, next) {
  debug('getCategory')
  debug('id '+ id)
  try {
    var category = yield msc.findCategory(id)
  } catch (err) {
    console.error('error retrieving category from ordering system')
    throw(err)
  }
  debug(category)
  this.category = category
  yield next;
}

exports.createCategory= function *(next) {
  debug('createCategory')
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    var user = this.passport.user
    debug(user)
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('error creating category: Owner '+ user.id + ' not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    var title = this.body.title;
    var parent = this.body.parent;
    if (!title) {
      this.status=400
      this.body={status: 400,error: 'Please enter a title for the category.'}
      return
    }
    try {
      debug(this.company)
      var category = yield msc.createCategory(this.company, title, parent)
      debug(category)
      category.title = category.name

    } catch (err) {
        console.error('error creating category in ordering system ')
        this.body={status: 400,error: 'error creating category in ordering system.'}
        throw(err)
    }

    this.body = {status:200,data: category}
    return;
  } else {
    console.error('createCategory: User not authorized')
    this.status=401
    this.body = {status: 401, error: 'User not authorized'}
    return;
  }
}


exports.listCategories=function *(next) {
  debug('listCategories')
  debug(this.company)
  try {
    var categories = (yield msc.listCategories(this.company))
    categories = categories.filter((item,index)=>{return item.active});

    var filteredCategories = []
    for (let i = 0; i < categories.length; i++) {
      
      if (categories[i].company === this.company.order_sys_id) {
        
        categories[i].title = categories[i].name
        filteredCategories.push(categories[i])
      }
    }
    // console.log('*********************************************************************************',filteredCategories)
  } catch (err) {
    console.error('error retrieving categories from ordering system ');
    this.body = {status:400, message:"Something went wrong"};
    throw(err)
  }
  debug(categories)
  this.body = {status:200, data: filteredCategories}
  return;
}

exports.getactivecategoriesnames=function *(next) {
  debug('listCategories')
  console.log('++++++++++++++++++++++++++++++++++++++++++++++I am doing testing of your BOT++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  debug(this.company)
  var separtedStr=  '';
  try {
    var categories = (yield msc.listCategories(this.company))

    var filteredCategories = [];
    console.time("Time this");
    var filteredData = categories.filter((item,index)=>{return item.company === this.company.order_sys_id && item.active});
    // for (let i = 1; i < categories.length; i++) {
    //   if (categories[i].company === this.company.order_sys_id && categories[i].active) {
    //     categories[i].title = categories[i].name
    //     filteredCategories.push(categories[i])
    //     separtedStr = filteredCategories.join(',')
    //   }
    // }
    console.timeEnd("Time this");
    filteredData.forEach(x=>{
      delete x.meta;
      delete x.relationships;
    });
    // console.log('*********************************************************************************',filteredCategories)
  } catch (err) {
    console.error('error retrieving categories from ordering system ')
    throw(err)
  }
  debug(categories)
  this.body = {data : filteredData}
  return;
}

exports.getactivecategories=function *(next) {
  debug('listCategories')
  debug(this.company)
  try {
    var categories = (yield msc.listCategories(this.company))

    var filteredCategories = []
    for (let i = 0; i < categories.length; i++) {
      
      if (categories[i].company === this.company.order_sys_id && categories[i].active) {
        
        categories[i].title = categories[i].name
        filteredCategories.push(categories[i])
      }
    }
  } catch (err) {
    console.error('error retrieving categories from ordering system ');
    this.body = {status:400, message:"Something went wrong"};
    // throw(err)
    return;
  }
  debug(categories)
  this.body = {status:200, data:filteredCategories}
  return;
}


exports.updateCategory=function *(next) {
    debug('updateCategory')
    if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
        var user = this.passport.user
        if (user.role == auth.OWNER && user.id != this.company.user_id) {
            console.error('error updating category: Owner '+ user.id + 'not associated with '+ this.company.name)
            throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
        }
        debug(this.category.company +'=='+ this.company.order_sys_id)
        if (this.category.company == this.company.order_sys_id) {

            var data = {
                type: 'category',
                id : this.category.id,
                name: this.body.title,
                company: this.company.order_sys_id,
                active : this.body.active
            }

            debug('data '+ data.toString())
            try {
                var results = yield msc.updateCategory(this.category.id, data)
                debug(results)
                results.title = results.name
            } catch (err) {
                console.error('error updating category ('+ id +')')
                throw(err)
            }
            debug(results)
            this.body = {status:200,data: results}
            return;
            } else {
            console.error('updateCategory: Category does not belong to company')
            this.status=400
            this.body = {status:400,error: 'Category does not belong to company'}
            return;
            }
    } else {
        console.error('updateCategory: User not authorized')
        this.status=401
        this.body = {status:401,error: 'User not authorized'}
        return;
    }
}

exports.deleteCategory=function *(next) {
    var meta = { fn: 'deleteCategory', company_id: this.company.id, default_cat: this.company.default_cat, 
        category_id: this.category.id};
    logger.info('Deleting category', meta);
    if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
        var user = this.passport.user
        if (user.role == auth.OWNER && user.id != this.company.user_id) {
            console.error('error deleting category: Owner '+ user.id + 'not associated with '+ this.company.name)
            throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
        }
        debug(this.category.company +'=='+ this.company.order_sys_id)
        if (this.category.company == this.company.order_sys_id) {
            var result = '';      
            try {
                results = yield msc.deleteCategory(this.company.default_cat, this.category.id);
            } catch (err) {
                meta.error = err;
                logger.error('Error deleting category', meta);
                throw(err)
            }
            debug(results);
            this.body = { status:200, data:results}
            return;
        } else {
            meta.order_sys_id = this.company.order_sys_id;
            meta.category_company_id = this.category.company;
            logger.error('Cannot delete: Category does not belong to company', meta)
            this.throw(400,  'Category does not belong to company');
        }
    } else {
        console.error('deleteCategory: User not authorized')
        this.throw(401, 'User not authorized');
    }
}

exports.createMenuItem=function *(next) {
  debug('createMenuItem')
  var meta={fn:'createMenuItem'};
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        meta.error='error creating menu item: Owner '+ user.id + 'not associated with '+ this.company.name;
        logger.error('error creating menu item: Owner '+ user.id + 'not associated with '+ this.company.name, meta);
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug('...user authorized')
    debug('category company', this.category.company);
    debug('this category', this.category);
    debug('this company', this.company);
    debug(this.category.company +'=='+ this.company.order_sys_id)
    if (this.category.company == this.company.order_sys_id) {
      debug('..category and company match')

      var company = this.company
      var title = this.body.title;
      var price = this.body.price;
      var status = this.body.status;
      var category = this.category.id;
      var description = this.body.description;

      var addOnMultiple = this.body.addOnMultiple ?  this.body.addOnMultiple.split(',') : '';
      var addOnPrice = this.body.addOnPrice ? this.body.addOnPrice.split(',') : '';
      var optionSingle = this.body.optionSingle ? this.body.optionSingle.split(',') : '';
      var optionSinglePrice = this.body.optionSinglePrice ? this.body.optionSinglePrice.split(',') : '';
      var optionCategory = this.body.optionCategory ? this.body.optionCategory.split(',') : '';
      var instructions = this.body.instructions  ? this.body.instructions.split(',') : '';

      if (!status) status = 1; // live by default TODO: turn draft by default when menu availability completed
      if (!title) {
        this.status = 400;
        return this.body = {status:400, error: 'Title is required.'};
      }
      if (!price) {
        this.status = 400;
        return this.body = { status:400,error: 'Price is required.'};
      }
      if (!description) {
        this.status = 400;
        return this.body = {status:400,  error: 'Description is required.'};
      }
      var taxBand = '';
      var currency = '';
      if (company.country_id){
        try{
          var country = (yield Country.getSingleCountry(company.country_id))[0];
          taxBand=country.tax_band;
          currency = country.currency;
        }
        catch(err){
          meta.error=err;
          logger.error('error retrieving country tax band', meta);
          this.body= {status:400, message:"error retrieving country tax band"};
          throw(err);
        }
      }
      debug('..creating menu item');
      try {
           
           // fetch product under category
           var category_id  = {id : this.category.id }
           var categoryResults = yield msc.listMenuItems(category_id)
           var filteredItems = categoryResults
              /*if (categoryResults && categoryResults.length > 0){

                  for (var j=0; j<categoryResults.length; j++){

                    if (categoryResults[j].category === this.category.id) { 
                      filteredItems.push(categoryResults[j])
                    }
                  }
              }*/

            if(filteredItems.length > 0)
            {
              console.log('product hai ')
              if(filteredItems[0].relationships.hasOwnProperty('variations'))
              {
                 console.log('>>> variation haiiiii')
                 var variationId = filteredItems[0].relationships.variations.data[0].id ;
              }
              else
              {
                console.log('variation nahi hai ')
                var createVariation = yield msc.createOptionCategory('EXTRAS')
                var variationId =  createVariation.id ;

                for (var i=0;i<filteredItems.length;i++){
                      
                      var ItemId = filteredItems[i].id ;
                      
                      var relationship_result = yield msc.createRelationship(ItemId, variationId)
                      
                  }

              }
              
            }
            else
            {
              var createVariation = yield msc.createOptionCategory('EXTRAS')
               var variationId =  createVariation.id ;
               console.log('product nahi hai')
              
            }

            var created_menuItem = yield msc.createMenuItem(company, title, status, price, category, description, taxBand, currency,addOnMultiple,addOnPrice,optionSingle,optionSinglePrice,instructions,optionCategory,'')
              
            var menuItem = yield msc.createRelationship(created_menuItem.id, variationId)

            if (menuItem.price && Array.isArray(menuItem.price)) {
                  for (let o = 0; o < menuItem.price.length; o++) {
                    if (menuItem.price[o].amount) {
                      menuItem.price[o].amount /= PRICE_MODIFIER
                    }
                  }
                }

                if (menuItem.meta && menuItem.meta.display_price) {
                  if (menuItem.meta.display_price.with_tax && menuItem.meta.display_price.with_tax.amount) {
                    menuItem.meta.display_price.with_tax.amount /= PRICE_MODIFIER
                  }

                  if (menuItem.meta.display_price.without_tax && menuItem.meta.display_price.without_tax.amount) {
                    menuItem.meta.display_price.without_tax.amount /= PRICE_MODIFIER
                  }
                }
            //var menuItem = filteredItems


        
      } catch (err) {
        meta.error=err;
        logger.error('error creating menu item in ordering system ', meta);
        this.body={status:400, message:'error creating menu item in ordering system '};
        throw(err)
      }
      debug(menuItem)
      this.body = {status:200,data: menuItem}
      return;
    } else {
      meta.error='Category does not belong to company';
      logger.error('createMenuItem: Category does not belong to company', meta);
      this.status=400
      this.body = {status:400, error: 'Category does not belong to company'}
      return;
    }
  } else {
    meta.error='User not authorized';
    logger.error('createMenuItem: User not authorized', meta);
    this.status=401
    this.body = {status:401, error: 'User not authorized'}
    return;
  }
}

function decimalDevide(a,b) {
  let data = parseFloat((a/b).toFixed(12));
  // console.log('#########################################################################',data)
  return data;
}
function decimalMultiply(a,b) {
  let data = parseFloat((a*b).toFixed(12));
  // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$',data)
  return data;
}


exports.listMenuItemsForComapny=function *(next) {
  var categories = (yield msc.listCategories(this.company));
  categories = categories.filter((item)=>{return item.active});
  var filteredItems = [];
  for(let cat of categories){
    this.category = cat;
      var meta = { fn: 'listMenuItems', company_id: this.company.id, category_id: this.category.id};
      logger.info('List menu items', meta);
      var data = this.body;
      console.log(this.params);
    if (!data)  data = ''
    debug(data)
    try {
      meta.country_id = this.company.country_id;
      logger.info('Getting country', meta);
      var country = (yield Country.getSingleCountry(this.company.country_id))[0];
      meta.currency = country.currency;
      logger.info('And got currency', meta);
      var results = (yield msc.listMenuItems(this.category, country.currency));
      
      debug('Found '+ results.length +' items');
      //return results;
     
      if (results && results.length > 0) {
          // for (var j=0; j<results.length; j++) {
            for (let item of results) {

              // TODO: remove when moltin filter works
              console.log('MENU ITEM,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',item,this.category, country.currency,results.length)
              debug(item); 
              //if (item.category === this.category.id) {
                  /*------ json mapping start ---- */
                  item['title'] = item.name ;
                  if(item.instruction){
                    item['instruction'] = splitNoParen(item['instruction'])
                  }
                  if(item.addonmultiple){
                    item['addonmultiple'] = splitNoParen(item['addonmultiple'])
                  }
                  if(item.optionsingle){
                    item['optionsingle'] = splitNoParen(item['optionsingle'])
                  }
                  if(item.addonprice){
                    item['addonprice'] = splitNoParen(item['addonprice'])
                  }
                  if(item.optionsingleprice){
                    item['optionsingleprice'] = splitNoParen(item['optionsingleprice'])
                  }

                  item['is_variation'] = true ;
                  if(item.hasOwnProperty('relationships')) {
                      var relationship =  item.relationships
                      if (relationship.hasOwnProperty('main_image')) {
                          if(Array.isArray(relationship.main_image.data) == false ) {
                              var fileId = relationship.main_image.data.id ; 
                              var FileDetail = yield msc.getFile(fileId) ;
                              var url = FileDetail.link.href;
                              var http = url.replace(/^https?\:\/\//i, "http://");
                              var newUrl = { http : http , https : url }
                              item.relationships.main_image.data.url = newUrl ;
                          } else {
                              for (var x=0; x<relationship.main_image.data.length;x++) {
                                  var fileId = relationship.main_image.data.id ; 
                                  var FileDetail = yield msc.getFile(fileId) ;
                                  var url = FileDetail.link.href;
                                  var http = url.replace(/^https?\:\/\//i, "http://");
                                  var newUrl = { http : http , https : url }
                                  item.relationships.main_image.data[x].url = newUrl ;
                              }
                          }
                      }
                  }
                  /*--- json mapping end ----*/

                  if (item.price && Array.isArray(item.price)) {
                      for (let o = 0; o < item.price.length; o++) {
                          if (item.price[o].amount) {
                              item.price[o].amount /= PRICE_MODIFIER
                          }
                      }
                  }
                  if (item.meta && item.meta.display_price) {
                      if (item.meta.display_price.with_tax && item.meta.display_price.with_tax.amount) {
                          item.meta.display_price.with_tax.amount /= PRICE_MODIFIER
                      }
                      if (item.meta.display_price.without_tax && item.meta.display_price.without_tax.amount) {
                          item.meta.display_price.without_tax.amount /= PRICE_MODIFIER
                      }
                  }
                  // Mapping variation in json
                  if (relationship.hasOwnProperty('variations')) {
                      var optionObject = {
                              title        : item.name, 
                              instructions : " " , 
                              product      : item.id ,
                              variations : { }
                          }
                      var modifer = {}
                      if (Array.isArray(relationship.variations.data) == true ) {
                          for (var i=0;i<relationship.variations.data.length;i++) {
                              var variationId =  relationship.variations.data[i].id 
                              var VariationDetail = yield msc.findoptionCategory(variationId) 
                              if (VariationDetail.hasOwnProperty('options')) {
                                  if (Array.isArray(VariationDetail.options) == true ) {
                                      for(var k=0;k<VariationDetail.options.length;k++) {
                                          if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
                                              if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {
                                                  for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
                                                      if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
                                                          // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                                                          var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
                                                          // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                          optionObject.variations[VariationDetail.options[k].id] = {
                                                              title      : VariationDetail.options[k].name ,
                                                              product    : item.id,
                                                              modifer    : VariationDetail.options[k].modifiers[m].id,
                                                              mod_price  : "+"+price ,
                                                              id         : VariationDetail.options[k].id,
                                                              difference : price
                                                          }

                                                          modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                              id : VariationDetail.options[k].modifiers[m].id,
                                                              order : null,
                                                              type : {
                                                                  value : VariationDetail.options[k].modifiers[m].type,
                                                                  data  : VariationDetail.options[k].modifiers[m].value[0]
                                                              }
                                                          }


                                                      } else {
                                                          modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                              id : VariationDetail.options[k].modifiers[m].id,
                                                              order : null,
                                                              type : {
                                                                  value : VariationDetail.options[k].modifiers[m].type,
                                                                  data  : VariationDetail.options[k].modifiers[m].value
                                                              }
                                                          }
                                                      }
                                                  }
                                              } else {
                                                  if(VariationDetail.options[k].modifiers.type === "price_increment") {
                                                      // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ; 
                                                      var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER);
                                                      // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                      optionObject.variations[VariationDetail.options[k].id] = {
                                                          title      : VariationDetail.options[k].name ,
                                                          product    : item.id,
                                                          modifer    : VariationDetail.options[k].modifiers.id,
                                                          mod_price  : "+"+price ,
                                                          id         : VariationDetail.options[k].id,
                                                          difference : price
                                                      }

                                                      modifer[VariationDetail.options[k].modifiers.id] = {
                                                          id : VariationDetail.options[k].modifiers.id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options[k].modifiers.type,
                                                              data  : VariationDetail.options[k].modifiers.value[0]
                                                          }
                                                      }
                                                  } else {
                                                      modifer[VariationDetail.options[k].modifiers.id] = {
                                                          id : VariationDetail.options[k].modifiers.id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options[k].modifiers.type,
                                                              data  : VariationDetail.options[k].modifiers.value
                                                          }
                                                      }
                                                  }
                                              }
                                          }
                                      }
                                  } else {
                                      if(VariationDetail.options.hasOwnProperty('modifiers')) {
                                          if(Array.isArray(VariationDetail.options.modifiers) == true ) {
                                              for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
                                                  if(VariationDetail.options.modifiers[m].type === 'price_increment') {
                                                      // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                                                      var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
                                                      // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                      optionObject.variations[VariationDetail.options.id] = {
                                                          title      : VariationDetail.options.name ,
                                                          product    : item.id,
                                                          modifer    : VariationDetail.options.modifiers[m].id,
                                                          mod_price  : "+"+price ,
                                                          id         : VariationDetail.options.id,
                                                          difference : price
                                                      }

                                                      modifer[VariationDetail.options.modifiers[m].id] = {
                                                          id : VariationDetail.options.modifiers[m].id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options.modifiers[m].type,
                                                              data  : VariationDetail.options.modifiers[m].value[0]
                                                          }
                                                      }
                                                  } else {
                                                      modifer[VariationDetail.options.modifiers[m].id] = {
                                                          id : VariationDetail.options.modifiers[m].id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options.modifiers[m].type,
                                                              data  : VariationDetail.options.modifiers[m].value
                                                          }
                                                      }
                                                  }
                                              }
                                          } else {
                                              if  (VariationDetail.options.modifiers.type === 'price_increment') {
                                                  // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
                                                  var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
                                                  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                  optionObject.variations[VariationDetail.options.id] = {
                                                      title      : VariationDetail.options.name ,
                                                      product    : item.id,
                                                      modifer    : VariationDetail.options.modifiers.id,
                                                      mod_price  : "+"+price ,
                                                      id         : VariationDetail.options.id,
                                                      difference : price
                                                  }

                                                  modifer[VariationDetail.options.modifiers.id] = {
                                                      id : VariationDetail.options.modifiers.id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options.modifiers.type,
                                                          data  : VariationDetail.options.modifiers.value[0]
                                                      }
                                                  }

                                              } else {
                                                  modifer[VariationDetail.options.modifiers.id] = {
                                                          id : VariationDetail.options.modifiers.id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options.modifiers.type,
                                                              data  : VariationDetail.options.modifiers.value
                                                          }
                                                      }
                                              }
                                          }
                                      }
                                  }
                              } 
                          }
                      }

                      if(isEmpty(modifer) == false)
                        {
                          item['is_variation'] = true ;
                          optionObject['modifiers'] = modifer 

                          var newResult = [item,optionObject]
                        }
                        else
                        {
                          item['is_variation'] = false ;
                        
                            var newResult = [item]

                        }

                  }
                  else
                  {                
                    item['is_variation'] = false ;
                    var newResult = [item]
                  }
                  
                  if(newResult[0].hasOwnProperty('meta'))
                  {
                    if(newResult[0].meta.hasOwnProperty('variations'))
                    {
                      newResult[0].relationships['Variations'] = newResult[0].meta.variations

                      delete newResult[0].meta.variations;
                    }
                  }

                  
                  
                  filteredItems.push(newResult[0])
                //}
              }
          }
    } catch (err) {
      console.error('error retrieving menu items from ordering system ')
      this.body = {status:400, message:"Something went wrong"};
      throw(err)
    }
  }
    // TODO: change this to return result when filter works
    debug(filteredItems)
    this.body = {status:200, data: filteredItems}
    return;
}

exports.listsizeMenuItems=function *(next) {
  var meta = { fn: 'listMenuItems', company_id: this.company.id, category_id: this.category.id};
  logger.info('List menu items', meta);
  var data = this.body;
  console.log(this.params);
if (!data)  data = ''
debug(data)
try {
  meta.country_id = this.company.country_id;
  logger.info('Getting country', meta);
  var country = (yield Country.getSingleCountry(this.company.country_id))[0];
  meta.currency = country.currency;
  logger.info('And got currency', meta);
  var results = (yield msc.listMenuItems(this.category, country.currency));
  
  console.log('Found '+ results.length +' items');
  //return results;
  var filteredItems = [];
  if (results && results.length > 0) {
      // for (var j=0; j<results.length; j++) {
        for (let item of results) {

          // TODO: remove when moltin filter works
          // console.log(item); 
          //if (item.category === this.category.id) {
              /*------ json mapping start ---- */
              let obj= {};
              obj['title'] = item.name ;
              // if(item.instruction){
              //   obj['instruction'] = splitNoParen(item['instruction'])
              // }
              // if(item.addonmultiple){
              //   obj['addonmultiple'] = splitNoParen(item['addonmultiple'])
              // }
                obj['optionsingle'] = item.optionsingle ? splitNoParen(item['optionsingle']) : null
                obj['optioncategory'] = item.optioncategory ? (item['optioncategory']) :null
                obj['optionsingleprice'] = item.optionsingleprice ? splitNoParen(item['optionsingleprice']):null
              filteredItems.push(obj)
            //}
          }
      }
} catch (err) {
  console.error('error retrieving menu items from ordering system ');
  this.body = {status:400, message:"Something went wrong"};
  // throw(err)
  return;
}
// TODO: change this to return result when filter works
debug(filteredItems)
this.body = {status:200, data: filteredItems}
return;
}

// exports.listMenuItems=function *(next) {
//     var meta = { fn: 'listMenuItems', company_id: this.company.id, category_id: this.category.id};
//     logger.info('List menu items', meta);
//     var data = this.body;
//     console.log(this.params);
//   if (!data)  data = ''
//   debug(data)
//   try {
//     meta.country_id = this.company.country_id;
//     logger.info('Getting country', meta);
//     var country = (yield Country.getSingleCountry(this.company.country_id))[0];
//     meta.currency = country.currency;
//     logger.info('And got currency', meta);
//     var results = (yield msc.listMenuItems(this.category, country.currency));
    
//     debug('Found '+ results.length +' items');
//     //return results;
//     var filteredItems = [];
//     if (results && results.length > 0) {
//         // for (var j=0; j<results.length; j++) {
//           for (let item of results) {

//             // TODO: remove when moltin filter works
//             debug(item); 
//             //if (item.category === this.category.id) {
//                 /*------ json mapping start ---- */
//                 item['title'] = item.name ;
//                 if(item.instruction){
//                   item['instruction'] = splitNoParen(item['instruction'])
//                 }
//                 if(item.addonmultiple){
//                   item['addonmultiple'] = splitNoParen(item['addonmultiple'])
//                 }
//                 if(item.optionsingle){
//                   item['optionsingle'] = splitNoParen(item['optionsingle'])
//                 }
//                 if(item.addonprice){
//                   item['addonprice'] = splitNoParen(item['addonprice'])
//                 }
//                 if(item.optionsingleprice){
//                   item['optionsingleprice'] = splitNoParen(item['optionsingleprice'])
//                 }

//                 let addons = [];
//                 let d = item['addonmultiple'] ? (item['addonmultiple']) : null;
//                 for(let i=0;i<d.length;i++){
//                   addons.push({
//                     title : d[i],
//                     value : (item['addonprice'])[i]
//                   })
//                 }
//                 item['addons']=addons;

//                 let options = [];
//                 let o = item['optionsingle'] ? (item['optionsingle']) : null;
//                 for(let j=0;j<o.length;j++){
//                   options.push({
//                     title : o[j],
//                     value : (item['optionsingleprice'])[j]
//                   })
//                 }
//                 item['options']=options;


//                 item['is_variation'] = true ;
//                 if(item.hasOwnProperty('relationships')) {
//                     var relationship =  item.relationships
//                     if (relationship.hasOwnProperty('main_image')) {
//                         if(Array.isArray(relationship.main_image.data) == false ) {
//                             var fileId = relationship.main_image.data.id ; 
//                             var FileDetail = yield msc.getFile(fileId) ;
//                             var url = FileDetail.link.href;
//                             var http = url.replace(/^https?\:\/\//i, "http://");
//                             var newUrl = { http : http , https : url }
//                             item.relationships.main_image.data.url = newUrl ;
//                         } else {
//                             for (var x=0; x<relationship.main_image.data.length;x++) {
//                                 var fileId = relationship.main_image.data.id ; 
//                                 var FileDetail = yield msc.getFile(fileId) ;
//                                 var url = FileDetail.link.href;
//                                 var http = url.replace(/^https?\:\/\//i, "http://");
//                                 var newUrl = { http : http , https : url }
//                                 item.relationships.main_image.data[x].url = newUrl ;
//                             }
//                         }
//                     }
//                 }
//                 /*--- json mapping end ----*/

//                 if (item.price && Array.isArray(item.price)) {
//                     for (let o = 0; o < item.price.length; o++) {
//                         if (item.price[o].amount) {
//                             item.price[o].amount /= PRICE_MODIFIER
//                         }
//                     }
//                 }
//                 if (item.meta && item.meta.display_price) {
//                     if (item.meta.display_price.with_tax && item.meta.display_price.with_tax.amount) {
//                         item.meta.display_price.with_tax.amount /= PRICE_MODIFIER
//                     }
//                     if (item.meta.display_price.without_tax && item.meta.display_price.without_tax.amount) {
//                         item.meta.display_price.without_tax.amount /= PRICE_MODIFIER
//                     }
//                 }
//                 // Mapping variation in json
//                 if (relationship.hasOwnProperty('variations')) {
//                     var optionObject = {
//                             title        : item.name, 
//                             instructions : " " , 
//                             product      : item.id ,
//                             variations : { }
//                         }
//                     var modifer = {}
//                     if (Array.isArray(relationship.variations.data) == true ) {
//                         for (var i=0;i<relationship.variations.data.length;i++) {
//                             var variationId =  relationship.variations.data[i].id 
//                             var VariationDetail = yield msc.findoptionCategory(variationId) 
//                             if (VariationDetail.hasOwnProperty('options')) {
//                                 if (Array.isArray(VariationDetail.options) == true ) {
//                                     for(var k=0;k<VariationDetail.options.length;k++) {
//                                         if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
//                                             if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {
//                                                 for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
//                                                     if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
//                                                         // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
//                                                         var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
//                                                         // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
//                                                         optionObject.variations[VariationDetail.options[k].id] = {
//                                                             title      : VariationDetail.options[k].name ,
//                                                             product    : item.id,
//                                                             modifer    : VariationDetail.options[k].modifiers[m].id,
//                                                             mod_price  : "+"+price ,
//                                                             id         : VariationDetail.options[k].id,
//                                                             difference : price
//                                                         }

//                                                         modifer[VariationDetail.options[k].modifiers[m].id] = {
//                                                             id : VariationDetail.options[k].modifiers[m].id,
//                                                             order : null,
//                                                             type : {
//                                                                 value : VariationDetail.options[k].modifiers[m].type,
//                                                                 data  : VariationDetail.options[k].modifiers[m].value[0]
//                                                             }
//                                                         }


//                                                     } else {
//                                                         modifer[VariationDetail.options[k].modifiers[m].id] = {
//                                                             id : VariationDetail.options[k].modifiers[m].id,
//                                                             order : null,
//                                                             type : {
//                                                                 value : VariationDetail.options[k].modifiers[m].type,
//                                                                 data  : VariationDetail.options[k].modifiers[m].value
//                                                             }
//                                                         }
//                                                     }
//                                                 }
//                                             } else {
//                                                 if(VariationDetail.options[k].modifiers.type === "price_increment") {
//                                                     // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ; 
//                                                     var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER);
//                                                     // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
//                                                     optionObject.variations[VariationDetail.options[k].id] = {
//                                                         title      : VariationDetail.options[k].name ,
//                                                         product    : item.id,
//                                                         modifer    : VariationDetail.options[k].modifiers.id,
//                                                         mod_price  : "+"+price ,
//                                                         id         : VariationDetail.options[k].id,
//                                                         difference : price
//                                                     }

//                                                     modifer[VariationDetail.options[k].modifiers.id] = {
//                                                         id : VariationDetail.options[k].modifiers.id,
//                                                         order : null,
//                                                         type : {
//                                                             value : VariationDetail.options[k].modifiers.type,
//                                                             data  : VariationDetail.options[k].modifiers.value[0]
//                                                         }
//                                                     }
//                                                 } else {
//                                                     modifer[VariationDetail.options[k].modifiers.id] = {
//                                                         id : VariationDetail.options[k].modifiers.id,
//                                                         order : null,
//                                                         type : {
//                                                             value : VariationDetail.options[k].modifiers.type,
//                                                             data  : VariationDetail.options[k].modifiers.value
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                 } else {
//                                     if(VariationDetail.options.hasOwnProperty('modifiers')) {
//                                         if(Array.isArray(VariationDetail.options.modifiers) == true ) {
//                                             for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
//                                                 if(VariationDetail.options.modifiers[m].type === 'price_increment') {
//                                                     // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
//                                                     var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
//                                                     // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
//                                                     optionObject.variations[VariationDetail.options.id] = {
//                                                         title      : VariationDetail.options.name ,
//                                                         product    : item.id,
//                                                         modifer    : VariationDetail.options.modifiers[m].id,
//                                                         mod_price  : "+"+price ,
//                                                         id         : VariationDetail.options.id,
//                                                         difference : price
//                                                     }

//                                                     modifer[VariationDetail.options.modifiers[m].id] = {
//                                                         id : VariationDetail.options.modifiers[m].id,
//                                                         order : null,
//                                                         type : {
//                                                             value : VariationDetail.options.modifiers[m].type,
//                                                             data  : VariationDetail.options.modifiers[m].value[0]
//                                                         }
//                                                     }
//                                                 } else {
//                                                     modifer[VariationDetail.options.modifiers[m].id] = {
//                                                         id : VariationDetail.options.modifiers[m].id,
//                                                         order : null,
//                                                         type : {
//                                                             value : VariationDetail.options.modifiers[m].type,
//                                                             data  : VariationDetail.options.modifiers[m].value
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                         } else {
//                                             if  (VariationDetail.options.modifiers.type === 'price_increment') {
//                                                 // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
//                                                 var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
//                                                 // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
//                                                 optionObject.variations[VariationDetail.options.id] = {
//                                                     title      : VariationDetail.options.name ,
//                                                     product    : item.id,
//                                                     modifer    : VariationDetail.options.modifiers.id,
//                                                     mod_price  : "+"+price ,
//                                                     id         : VariationDetail.options.id,
//                                                     difference : price
//                                                 }

//                                                 modifer[VariationDetail.options.modifiers.id] = {
//                                                     id : VariationDetail.options.modifiers.id,
//                                                     order : null,
//                                                     type : {
//                                                         value : VariationDetail.options.modifiers.type,
//                                                         data  : VariationDetail.options.modifiers.value[0]
//                                                     }
//                                                 }

//                                             } else {
//                                                 modifer[VariationDetail.options.modifiers.id] = {
//                                                         id : VariationDetail.options.modifiers.id,
//                                                         order : null,
//                                                         type : {
//                                                             value : VariationDetail.options.modifiers.type,
//                                                             data  : VariationDetail.options.modifiers.value
//                                                         }
//                                                     }
//                                             }
//                                         }
//                                     }
//                                 }
//                             } 
//                         }
//                     }

//                     if(isEmpty(modifer) == false)
//                       {
//                         item['is_variation'] = true ;
//                          optionObject['modifiers'] = modifer 

//                          var newResult = [item,optionObject]
//                       }
//                       else
//                       {
//                         item['is_variation'] = false ;
                      
//                           var newResult = [item]

//                       }

//                 }
//                 else
//                 {                
//                   item['is_variation'] = false ;
//                   var newResult = [item]
//                 }
                
//                 if(newResult[0].hasOwnProperty('meta'))
//                 {
//                   if(newResult[0].meta.hasOwnProperty('variations'))
//                   {
//                     newResult[0].relationships['Variations'] = newResult[0].meta.variations

//                     delete newResult[0].meta.variations;
//                   }
//                 }

                
                
//                 filteredItems.push(newResult)
//               //}
//             }
//         }
//   } catch (err) {
//     console.error('error retrieving menu items from ordering system ');
//     this.body = {status:400, message:"Something went wrong"};
//     // throw(err)
//     return;
//   }
//   // TODO: change this to return result when filter works
//   debug(filteredItems)
//   this.body = {status:200, data: filteredItems[0]}
//   return;
// }



exports.listMenuItems=function *(next) {
  var meta = { fn: 'listMenuItems', company_id: this.company.id, category_id: this.category.id};
  logger.info('List menu items', meta);
  var data = this.body;
  console.log(this.params);
if (!data)  data = ''
debug(data)
try {
  meta.country_id = this.company.country_id;
  logger.info('Getting country', meta);
  var country = (yield Country.getSingleCountry(this.company.country_id))[0];
  meta.currency = country.currency;
  logger.info('And got currency', meta);
  var results = (yield msc.listMenuItems(this.category, country.currency));
  
  debug('Found '+ results.length +' items');
  //return results;
  var filteredItems = [];
  if (results && results.length > 0) {
      // for (var j=0; j<results.length; j++) {
        for (let item of results) {

          // TODO: remove when moltin filter works
          debug(item); 
          //if (item.category === this.category.id) {
              /*------ json mapping start ---- */
              item['title'] = item.name ;
              if(item.instruction){
                item['instruction'] = splitNoParen(item['instruction'])
              }
              if(item.addonmultiple){
                item['addonmultiple'] = splitNoParen(item['addonmultiple'])
              }
              if(item.optionsingle){
                item['optionsingle'] = splitNoParen(item['optionsingle'])
              }
              if(item.addonprice){
                item['addonprice'] = splitNoParen(item['addonprice'])
              }
              if(item.optionsingleprice){
                item['optionsingleprice'] = splitNoParen(item['optionsingleprice'])
              }

              let addons = [];
              let d = item['addonmultiple'] ? (item['addonmultiple']) : null;
              for(let i=0;i<d.length;i++){
                addons.push({
                  title : d[i],
                  value : (item['addonprice'])[i]
                })
              }
              item['addons']=addons;

              let options = [];
              let o = item['optionsingle'] ? (item['optionsingle']) : null;
              for(let j=0;j<o.length;j++){
                options.push({
                  title : o[j],
                  value : (item['optionsingleprice'])[j]
                })
              }
              item['options']=options;


              item['is_variation'] = true ;
              if(item.hasOwnProperty('relationships')) {
                  var relationship =  item.relationships
                  if (relationship.hasOwnProperty('main_image')) {
                      if(Array.isArray(relationship.main_image.data) == false ) {
                          var fileId = relationship.main_image.data.id ; 
                          var FileDetail = yield msc.getFile(fileId) ;
                          var url = FileDetail.link.href;
                          var http = url.replace(/^https?\:\/\//i, "http://");
                          var newUrl = { http : http , https : url }
                          item.relationships.main_image.data.url = newUrl ;
                      } else {
                          for (var x=0; x<relationship.main_image.data.length;x++) {
                              var fileId = relationship.main_image.data.id ; 
                              var FileDetail = yield msc.getFile(fileId) ;
                              var url = FileDetail.link.href;
                              var http = url.replace(/^https?\:\/\//i, "http://");
                              var newUrl = { http : http , https : url }
                              item.relationships.main_image.data[x].url = newUrl ;
                          }
                      }
                  }
              }
              /*--- json mapping end ----*/

              if (item.price && Array.isArray(item.price)) {
                  for (let o = 0; o < item.price.length; o++) {
                      if (item.price[o].amount) {
                          item.price[o].amount /= PRICE_MODIFIER
                      }
                  }
              }
              if (item.meta && item.meta.display_price) {
                  if (item.meta.display_price.with_tax && item.meta.display_price.with_tax.amount) {
                      item.meta.display_price.with_tax.amount /= PRICE_MODIFIER
                  }
                  if (item.meta.display_price.without_tax && item.meta.display_price.without_tax.amount) {
                      item.meta.display_price.without_tax.amount /= PRICE_MODIFIER
                  }
              }
              // Mapping variation in json
              if (relationship.hasOwnProperty('variations')) {
                  var optionObject = {
                          title        : item.name, 
                          instructions : " " , 
                          product      : item.id ,
                          variations : { }
                      }
                  var modifer = {}
                  if (Array.isArray(relationship.variations.data) == true ) {
                      for (var i=0;i<relationship.variations.data.length;i++) {
                          var variationId =  relationship.variations.data[i].id 
                          var VariationDetail = yield msc.findoptionCategory(variationId) 
                          if (VariationDetail.hasOwnProperty('options')) {
                              if (Array.isArray(VariationDetail.options) == true ) {
                                  for(var k=0;k<VariationDetail.options.length;k++) {
                                      if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
                                          if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {
                                              for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
                                                  if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
                                                      // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                                                      var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
                                                      // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                      optionObject.variations[VariationDetail.options[k].id] = {
                                                          title      : VariationDetail.options[k].name ,
                                                          product    : item.id,
                                                          modifer    : VariationDetail.options[k].modifiers[m].id,
                                                          mod_price  : "+"+price ,
                                                          id         : VariationDetail.options[k].id,
                                                          difference : price
                                                      }

                                                      modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                          id : VariationDetail.options[k].modifiers[m].id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options[k].modifiers[m].type,
                                                              data  : VariationDetail.options[k].modifiers[m].value[0]
                                                          }
                                                      }


                                                  } else {
                                                      modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                          id : VariationDetail.options[k].modifiers[m].id,
                                                          order : null,
                                                          type : {
                                                              value : VariationDetail.options[k].modifiers[m].type,
                                                              data  : VariationDetail.options[k].modifiers[m].value
                                                          }
                                                      }
                                                  }
                                              }
                                          } else {
                                              if(VariationDetail.options[k].modifiers.type === "price_increment") {
                                                  // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ; 
                                                  var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER);
                                                  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                  optionObject.variations[VariationDetail.options[k].id] = {
                                                      title      : VariationDetail.options[k].name ,
                                                      product    : item.id,
                                                      modifer    : VariationDetail.options[k].modifiers.id,
                                                      mod_price  : "+"+price ,
                                                      id         : VariationDetail.options[k].id,
                                                      difference : price
                                                  }

                                                  modifer[VariationDetail.options[k].modifiers.id] = {
                                                      id : VariationDetail.options[k].modifiers.id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options[k].modifiers.type,
                                                          data  : VariationDetail.options[k].modifiers.value[0]
                                                      }
                                                  }
                                              } else {
                                                  modifer[VariationDetail.options[k].modifiers.id] = {
                                                      id : VariationDetail.options[k].modifiers.id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options[k].modifiers.type,
                                                          data  : VariationDetail.options[k].modifiers.value
                                                      }
                                                  }
                                              }
                                          }
                                      }
                                  }
                              } else {
                                  if(VariationDetail.options.hasOwnProperty('modifiers')) {
                                      if(Array.isArray(VariationDetail.options.modifiers) == true ) {
                                          for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
                                              if(VariationDetail.options.modifiers[m].type === 'price_increment') {
                                                  // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                                                  var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
                                                  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                                  optionObject.variations[VariationDetail.options.id] = {
                                                      title      : VariationDetail.options.name ,
                                                      product    : item.id,
                                                      modifer    : VariationDetail.options.modifiers[m].id,
                                                      mod_price  : "+"+price ,
                                                      id         : VariationDetail.options.id,
                                                      difference : price
                                                  }

                                                  modifer[VariationDetail.options.modifiers[m].id] = {
                                                      id : VariationDetail.options.modifiers[m].id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options.modifiers[m].type,
                                                          data  : VariationDetail.options.modifiers[m].value[0]
                                                      }
                                                  }
                                              } else {
                                                  modifer[VariationDetail.options.modifiers[m].id] = {
                                                      id : VariationDetail.options.modifiers[m].id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options.modifiers[m].type,
                                                          data  : VariationDetail.options.modifiers[m].value
                                                      }
                                                  }
                                              }
                                          }
                                      } else {
                                          if  (VariationDetail.options.modifiers.type === 'price_increment') {
                                              // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
                                              var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
                                              // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                              optionObject.variations[VariationDetail.options.id] = {
                                                  title      : VariationDetail.options.name ,
                                                  product    : item.id,
                                                  modifer    : VariationDetail.options.modifiers.id,
                                                  mod_price  : "+"+price ,
                                                  id         : VariationDetail.options.id,
                                                  difference : price
                                              }

                                              modifer[VariationDetail.options.modifiers.id] = {
                                                  id : VariationDetail.options.modifiers.id,
                                                  order : null,
                                                  type : {
                                                      value : VariationDetail.options.modifiers.type,
                                                      data  : VariationDetail.options.modifiers.value[0]
                                                  }
                                              }

                                          } else {
                                              modifer[VariationDetail.options.modifiers.id] = {
                                                      id : VariationDetail.options.modifiers.id,
                                                      order : null,
                                                      type : {
                                                          value : VariationDetail.options.modifiers.type,
                                                          data  : VariationDetail.options.modifiers.value
                                                      }
                                                  }
                                          }
                                      }
                                  }
                              }
                          } 
                      }
                  }

                  if(isEmpty(modifer) == false)
                    {
                      item['is_variation'] = true ;
                       optionObject['modifiers'] = modifer 

                       var newResult = [item,optionObject]
                    }
                    else
                    {
                      item['is_variation'] = false ;
                    
                        var newResult = [item]

                    }

              }
              else
              {                
                item['is_variation'] = false ;
                var newResult = [item]
              }
              
              if(newResult[0].hasOwnProperty('meta'))
              {
                if(newResult[0].meta.hasOwnProperty('variations'))
                {
                  newResult[0].relationships['Variations'] = newResult[0].meta.variations

                  delete newResult[0].meta.variations;
                }
              }

              
              delete newResult[0].addonprice;
              delete newResult[0].addonmultiple;
              delete newResult[0].optionsingle;
              delete newResult[0].optionsingleprice;
              delete newResult[0].optioncategory;
              delete newResult[0].manage_stock;
              delete newResult[0].commodity_type;
              delete newResult[0].status;
              delete newResult[0].meta;
              delete newResult[0].relationships;
              delete newResult[0].title;
              delete newResult[0].is_variation;
              filteredItems.push(newResult[0])
            //}
          }
      }
} catch (err) {
  console.error('error retrieving menu items from ordering system ');
  this.body = {status:400, message:"Something went wrong"};
  // throw(err)
  return;
}
// TODO: change this to return result when filter works
debug(filteredItems)
this.body = {status:200, data: filteredItems}
return;
}

exports.readProductItem=function *(next) {
	
  debug(this.menuItem)
  var menuItemDetail = this.menuItem ;
  menuItemDetail['title'] = menuItemDetail.name ;

 var filteredItems = [];
 /*------ json mapping start ---- */
 menuItemDetail['is_variation'] = true ;
 if(menuItemDetail.instruction){
  menuItemDetail['instruction'] = splitNoParen(menuItemDetail['instruction'])
}
if(menuItemDetail.addonmultiple){
  menuItemDetail['addonmultiple'] = splitNoParen(menuItemDetail['addonmultiple'])
}
if(menuItemDetail.optionsingle){
  menuItemDetail['optionsingle'] = splitNoParen(menuItemDetail['optionsingle'])
}
if(menuItemDetail.addonprice){
  menuItemDetail['addonprice'] = splitNoParen(menuItemDetail['addonprice'])
}
if(menuItemDetail.optionsingleprice){
  menuItemDetail['optionsingleprice'] = splitNoParen(menuItemDetail['optionsingleprice'])
}

if(menuItemDetail.hasOwnProperty('relationships')) {
      var relationship =  menuItemDetail.relationships
      if (relationship.hasOwnProperty('main_image')) {
          if(Array.isArray(relationship.main_image.data) == false ) {
              var fileId = relationship.main_image.data.id ; 
              var FileDetail = yield msc.getFile(fileId) ;
              var url = FileDetail.link.href;
              var http = url.replace(/^https?\:\/\//i, "http://");
              var newUrl = { http : http , https : url }
              menuItemDetail.relationships.main_image.data.url = newUrl ;
          } else {
              for (var x=0; x<relationship.main_image.data.length;x++) {
                  var fileId = relationship.main_image.data.id ; 
                  var FileDetail = yield msc.getFile(fileId) ;
                  var url = FileDetail.link.href;
                  var http = url.replace(/^https?\:\/\//i, "http://");
                  var newUrl = { http : http , https : url }
                  menuItemDetail.relationships.main_image.data[x].url = newUrl ;
              }
          }
      }

}

/*--- json mapping end ----*/
if (menuItemDetail.price && Array.isArray(menuItemDetail.price)) {
    for (let o = 0; o < menuItemDetail.price.length; o++) {
        if (menuItemDetail.price[o].amount) {
            menuItemDetail.price[o].amount /= PRICE_MODIFIER
        }
    }
}
if (menuItemDetail.meta && menuItemDetail.meta.display_price) {
    if (menuItemDetail.meta.display_price.with_tax && menuItemDetail.meta.display_price.with_tax.amount) {
        menuItemDetail.meta.display_price.with_tax.amount /= PRICE_MODIFIER
    }
    if (menuItemDetail.meta.display_price.without_tax && menuItemDetail.meta.display_price.without_tax.amount) {
        menuItemDetail.meta.display_price.without_tax.amount /= PRICE_MODIFIER
    }
}


if (relationship.hasOwnProperty('variations')) {
var optionObject = {
        title        : menuItemDetail.name, 
        instructions : " " , 
        product      : menuItemDetail.id ,
        variations : { }
    }

// Mapping variation in json
var modifer = {}

if (Array.isArray(relationship.variations.data) == true ) {
    for (var i=0;i<relationship.variations.data.length;i++) {
        var variationId =  relationship.variations.data[i].id 
        var VariationDetail = yield msc.findoptionCategory(variationId) 
        if (VariationDetail.hasOwnProperty('options')) {
            if (Array.isArray(VariationDetail.options) == true ) {
                for(var k=0;k<VariationDetail.options.length;k++) {
                    if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
                        if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {

                            for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
                                if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
                                    // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                          var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
                          // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                    optionObject.variations[VariationDetail.options[k].id] = {
                                        title      : VariationDetail.options[k].name ,
                                        product    : menuItemDetail.id,
                                        modifer    : VariationDetail.options[k].modifiers[m].id,
                                        mod_price  : "+"+price ,
                                        id         : VariationDetail.options[k].id,
                                        difference : price
                                    }

                                    modifer[VariationDetail.options[k].modifiers[m].id] = {
                                        id : VariationDetail.options[k].modifiers[m].id,
                                        order : null,
                                        type : {
                                            value : VariationDetail.options[k].modifiers[m].type,
                                            data  : VariationDetail.options[k].modifiers[m].value[0]
                                        }
                                    }


                                } else {
                                    modifer[VariationDetail.options[k].modifiers[m].id] = {
                                        id : VariationDetail.options[k].modifiers[m].id,
                                        order : null,
                                        type : {
                                            value : VariationDetail.options[k].modifiers[m].type,
                                            data  : VariationDetail.options[k].modifiers[m].value
                                        }
                                    }
                                }
                            }
                        } else {
                            if(VariationDetail.options[k].modifiers.type === "price_increment") {
                                // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ; 
                      var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER);
                      // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                optionObject.variations[VariationDetail.options[k].id] = {
                                    title      : VariationDetail.options[k].name ,
                                    product    : menuItemDetail.id,
                                    modifer    : VariationDetail.options[k].modifiers.id,
                                    mod_price  : "+"+price ,
                                    id         : VariationDetail.options[k].id,
                                    difference : price
                                }

                                modifer[VariationDetail.options[k].modifiers.id] = {
                                    id : VariationDetail.options[k].modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options[k].modifiers.type,
                                        data  : VariationDetail.options[k].modifiers.value[0]
                                    }
                                }
                            } else {
                                modifer[VariationDetail.options[k].modifiers.id] = {
                                    id : VariationDetail.options[k].modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options[k].modifiers.type,
                                        data  : VariationDetail.options[k].modifiers.value
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if(VariationDetail.options.hasOwnProperty('modifiers')) {
                    if(Array.isArray(VariationDetail.options.modifiers) == true ) {
                        for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
                            if(VariationDetail.options.modifiers[m].type === 'price_increment') {
                                // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                     var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
                    //  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                optionObject.variations[VariationDetail.options.id] = {
                                    title      : VariationDetail.options.name ,
                                    product    : menuItemDetail.id,
                                    modifer    : VariationDetail.options.modifiers[m].id,
                                    mod_price  : "+"+price ,
                                    id         : VariationDetail.options.id,
                                    difference : price
                                }

                                modifer[VariationDetail.options.modifiers[m].id] = {
                                    id : VariationDetail.options.modifiers[m].id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers[m].type,
                                        data  : VariationDetail.options.modifiers[m].value[0]
                                    }
                                }
                            } else {
                                modifer[Variation1143Detail.options.modifiers[m].id] = {
                                    id : VariationDetail.options.modifiers[m].id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers[m].type,
                                        data  : VariationDetail.options.modifiers[m].value
                                    }
                                }
                            }
                        }
                    } else {
                        if  (VariationDetail.options.modifiers.type === 'price_increment') {
                            // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
                  var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
                  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                            optionObject.variations[VariationDetail.options.id] = {
                                title      : VariationDetail.options.name ,
                                product    : menuItemDetail.id,
                                modifer    : VariationDetail.options.modifiers.id,
                                mod_price  : "+"+price ,
                                id         : VariationDetail.options.id,
                                difference : price
                            }

                            modifer[VariationDetail.options.modifiers.id] = {
                                id : VariationDetail.options.modifiers.id,
                                order : null,
                                type : {
                                    value : VariationDetail.options.modifiers.type,
                                    data  : VariationDetail.options.modifiers.value[0]
                                }
                            }

                        } else {
                            modifer[VariationDetail.options.modifiers.id] = {
                                    id : VariationDetail.options.modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers.type,
                                        data  : VariationDetail.options.modifiers.value
                                    }
                                }
                        }
                    }
                }
            }
        }
    }
}

if(isEmpty(modifer) == false)
{
    menuItemDetail['is_variation'] = true ;
     optionObject['modifiers'] = modifer 
     var newResult = [menuItemDetail,optionObject]
}
else
{
    menuItemDetail['is_variation'] = false ;
  
      var newResult = [menuItemDetail]

}


}
else
{                
  menuItemDetail['is_variation'] = false ;
  var newResult = [menuItemDetail]
}


if(newResult[0].hasOwnProperty('meta'))
{
  if(newResult[0].meta.hasOwnProperty('variations'))
  {
    newResult[0].relationships['Variations'] = newResult[0].meta.variations

    delete newResult[0].meta.variations;
  }
}
  console.log('final >>',newResult)
  //filteredItems.push(newResult)
  let p = newResult.filter((item,index)=>{return item.id==this.params.productId});
  let instruction = {};
  if(p.length > 0 && this.params.type){
    console.log('this.params.typethis.params.type',this.params.type=='instruction',p[0].instruction)
    if(this.params.type=='instruction'){
      instruction['instruction']=p[0].instruction;
    }
    else if(this.params.type=='addons'){
      let data1 = [];
      for(var i=0;i<p[0].addonmultiple.length;i++){
        let obj = {};
        obj.title = p[0].addonmultiple[i];
        obj.value = p[0].addonprice[i];
        data1.push(obj)
      }
      instruction['addons']=data1
    }else{
      instruction=p[0];
    }
  }else{
    instruction=p[0];
  }
  this.body = {status:200,data: instruction}
  return ;
}
exports.readMenuItem=function *(next) {
	
  debug(this.menuItem)
  var menuItemDetail = this.menuItem ;
  menuItemDetail['title'] = menuItemDetail.name ;

 var filteredItems = [];
 /*------ json mapping start ---- */
 menuItemDetail['is_variation'] = true ;
 if(menuItemDetail.instruction){
  menuItemDetail['instruction'] = splitNoParen(menuItemDetail['instruction'])
}
if(menuItemDetail.addonmultiple){
  menuItemDetail['addonmultiple'] = menuItemDetail['addonmultiple'] ? splitNoParen(menuItemDetail['addonmultiple']) : []
}
if(menuItemDetail.addonprice){
  menuItemDetail['addonprice'] = menuItemDetail['addonprice'] ? splitNoParen(menuItemDetail['addonprice']) : []
}

if(menuItemDetail.optionsingle){
  menuItemDetail['optionsingle'] = menuItemDetail['optionsingle'] ? splitNoParen(menuItemDetail['optionsingle']) : []
}
if(menuItemDetail.optionsingleprice){
  menuItemDetail['optionsingleprice'] = menuItemDetail['optionsingleprice'] ? splitNoParen(menuItemDetail['optionsingleprice']) : []
}

let addons = [];
let d = menuItemDetail['addonmultiple'] ? (menuItemDetail['addonmultiple']) : null;
for(let i=0;i<d.length;i++){
  addons.push({
    title : d[i],
    value : (menuItemDetail['addonprice'])[i]
  })
}
menuItemDetail['addons']=addons;

let options = [];
let o = menuItemDetail['optionsingle'] ? (menuItemDetail['optionsingle']) : null;
for(let j=0;j<o.length;j++){
  options.push({
    title : o[j],
    value : (menuItemDetail['optionsingleprice'])[j]
  })
}
menuItemDetail['options']=options;


if(menuItemDetail.hasOwnProperty('relationships')) {
      var relationship =  menuItemDetail.relationships
      if (relationship.hasOwnProperty('main_image')) {
          if(Array.isArray(relationship.main_image.data) == false ) {
              var fileId = relationship.main_image.data.id ; 
              var FileDetail = yield msc.getFile(fileId) ;
              var url = FileDetail.link.href;
              var http = url.replace(/^https?\:\/\//i, "http://");
              var newUrl = { http : http , https : url }
              menuItemDetail.relationships.main_image.data.url = newUrl ;
          } else {
              for (var x=0; x<relationship.main_image.data.length;x++) {
                  var fileId = relationship.main_image.data.id ; 
                  var FileDetail = yield msc.getFile(fileId) ;
                  var url = FileDetail.link.href;
                  var http = url.replace(/^https?\:\/\//i, "http://");
                  var newUrl = { http : http , https : url }
                  menuItemDetail.relationships.main_image.data[x].url = newUrl ;
              }
          }
      }

}

/*--- json mapping end ----*/
if (menuItemDetail.price && Array.isArray(menuItemDetail.price)) {
    for (let o = 0; o < menuItemDetail.price.length; o++) {
        if (menuItemDetail.price[o].amount) {
            menuItemDetail.price[o].amount /= PRICE_MODIFIER
        }
    }
}
if (menuItemDetail.meta && menuItemDetail.meta.display_price) {
    if (menuItemDetail.meta.display_price.with_tax && menuItemDetail.meta.display_price.with_tax.amount) {
        menuItemDetail.meta.display_price.with_tax.amount /= PRICE_MODIFIER
    }
    if (menuItemDetail.meta.display_price.without_tax && menuItemDetail.meta.display_price.without_tax.amount) {
        menuItemDetail.meta.display_price.without_tax.amount /= PRICE_MODIFIER
    }
}


if (relationship.hasOwnProperty('variations')) {
var optionObject = {
        title        : menuItemDetail.name, 
        instructions : " " , 
        product      : menuItemDetail.id ,
        variations : { }
    }

// Mapping variation in json
var modifer = {}

if (Array.isArray(relationship.variations.data) == true ) {
    for (var i=0;i<relationship.variations.data.length;i++) {
        var variationId =  relationship.variations.data[i].id 
        var VariationDetail = yield msc.findoptionCategory(variationId) 
        if (VariationDetail.hasOwnProperty('options')) {
            if (Array.isArray(VariationDetail.options) == true ) {
                for(var k=0;k<VariationDetail.options.length;k++) {
                    if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
                        if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {

                            for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
                                if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
                                    // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                          var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
                          // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                    optionObject.variations[VariationDetail.options[k].id] = {
                                        title      : VariationDetail.options[k].name ,
                                        product    : menuItemDetail.id,
                                        modifer    : VariationDetail.options[k].modifiers[m].id,
                                        mod_price  : "+"+price ,
                                        id         : VariationDetail.options[k].id,
                                        difference : price
                                    }

                                    modifer[VariationDetail.options[k].modifiers[m].id] = {
                                        id : VariationDetail.options[k].modifiers[m].id,
                                        order : null,
                                        type : {
                                            value : VariationDetail.options[k].modifiers[m].type,
                                            data  : VariationDetail.options[k].modifiers[m].value[0]
                                        }
                                    }


                                } else {
                                    modifer[VariationDetail.options[k].modifiers[m].id] = {
                                        id : VariationDetail.options[k].modifiers[m].id,
                                        order : null,
                                        type : {
                                            value : VariationDetail.options[k].modifiers[m].type,
                                            data  : VariationDetail.options[k].modifiers[m].value
                                        }
                                    }
                                }
                            }
                        } else {
                            if(VariationDetail.options[k].modifiers.type === "price_increment") {
                                // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ; 
                      var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER);
                      // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                optionObject.variations[VariationDetail.options[k].id] = {
                                    title      : VariationDetail.options[k].name ,
                                    product    : menuItemDetail.id,
                                    modifer    : VariationDetail.options[k].modifiers.id,
                                    mod_price  : "+"+price ,
                                    id         : VariationDetail.options[k].id,
                                    difference : price
                                }

                                modifer[VariationDetail.options[k].modifiers.id] = {
                                    id : VariationDetail.options[k].modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options[k].modifiers.type,
                                        data  : VariationDetail.options[k].modifiers.value[0]
                                    }
                                }
                            } else {
                                modifer[VariationDetail.options[k].modifiers.id] = {
                                    id : VariationDetail.options[k].modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options[k].modifiers.type,
                                        data  : VariationDetail.options[k].modifiers.value
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if(VariationDetail.options.hasOwnProperty('modifiers')) {
                    if(Array.isArray(VariationDetail.options.modifiers) == true ) {
                        for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
                            if(VariationDetail.options.modifiers[m].type === 'price_increment') {
                                // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                     var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
                    //  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                optionObject.variations[VariationDetail.options.id] = {
                                    title      : VariationDetail.options.name ,
                                    product    : menuItemDetail.id,
                                    modifer    : VariationDetail.options.modifiers[m].id,
                                    mod_price  : "+"+price ,
                                    id         : VariationDetail.options.id,
                                    difference : price
                                }

                                modifer[VariationDetail.options.modifiers[m].id] = {
                                    id : VariationDetail.options.modifiers[m].id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers[m].type,
                                        data  : VariationDetail.options.modifiers[m].value[0]
                                    }
                                }
                            } else {
                                modifer[Variation1143Detail.options.modifiers[m].id] = {
                                    id : VariationDetail.options.modifiers[m].id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers[m].type,
                                        data  : VariationDetail.options.modifiers[m].value
                                    }
                                }
                            }
                        }
                    } else {
                        if  (VariationDetail.options.modifiers.type === 'price_increment') {
                            // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
                  var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
                  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                            optionObject.variations[VariationDetail.options.id] = {
                                title      : VariationDetail.options.name ,
                                product    : menuItemDetail.id,
                                modifer    : VariationDetail.options.modifiers.id,
                                mod_price  : "+"+price ,
                                id         : VariationDetail.options.id,
                                difference : price
                            }

                            modifer[VariationDetail.options.modifiers.id] = {
                                id : VariationDetail.options.modifiers.id,
                                order : null,
                                type : {
                                    value : VariationDetail.options.modifiers.type,
                                    data  : VariationDetail.options.modifiers.value[0]
                                }
                            }

                        } else {
                            modifer[VariationDetail.options.modifiers.id] = {
                                    id : VariationDetail.options.modifiers.id,
                                    order : null,
                                    type : {
                                        value : VariationDetail.options.modifiers.type,
                                        data  : VariationDetail.options.modifiers.value
                                    }
                                }
                        }
                    }
                }
            }
        }
    }
}

if(isEmpty(modifer) == false)
{
    menuItemDetail['is_variation'] = true ;
     optionObject['modifiers'] = modifer 
     var newResult = [menuItemDetail,optionObject]
}
else
{
    menuItemDetail['is_variation'] = false ;
  
      var newResult = [menuItemDetail]

}


}
else
{                
  menuItemDetail['is_variation'] = false ;
  var newResult = [menuItemDetail]
}


if(newResult[0].hasOwnProperty('meta'))
{
  if(newResult[0].meta.hasOwnProperty('variations'))
  {
    newResult[0].relationships['Variations'] = newResult[0].meta.variations

    delete newResult[0].meta.variations;
  }
}
console.log('final >>',newResult)
//filteredItems.push(newResult)
  this.body = {status:200,data: newResult}
  
  return ;
}

exports.getMenuItem=function *(id, next) {
    var meta = { fn: 'getMenuItem', menu_item_id: id, company_id: this.params.companyId}
  try {
    var company = (yield Company.getSingleCompany(this.params.companyId))[0];
    debug(company);
    debug(company.country_id)
    var country = (yield Country.getSingleCountry(company.country_id))[0];
    debug(country)
    var results = yield msc.findMenuItem(id, country.currency);
  } catch (err) {
      meta.error = err;
      logger.error('Error retrieving menu item', meta)
      throw(err)
  }
  debug(results)
  
  this.menuItem = results
  yield next;
}

var internalGetMenuItem = function *(id) {
  debug('internalGetMenuItem')
  debug('id '+ id)
  try {
    var results = yield msc.findMenuItem(id)
  } catch (err) {
    console.error('error retrieving menu item from ordering system')
    throw(err)
  }
  return results
}

exports.updateMenuItem=function *(next) {
    var meta = { fn: 'updateMenuItem', menu_item_id: this.menuItem.id};
    logger.info('Update menu item', meta);
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    logger.info('Role authorized', meta);
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        var authErr = 'Owner '+ user.id +' not associate with company '+ this.company.name;
        meta.error = authErr;
        logger.error('Error updating menu item: '+ authErr, meta);
        throw(authErr);
    }
    console.info(this.menuItem.company +'=='+ this.company.orderSysId, meta);
    if (this.menuItem.company == this.company.order_sys_id) {
      this.body.type = 'product'
      this.body.id = this.menuItem.id
      this.body.price = this.body.price ? [
        {
          // amount: this.body.price*PRICE_MODIFIER,
          amount : decimalDevide(this.body.price,PRICE_MODIFIER),
          includes_tax: false,
          currency: this.menuItem.price[0].currency
        }
      ] : null
      this.body.name = this.body.title ? this.body.title : null
      var data = this.body

      try {

        var menuItemDetail = yield msc.updateMenuItem(this.menuItem.id, data)
        debug()
          menuItemDetail['title'] = menuItemDetail.name ;

           var filteredItems = [];
           /*------ json mapping start ---- */
           menuItemDetail['is_variation'] = true ;

          if(menuItemDetail.hasOwnProperty('relationships')) {
                var relationship =  menuItemDetail.relationships
                if (relationship.hasOwnProperty('main_image')) {
                    if(Array.isArray(relationship.main_image.data) == false ) {
                        var fileId = relationship.main_image.data.id ; 
                        var FileDetail = yield msc.getFile(fileId) ;
                        var url = FileDetail.link.href;
                        var http = url.replace(/^https?\:\/\//i, "http://");
                        var newUrl = { http : http , https : url }
                        menuItemDetail.relationships.main_image.data.url = newUrl ;
                    } else {
                        for (var x=0; x<relationship.main_image.data.length;x++) {
                            var fileId = relationship.main_image.data.id ; 
                            var FileDetail = yield msc.getFile(fileId) ;
                            var url = FileDetail.link.href;
                            var http = url.replace(/^https?\:\/\//i, "http://");
                            var newUrl = { http : http , https : url }
                            menuItemDetail.relationships.main_image.data[x].url = newUrl ;
                        }
                    }
                }

          }

          /*--- json mapping end ----*/
          if (menuItemDetail.price && Array.isArray(menuItemDetail.price)) {
              for (let o = 0; o < menuItemDetail.price.length; o++) {
                  if (menuItemDetail.price[o].amount) {
                      menuItemDetail.price[o].amount /= PRICE_MODIFIER
                  }
              }
          }
          if (menuItemDetail.meta && menuItemDetail.meta.display_price) {
              if (menuItemDetail.meta.display_price.with_tax && menuItemDetail.meta.display_price.with_tax.amount) {
                  menuItemDetail.meta.display_price.with_tax.amount /= PRICE_MODIFIER
              }
              if (menuItemDetail.meta.display_price.without_tax && menuItemDetail.meta.display_price.without_tax.amount) {
                  menuItemDetail.meta.display_price.without_tax.amount /= PRICE_MODIFIER
              }
          }


          if (relationship.hasOwnProperty('variations')) {
          var optionObject = {
                  title        : menuItemDetail.name, 
                  instructions : " " , 
                  product      : menuItemDetail.id ,
                  variations : { }
              }

          // Mapping variation in json
          var modifer = {}

          if (Array.isArray(relationship.variations.data) == true ) {
              for (var i=0;i<relationship.variations.data.length;i++) {
                  var variationId =  relationship.variations.data[i].id 
                  var VariationDetail = yield msc.findoptionCategory(variationId) 
                  if (VariationDetail.hasOwnProperty('options')) {
                      if (Array.isArray(VariationDetail.options) == true ) {
                          for(var k=0;k<VariationDetail.options.length;k++) {
                              if(VariationDetail.options[k].hasOwnProperty('modifiers')) {
                                  if(Array.isArray(VariationDetail.options[k].modifiers) == true ) {
                                      for(var m=0;m<VariationDetail.options[k].modifiers.length;m++) {
                                          if(VariationDetail.options[k].modifiers[m].type === "price_increment") {
                                              // var price = VariationDetail.options[k].modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                                   var price = decimalDevide(VariationDetail.options[k].modifiers[m].value[0].amount,PRICE_MODIFIER);
                                  //  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                              optionObject.variations[VariationDetail.options[k].id] = {
                                                  title      : VariationDetail.options[k].name ,
                                                  product    : menuItemDetail.id,
                                                  modifer    : VariationDetail.options[k].modifiers[m].id,
                                                  mod_price  : "+"+price ,
                                                  id         : VariationDetail.options[k].id,
                                                  difference : price
                                              }

                                              modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                  id : VariationDetail.options[k].modifiers[m].id,
                                                  order : null,
                                                  type : {
                                                      value : VariationDetail.options[k].modifiers[m].type,
                                                      data  : VariationDetail.options[k].modifiers[m].value[0]
                                                  }
                                              }


                                          } else {
                                              modifer[VariationDetail.options[k].modifiers[m].id] = {
                                                  id : VariationDetail.options[k].modifiers[m].id,
                                                  order : null,
                                                  type : {
                                                      value : VariationDetail.options[k].modifiers[m].type,
                                                      data  : VariationDetail.options[k].modifiers[m].value
                                                  }
                                              }
                                          }
                                      }
                                  } else {
                                      if(VariationDetail.options[k].modifiers.type === "price_increment") {
                                          // var price = VariationDetail.options[k].modifiers.value[0].amount/PRICE_MODIFIER ;
                               var price = decimalDevide(VariationDetail.options[k].modifiers.value[0].amount,PRICE_MODIFIER); 
                              //  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                          optionObject.variations[VariationDetail.options[k].id] = {
                                              title      : VariationDetail.options[k].name ,
                                              product    : menuItemDetail.id,
                                              modifer    : VariationDetail.options[k].modifiers.id,
                                              mod_price  : "+"+price ,
                                              id         : VariationDetail.options[k].id,
                                              difference : price
                                          }

                                          modifer[VariationDetail.options[k].modifiers.id] = {
                                              id : VariationDetail.options[k].modifiers.id,
                                              order : null,
                                              type : {
                                                  value : VariationDetail.options[k].modifiers.type,
                                                  data  : VariationDetail.options[k].modifiers.value[0]
                                              }
                                          }
                                      } else {
                                          modifer[VariationDetail.options[k].modifiers.id] = {
                                              id : VariationDetail.options[k].modifiers.id,
                                              order : null,
                                              type : {
                                                  value : VariationDetail.options[k].modifiers.type,
                                                  data  : VariationDetail.options[k].modifiers.value
                                              }
                                          }
                                      }
                                  }
                              }
                          }
                      } else {
                          if(VariationDetail.options.hasOwnProperty('modifiers')) {
                              if(Array.isArray(VariationDetail.options.modifiers) == true ) {
                                  for (var m=0;m<VariationDetail.options.modifiers.length;m++) {
                                      if(VariationDetail.options.modifiers[m].type === 'price_increment') {
                                          // var price = VariationDetail.options.modifiers[m].value[0].amount/PRICE_MODIFIER ; 
                            var price = decimalDevide(VariationDetail.options.modifiers[m].value[0].amount,PRICE_MODIFIER);
                            // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                          optionObject.variations[VariationDetail.options.id] = {
                                              title      : VariationDetail.options.name ,
                                              product    : menuItemDetail.id,
                                              modifer    : VariationDetail.options.modifiers[m].id,
                                              mod_price  : "+"+price ,
                                              id         : VariationDetail.options.id,
                                              difference : price
                                          }

                                          modifer[VariationDetail.options.modifiers[m].id] = {
                                              id : VariationDetail.options.modifiers[m].id,
                                              order : null,
                                              type : {
                                                  value : VariationDetail.options.modifiers[m].type,
                                                  data  : VariationDetail.options.modifiers[m].value[0]
                                              }
                                          }
                                      } else {
                                          modifer[VariationDetail.options.modifiers[m].id] = {
                                              id : VariationDetail.options.modifiers[m].id,
                                              order : null,
                                              type : {
                                                  value : VariationDetail.options.modifiers[m].type,
                                                  data  : VariationDetail.options.modifiers[m].value
                                              }
                                          }
                                      }
                                  }
                              } else {
                                  if  (VariationDetail.options.modifiers.type === 'price_increment') {
                                      // var price = VariationDetail.options.modifiers.value[0].amount/PRICE_MODIFIER ; 
                            var price = decimalDevide(VariationDetail.options.modifiers.value[0].amount,PRICE_MODIFIER);
                            // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',price)
                                      optionObject.variations[VariationDetail.options.id] = {
                                          title      : VariationDetail.options.name ,
                                          product    : menuItemDetail.id,
                                          modifer    : VariationDetail.options.modifiers.id,
                                          mod_price  : "+"+price ,
                                          id         : VariationDetail.options.id,
                                          difference : price
                                      }

                                      modifer[VariationDetail.options.modifiers.id] = {
                                          id : VariationDetail.options.modifiers.id,
                                          order : null,
                                          type : {
                                              value : VariationDetail.options.modifiers.type,
                                              data  : VariationDetail.options.modifiers.value[0]
                                          }
                                      }

                                  } else {
                                      modifer[VariationDetail.options.modifiers.id] = {
                                              id : VariationDetail.options.modifiers.id,
                                              order : null,
                                              type : {
                                                  value : VariationDetail.options.modifiers.type,
                                                  data  : VariationDetail.options.modifiers.value
                                              }
                                          }
                                  }
                              }
                          }
                      }
                  }
              }
          }

           
          if(isEmpty(modifer) == false)
          {
              menuItemDetail['is_variation'] = true ;
               optionObject['modifiers'] = modifer 
               var newResult = [menuItemDetail,optionObject]
          }
          else
          {
              menuItemDetail['is_variation'] = false ;
            
                var newResult = [menuItemDetail]

          }

          }
          else
          {                
            menuItemDetail['is_variation'] = false ;
            var newResult = [menuItemDetail]
          }

          var newResult = [menuItemDetail]
          if(newResult[0].hasOwnProperty('meta'))
          {
            if(newResult[0].meta.hasOwnProperty('variations'))
            {
              newResult[0].relationships['Variations'] = newResult[0].meta.variations

              delete newResult[0].meta.variations;
            }
          }

          filteredItems.push(newResult)
            this.body = filteredItems


      } catch (err) {
        console.error('error updating menu item in ordering system ')
        throw(err)
      }
      //this.body = item
      return;
    } else {
      console.error('updateMenuItem: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('updateMenuItem: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.deleteMenuItem=function *(next) {
  debug('deleteMenuItem')
  debug('id '+ this.menuItem.id)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('deleteMenuItem: Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('error deleting menu item: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      try {
        var message = yield msc.deleteMenuItem(this.menuItem.id)
      } catch (err) {
        console.error('error deleting menu item in ordering system ')
        throw(err)
      }
      this.body = {status:200,data:message}
      return;
    } else {
      console.error('deleteMenuItem: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('deleteMenuItem: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

function splitNoParen(s){
  var left= 0, right= 0, A= [], 
  M= s.match(/([^()]+)|([()])/g), L= M.length, next, str= '';
  for(var i= 0; i<L; i++){
    if(M[i]){
      
      next= M[i];
      if(next=== '(')++left;
      else if(next=== ')')++right;
      if(left!== 0){
          str+= next;
          if(left=== right){
              A[A.length-1]+=str;
              // console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',A[A.length-1])
              left= right= 0;
              str= '';
          }
      }
      else{
        // A= A.filter((item)=>{item.trim()})
        // let B=[];
        // for(let item of A){
        //   if(item) B.push(item.trim())
          // console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk0000',A)
        // }
        A=A.concat(next.match(/([^,]+)/g));
      }
    }
  }
  let B=[];
  for(let item of A){
    // console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk0000',item)
    if(item!=' '){
      B.push(item.trim())
    }
  }
  return B;
}

function getID(url) {
  if (url.includes("drive.google")) {
    let sudoId = url.split("d/")[1];
    if (sudoId) {
      var id = sudoId.split("/view")[0];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    } else {
      return '';
    }
  } else if (url.includes("dropbox")) {
    let sudoId = url.split("?")[0];
    if (sudoId) {
      return `${sudoId}?raw=1`;
    }
  } else {
    return url;
  }
}

exports.getallproducts=function *(next) {
  var user = this.passport.user;
  let category = this.params.category;
  let companyId = this.params.company_id;
console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',category,companyId)
  if(category && companyId){
      var company = (yield Company.getSingleCompany(companyId))[0]
      var categories = (yield msc.listCategories(company))
      let currentcat = categories.filter((item,index)=>{
        return item.name==category;
      })
      if(currentcat && currentcat.length >0){
        catId = currentcat[0];
      }
      // var country = (yield Country.getSingleCountry(user.country_id))[0];
      var results = (yield msc.listMenuItems(catId));
      var data = [];
      for(var i=0;i<results.length;i++){
        data.push(results[i])
      }
      console.log('my products---------------------------------------------',results)
      console.error('deleteMenuItem: User not authorized')
      this.status=200
      this.body = {data: data, message:'Fetch successfully category'}
      return;
  }else{
    this.status=401
      this.body = {data: [], message:'Something went wrong! Please try again later.'}
      return;
  }

}

exports.uploadgooglesheetuploadmenuitems=function *(next) {
  // var user = this.passport.user;
  try{
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
  var user = this.passport.user
  //   if (user.role == auth.OWNER && user.id != this.company.user_id) {
  //     meta.error='error creating menu item: Owner '+ user.id + 'not associated with '+ this.company.name;
  //     logger.error('error creating menu item: Owner '+ user.id + 'not associated with '+ this.company.name, meta);
  //     throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
  // }
  // debug('...user authorized')
  // debug('category company', this.category.company);
  // debug('this category', this.category);
  // debug('this company', this.company);
  // debug(this.category.company +'=='+ this.company.order_sys_id)
  

  var company = (yield Company.getSingleCompany(user.company_id))[0]

  console.log('I am upload********ing ******************************',company,user.company_id,company.google_sheet_url.split('/d/')[1].split('/edit')[0])

  const doc = new GoogleSpreadsheet(company.google_sheet_url.split('/d/')[1].split('/edit')[0]);
  doc.useApiKey(company.google_api_key);
   
  yield doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
  let currentTab=null;
  for(var j=0;j<doc.sheetCount;j++){
    if(doc.sheetsByIndex[j] && doc.sheetsByIndex[j].title===company.google_sheet_tab_name){
      console.log('we matchedddddddddddddddddddddddddddddddddddddd',j);
      currentTab = j
    }
  }

  const sheet = doc.sheetsByIndex[currentTab]; // or use doc.sheetsById[id]
  const rows = yield sheet.getRows(); // can pass in { limit, offset }
  console.log(sheet.title,rows.length);
  var data = [];
  var categories = (yield msc.listCategories(company));

      for(let item of rows){
        let img = item['Image/Photo Name'];
        let imgUrl = getID(img);
        let obj = {
          number : item['Number'],
          menuItemName : item['Menu Item Name'],
          menuItemDescription : item['Menu Item Description'],
          menuItemPrice : item['Menu Item Price'],
          image : imgUrl,
          category : item['Category'],
          addOnMultiple:  item['Add-Ons (Multiple)']  ? splitNoParen(item['Add-Ons (Multiple)']) : item['Add-Ons (Multiple)'],
          addOnPrice : item['Add-Ons Price'] ? item['Add-Ons Price'].split(',') : item['Add-Ons Price'],
          optionCategory : item['Options Category'] ? item['Options Category'].split(','):item['Options Category'],
          optionSingle : item['Options (Singles)'] ? item['Options (Singles)'].split(',') : item['Options (Singles)'],
          optionSinglePrice : item['Options Price'] ? item['Options Price'].split(',') : item['Options Price'],
          instructions : item['Instructions'] ? splitNoParen(item['Instructions']): [],
        }
      let currentcat = categories.filter((item,index)=>{
        return item.name==obj.category;
      })
      if(currentcat && currentcat.length >0){
        currentcategory = currentcat[0];
      }else{
        var category = yield msc.createCategory(company, obj.category, '')
        currentcategory = category;
        var categorydata = {
          type: 'category',
          id : currentcategory.id,
          company: company.order_sys_id,
          image : getID(item['Category Image']),
          description : item['Category Description']
        }
        var results = yield msc.updateCategory(currentcategory.id, categorydata)
      }
      var country = (yield Country.getSingleCountry(user.country_id))[0];

      var results = (yield msc.listMenuItems(currentcategory, country.currency));
        for(var i=0;i<results.length;i++){
          var message = yield msc.deleteMenuItem(results[i].id)
        }
      }



  for(let item of rows){
    if(item['Number'] && item['Menu Item Name'] ){
    let img = item['Image/Photo Name'];
    let imgUrl = getID(img);
    let obj = {
      number : item['Number'],
      menuItemName : item['Menu Item Name'],
      menuItemDescription : item['Menu Item Description'],
      menuItemPrice : item['Menu Item Price'],
      image : imgUrl,
      category : item['Category'],
      addOnMultiple:  item['Add-Ons (Multiple)']  ? splitNoParen(item['Add-Ons (Multiple)']) : item['Add-Ons (Multiple)'],
      addOnPrice : item['Add-Ons Price'] ? item['Add-Ons Price'].split(',') : item['Add-Ons Price'],
      optionCategory : item['Options Category'] ? item['Options Category'].split(','):item['Options Category'],
      optionSingle : item['Options (Singles)'] ? item['Options (Singles)'].split(',') : item['Options (Singles)'],
      optionSinglePrice : item['Options Price'] ? item['Options Price'].split(',') : item['Options Price'],
      instructions : item['Instructions'] ? splitNoParen(item['Instructions']): [],
    }
    var country = (yield Country.getSingleCountry(user.country_id))[0];
    let currentcat = categories.filter((item,index)=>{
      return item.name==obj.category;
    })
    if(currentcat && currentcat.length >0){
      catId = currentcat[0].id;
      currentcategory = currentcat[0];
      
    }else{
      var category = yield msc.createCategory(company, obj.category, '')
      catId = category.id;
      currentcategory = category;
      var categorydata = {
        type: 'category',
        id : currentcategory.id,
        company: company.order_sys_id,
        image : getID(item['Category Image']),
        description : currentcategory.description == item['Category'] ? item['Category Description'] : ''
      }
      var results = yield msc.updateCategory(currentcategory.id, categorydata)
    }
      var createVariation = yield msc.createOptionCategory('EXTRAS')
       var variationId =  createVariation.id ;
    // var created_menuItem = yield msc.createMenuItem(1143, obj.menuItemName, 'live', obj.menuItemPrice, 'a9c7cfba-94a7-4ec1-8d9c-d5a6f2ee6cef', obj.menuItemDescription, '', 'USD',obj.addOnMultiple,obj.addOnPrice,obj.optionSingle,obj.optionSinglePrice,obj.instructions)
    var created_menuItem = yield msc.createMenuItem(company, obj.menuItemName, 'live', obj.menuItemPrice,catId, obj.menuItemDescription, '', country.currency,obj.addOnMultiple,obj.addOnPrice,obj.optionSingle,obj.optionSinglePrice,obj.instructions,obj.optionCategory,obj.image)    
    var menuItem = yield msc.createRelationship(created_menuItem.id, variationId)
    if (menuItem.price && Array.isArray(menuItem.price)) {
          for (let o = 0; o < menuItem.price.length; o++) {
            if (menuItem.price[o].amount) {
              menuItem.price[o].amount /= PRICE_MODIFIER
            }
          }
        }

        if (menuItem.meta && menuItem.meta.display_price) {
          if (menuItem.meta.display_price.with_tax && menuItem.meta.display_price.with_tax.amount) {
            menuItem.meta.display_price.with_tax.amount /= PRICE_MODIFIER
          }

          if (menuItem.meta.display_price.without_tax && menuItem.meta.display_price.without_tax.amount) {
            menuItem.meta.display_price.without_tax.amount /= PRICE_MODIFIER
          }
        }
    data.push(menuItem)
      }
  }
  } else {
    console.error('uploadMenuItemImage: User not authorized')
    this.status=401
    this.body = {error: 'User not authorized'}
    return;
  }

  this.status=200
  this.body = {success: 'Successfully Uploaded Google sheet',data:data}
  return;
}
catch(exe){
  this.status=401
  this.body = exe
  return;
}
}

exports.googlesheetuploadmenuitems=function *(next) {
  console.log('************************************** googlesheetuploadmenuitems',)
  var user = this.passport.user;
  
  const doc = new GoogleSpreadsheet(user.google_sheet_url.split('/d/')[1].split('/edit')[0]);
  // const doc = new GoogleSpreadsheet('16dWwpqxSgh6BC_h6A9R_3nViip--ShJpCaaulbycpgc');
  doc.useApiKey(user.google_api_key);

  yield doc.loadInfo(); // loads document properties and worksheets
  let currentTab=null;
  for(var j=0;j<doc.sheetCount;j++){
    if(doc.sheetsByIndex[j] && doc.sheetsByIndex[j].title===user.google_sheet_tab_name){
      // if(doc.sheetsByIndex[j] && doc.sheetsByIndex[j].title==='Sheet1'){
      console.log('we matchedddddddddddddddddddddddddddddddddddddd',j);
      currentTab = j
    }
  }
   
  const sheet = doc.sheetsByIndex[currentTab]; // or use doc.sheetsById[id]
  const rows = yield sheet.getRows(); // can pass in { limit, offset }
  console.log(sheet.title,sheet);
  var data = [];
  for(var i=0;i<rows.length;i++){
    console.log('Number : ',rows[i]['Number']);
    console.log('Menu Item Name : ',rows[i]['Menu Item Name']);
    console.log('Menu Item Description : ',rows[i]['Menu Item Description']);
    console.log('Menu Item Price : ',rows[i]['Menu Item Price']);
    console.log('Image/Photo Name : ',rows[i]['Image/Photo Name']);
    console.log('Category : ',rows[i]['Category']);
    console.log('Add-Ons (Multiple) : ',rows[i]['Add-Ons (Multiple)']  ? splitNoParen(rows[i]['Add-Ons (Multiple)']) : rows[i]['Add-Ons (Multiple)']);
    console.log('Add-Ons Price : ',rows[i]['Add-Ons Price'] ? rows[i]['Add-Ons Price'].split(',') : rows[i]['Add-Ons Price']);
    console.log('Options Category : ',rows[i]['Options Category'] ? rows[i]['Options Category'].split(','):rows[i]['Options Category']);
    console.log('Options (Singles) : ',rows[i]['Options (Singles)'] ? rows[i]['Options (Singles)'].split(',') : rows[i]['Options (Singles)']);
    console.log('Options Price : ',rows[i]['Options Price'] ? rows[i]['Options Price'].split(',') : rows[i]['Options Price']);
    console.log('Instructions:  : ',rows[i]['Instructions'] ? splitNoParen(rows[i]['Instructions']) : rows[i]['Instructions']);
    console.log('\n');
    
    if(rows[i]['Number'] && rows[i]['Menu Item Name'] ){
      data.push({
      number : rows[i]['Number'],
      menuItemName : rows[i]['Menu Item Name'],
      menuItemDescription : rows[i]['Menu Item Description'],
      menuItemPrice : rows[i]['Menu Item Price'],
      image : rows[i]['Image/Photo Name'],
      category : rows[i]['Category'],
      addOnMultiple:  rows[i]['Add-Ons (Multiple)']  ? splitNoParen(rows[i]['Add-Ons (Multiple)']) : rows[i]['Add-Ons (Multiple)'],
      addOnPrice : rows[i]['Add-Ons Price'] ? rows[i]['Add-Ons Price'].split(',') : rows[i]['Add-Ons Price'],
      optionCategory : rows[i]['Options Category'] ? rows[i]['Options Category'].split(','):rows[i]['Options Category'],
      optionSingle : rows[i]['Options (Single)'] ? rows[i]['Options (Single)'].split(',') : rows[i]['Options (Single)'],
      optionSinglePrice : rows[i]['Options Price'] ? rows[i]['Options Price'].split(',') : rows[i]['Options Price'],
      instructions : rows[i]['Instructions'] ? splitNoParen(rows[i]['Instructions']) : []
    })
  }
  }
  this.status=200
  this.body = {success: 'Successfully Parse sheet',data:data}
  return;
}



exports.uploadCategoryImage=function *(next) {
  
  debug('uploadCategoryImage')
  debug('id '+ this.category.id)
  debug('..files')
  debug(this.body.files)
  debug('..path')
  // debug(this.body.files.file.path)
  
  debug('..check for files')
  
  if (!this.body.files) {
    debug('uploadCategoryImage: No image found')
    return;
  }
  debug('found image')
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('uploadMenuItemImage: Role authorized')
    var user = this.passport.user
    
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('uploadMenuItemImage: error uploading menu item image: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug(this.category.company +'=='+ this.company.order_sys_id)
    if (this.category.company == this.company.order_sys_id) {
      
      var data = this.body;
      debug(data)
      try {
        var item = yield msc.uploadImage(this.category.id, this.body.files.file.path,'category')

        var url = item.link.href;
        var http = url.replace(/^https?\:\/\//i, "http://");
        var newUrl = { http : http , https : url }

        var data = {
          type: 'category',
          id : this.category.id,
          company: this.company.order_sys_id,
          image : url
      }
        var results = yield msc.updateCategory(this.category.id, data)

        var newItem = {"main_image" :{
                "data": {
                    "type": "main_image",
                    "id": item.id,
                    "url": newUrl
                }
            }
          }
      } catch (err) {
        console.error('uploadMenuItemImage: error uploading menu item image in ordering system ')
        throw(err)
      }
      this.body = {status:200,data: newItem}
      return;
    } else {
      console.error('uploadMenuItemImage: updateMenuItem: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('uploadMenuItemImage: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.uploadMenuItemImage=function *(next) {
  
  debug('uploadMenuItemImage')
  debug('id '+ this.menuItem.id)
  debug('..files')
  debug(this.body.files)
  debug('..path')
  // debug(this.body.files.file.path)
  
  debug('..check for files')
  
  if (!this.body.files) {
    debug('uploadMenuItemImage: No image found')
    this.body={status:404, message:"uploadMenuItemImage: No image found"};
    return;
  }
  debug('found image')
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('uploadMenuItemImage: Role authorized')
    var user = this.passport.user
    
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('uploadMenuItemImage: error uploading menu item image: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      
      
      var data = this.body;
      debug(data)
      try {
        var item = yield msc.uploadImage(this.menuItem.id, this.body.files.file.path,'menu')
        
        var url = item.link.href;
        var http = url.replace(/^https?\:\/\//i, "http://");
        var newUrl = { http : http , https : url }

        var newItem = {"main_image" :{
                "data": {
                    "type": "main_image",
                    "id": item.id,
                    "url": newUrl
                }
            }
          }

      } catch (err) {
        console.error('uploadMenuItemImage: error uploading menu item image in ordering system ')
        this.body = {status: 400, error: 'uploadMenuItemImage: error uploading menu item image in ordering system'}
        throw(err)
      }
      this.body = {status:200,data: newItem}
      return;
    } else {
      console.error('uploadMenuItemImage: updateMenuItem: Menu item does not belong to company')
      this.status=400
      this.body = {status: 400, error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('uploadMenuItemImage: User not authorized')
    this.status=401
    this.body = {status: 401, error: 'User not authorized'}
    return;
  }
}

exports.deleteImage=function *(next) {
  debug('deleteImage')
  debug('...id '+ this.params.imageId)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('deleteImage: Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('deleteImage: error deleting menu item iamge: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      try {
        var message = yield msc.deleteImage(this.params.imageId)
      } catch (err) {
        console.error('deleteImage: error deleting menu item image in ordering system ')
        throw(err)
      }
      this.body = {status:200,data: message}
      return;
    } else {
      console.error('deleteImage: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('deleteImage: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

var optionItemCreator = function *(menuItemId, optionCategoryId, title, modPrice) {
  try {
    var optionItem = yield msc.createOptionItem(optionCategoryId, title, modPrice)
  } catch (err) {
    console.error('error creating option item in ordering system')
    throw(err)
  }
  // return res.json(optionItem)
  this.body = optionItem
  return;
}


exports.listOptionItems=function *(next) {
  debug('listOptionItems')
  debug('menu item '+ this.params.menuItemId)
  debug('option category '+ this.params.optionCategoryId)
  try {
    debug('calling msc.listOptionItems')
    var results = yield msc.listOptionItems(this.params.menuItemId, this.params.optionCategoryId)
  } catch (err) {
    console.error('listOptionItems: Error retrieving option items from ordering system ');
    this.body = {status:400, message:"Something went wrong"};
    throw(err)
  }
  debug(results)
  this.body = {status:200, data: results,message:"get list optionitems"}
  return;
}

exports.readOptionItem= function *(next) {
  debug('readOptionItem')
  debug('menu item '+ this.params.menuItemId)
  debug('option category ' +this.params.optionCategoryId)
  debug('option item '+ this.params.optionItemId)
  try {
    var results = yield msc.findOptionItem(this.params.menuItemId, this.params.optionCategoryId, this.params.optionItemId)
  } catch (err) {
    console.error('readOptionItem: error getting option item ('+ this.params.optionItemId +') from ordering system')
    this.body = {status:400, data: 'readOptionItem: error getting option item ('+ this.params.optionItemId +') from ordering system'}
    throw(err)
  }
  debug(results)
  this.body = {status:200, data: results}
  return;
}

exports.createOptionItem=function *(next) {

  debug('createOptionItem')
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('createOptionItem: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('createOptionItem: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      var title = this.body.title
      if (!title) {
        this.status = 400
        this.body = { status: 400, error: 'title is required.'}
        return;
      }

      var mod_price = this.body.mod_price
      if (!mod_price) {
        this.status = 400
        this.body = { status: 400, error: 'mod_price is required.'}
        return;
      }


      var description = this.body.title
      debug('...title '+ title)
      debug('...description '+ description)

      var currency = '';
      if (this.company.country_id){
        try{
          var country = (yield Country.getSingleCountry(this.company.country_id))[0];
          
          currency = country.currency;
        }
        catch(err){
          meta.error=err;
          logger.error('error retrieving country currency', country);
          throw(err);
        }
      }
      

      if(this.optionCategory)
      {
        var optionCategoryId = this.optionCategory.id
        var optionCategoryName = this.optionCategory.name
      }
      
      // if no optioncategoryId, must find or create the OptionItems category
      if (!optionCategoryId) {
        debug('...no option category provided. Must be for OptionItems category. Finding...')
         
          debug('...no OptionItems category found. Creating new...')
        if(this.menuItem.relationships.hasOwnProperty('variations'))
        {
           var variationId = this.menuItem.relationships.variations.data[0].id ;
           var results = yield msc.findoptionCategory(variationId)

           optionCategoryId = results.id
           optionCategoryName = results.name
        }
        else
        {
          var results = yield msc.createOptionCategory('EXTRAS')
          

          // automatic mapped with all product into same category
          var categoryId = {id : this.menuItem.relationships.categories.data[0].id }; 

          var categoryResults = yield msc.listMenuItems(categoryId)
          var filteredItems = categoryResults
          /* if (categoryResults && categoryResults.length > 0){

                  for (var j=0; j<categoryResults.length; j++){

                    if (categoryResults[j].category === this.menuItem.category) { 
                      filteredItems.push(categoryResults[j])
                    }
                  }
              }*/

          for (var i=0;i<filteredItems.length;i++){
              
              var ItemId = filteredItems[i].id ;
              
              var relationship_result = yield msc.createRelationship(ItemId, results.id)
              
          }
          
          optionCategoryId = results.id
          optionCategoryName = results.name

        }
      }

      debug('...optionCategoryId '+ optionCategoryId)
      try {
        var results = yield msc.createOptionItem(optionCategoryId, title, description)
        // create price modifer 
        var optionId = results.id ;
        // for(var i=0;i<results.options.length;i++){
        //    if(results.options[i].name == title)
        //    {
        //       var optionId = results.options[i].id ;
        //       break;
        //    }
        //   }

          // create sku modifer 
          var seekVariable = optionCategoryName+' '+title ;
          var skuData = {
                          "type": "modifier",
                          "modifier_type": "sku_builder",
                           "value": 
                                {
                                 "seek": seekVariable,
                                 "set": "SKU-"+seekVariable
                                }
                        }
              
          var skuModiferResults = yield msc.createModifer(optionCategoryId,optionId,skuData)
          
          // create price modife=ier 
          // var newAmount = parseInt(mod_price*100) ;
          var newAmount = decimalMultiply(mod_price,PRICE_MODIFIER)
          var priceData = {
                          "type": "modifier",
                          "modifier_type": "price_increment",
                           "value": [
                                  {
                                    "currency": currency,
                                    "amount": newAmount,
                                    "includes_tax": false
                                  }
                                ]
                        }
              
          var modiferResults = yield msc.createModifer(optionCategoryId,optionId,priceData)
          
   
      } catch (err) {
        console.log('error is ',err)
        console.error('createOptionItem: Error creating option item ('+ title +')')
        this.body = {status: 400, message:"Error creating option item"};
        throw(err)
      }
      debug(results)
      this.body = {status:200,data: modiferResults}
      return;
    } else {
      console.error('createOptionItem: Menu item does not belong to company')
      this.status=400
      this.body = {status: 400, error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('createOptionItem: User not authorized')
    this.status=401
    this.body = {status : 401,error: 'User not authorized'}
    return;
  }
}

exports.getoptionItem = function *(id, next) {
  
  this.optionItem  = {'id': id }
  yield next; 
  
}

exports.updateOptionItem=function *(next) {
  debug('updateOptionItem')
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  debug('...option Item '+ this.optionItem)

  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('updateOptionItem: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('updateOptionItem: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.orderSysId)
    if (this.menuItem.company == this.company.order_sys_id) {
      
      if(this.body){
        var title,mod_price,description ;
        if(this.body.hasOwnProperty('title'))
         {
           title = this.body.title
           description = this.body.title
         }
        if(this.body.hasOwnProperty('mod_price'))
           mod_price = this.body.mod_price
         
         if (!title && !mod_price) {
           this.status = 400
           this.body = { status:400,error: 'Please Provide title or mod_price for update.'}
           return;
         }

      }
      else
      {
           this.status = 400
           this.body = { status:400,error: 'Please Provide title or mod_price for update.'}
           return;

      }
      



      try {
        
        if(this.optionCategory.hasOwnProperty('options'))
        {
           var options = this.optionCategory.options
           var modifers = [] ;
           
            for(var i=0 ; i<options.length ; i++)
            {
              if(options[i].id == this.optionItem.id )
              {
                
                modifers = options[i].modifiers
                
                break ;
              }

            }
            var modPriceId,skuBuilderId ;
            for(var j= 0 ; j<modifers.length;j++)
            {
              if(modifers[j].type == 'sku_builder')
              {
                skuBuilderId = modifers[j].id
              }
              else if(modifers[j].type == 'price_increment')
              {
                modPriceId = modifers[j].id
              }
            }
            
        }
        else
        {
           this.body = {status:400,error: 'Options are not found under the given optioncategory'}
            return;
        }
          if(title != undefined)
          {
              var results = yield msc.updateOptionItem(this.optionCategory.id, this.optionItem.id, title,description)
              var seekVariable = this.optionCategory.name+' '+title ;
              

              if(skuBuilderId == undefined)  // create new sku builder
              {
                var skuData = {
                          "type": "modifier",
                          "modifier_type": "sku_builder",
                           "value": 
                                {
                                 "seek": seekVariable,
                                 "set": "SKU-"+seekVariable
                                }
                }
                var results = yield msc.createModifer(optionCategoryId,optionId,skuData)
              }
              else  // update old sku_builder 
              {
                var skuData = {
                                "type": "product-modifier",
                                "id": skuBuilderId,
                                "modifier_type": "sku-builder",
                                "value": {
                                  "seek": seekVariable,
                                  "set": "SKU-"+seekVariable,
                                }
                              }
                var results = yield msc.updateModifer(this.optionCategory.id,this.optionItem.id,skuBuilderId,skuData)
              }
              
            }
            if(mod_price != undefined)
              {
                var currency = '';
                  if (this.company.country_id){
                    try{
                      var country = (yield Country.getSingleCountry(this.company.country_id))[0];
                      
                      currency = country.currency;
                    }
                    catch(err){
                      meta.error=err;
                      logger.error('error retrieving country currency', country);
                      throw(err);
                    }
                  }
                    if(modPriceId == undefined)  // create new price modifer
                    {

                      // var newAmount = parseInt(mod_price*100) ;
                      var newAmount = decimalMultiply(mod_price,PRICE_MODIFIER);
                      var priceData = {
                              "type": "modifier",
                              "modifier_type": "price_increment",
                               "value": [
                                      {
                                        "currency": currency,
                                        "amount": newAmount,
                                        "includes_tax": false
                                      }
                                    ]
                            }
                  
                     var results = yield msc.createModifer(this.optionCategory.id,this.optionItem.id,priceData)
              

                    }
                    else  // update price modifer
                    {
                            //  var newAmount = mod_price*PRICE_MODIFIER ;
                            var newAmount = decimalMultiply(mod_price,PRICE_MODIFIER);
                             var data = {
                              "type": "product-modifier",
                              "modifier_type": "price_increment",
                               "value": [
                                      {
                                        "currency": currency,
                                        "amount": newAmount,
                                        "includes_tax": false
                                      }
                                    ]
                            }

                       var results = yield msc.updateModifer(this.optionCategory.id,this.optionItem.id,modPriceId,data)

                    }
                   
              }
          
        } catch (err) {
        console.error('updateOptionItem: Error updating option item in ordering system ')
        throw(err)
      }
      this.body = {status:200,data:results}
      return;
    } else {
      console.error('updateOptionItem: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('updateOptionItem: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.deleteOptionItem=function *(next) {
  debug('deleteOptionItem')
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  debug('...option Item '+ this.optionItem)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('deleteOptionItem: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('deleteOptionItem: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      try {
        var message = yield msc.deleteOptionItem(this.optionCategory.id, this.optionItem.id)
      } catch (err) {
        console.error('deleteOptionItem: Error deleting option item  ('+ this.optionItem.id +')')
        throw(err)
      }
      this.body = {status:200,data:message}
      return;
    } else {
      console.error('deleteOptionItem: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('deleteOptionItem: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}


/* function to create variation */
exports.createOptionCategory=function *(func, params, next) {
  
  debug('createOptionCategory')
  debug('...menu item '+ this.menuItem)
  var title = this.body.title
  if (!title) {
    this.status=400
    this.body = { status:400, error: 'Title is required.'}
    return;
  }

  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('createOptionCategory: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('createOptionCategory: Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    debug('...user authorized')
    if (!this.menuItem) {
      
      try {

        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
        
      }  catch (err) {
        console.error('createOptionCategory: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug('...checking menu item belongs to company owner')
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      try {

        debug('...calling moltin create option category')
        var results = yield msc.createOptionCategory(title)
        
        //var relationship_result = yield msc.createRelationship(this.menuItem.id, results.id)
         var categoryId = {id : this.menuItem.relationships.categories.data[0].id };
          var categoryResults = yield msc.listMenuItems(categoryId)
          var filteredItems = categoryResults
             /* if (categoryResults && categoryResults.length > 0){

                  for (var j=0; j<categoryResults.length; j++){

                    if (categoryResults[j].category === this.menuItem.category) { 
                      filteredItems.push(categoryResults[j])
                    }
                  }
              }*/

          for (var i=0;i<filteredItems.length;i++){
              
              var ItemId = filteredItems[i].id ;
              
              var relationship_result = yield msc.createRelationship(ItemId, results.id)
              console.log('relationship result>>>',relationship_result)
          }



      } catch (err) {
        console.error('createOptionCategory: Error creating '+ title +' option category')
        throw(err)
      }
      debug(results)
      this.body = {status:200,data: results}
      return;
    } else {
      console.error('createOptionCategory: Menu item does not belong to company')
      this.status=400
      this.body = { status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('createOptionCategory: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.listOptionCategories=function *(next) {
  debug('listOptionItems')
  debug('menu item '+ this.menuItem.id)
  try {
    
    var results = yield msc.listOptionCategories(this.menuItem.id)
  } catch (err) {
    console.error('listOptionCategories: Error retrieving option categories from ordering system ');
    this.body = {status:400, message:"Something went wrong"}
    return;
    // throw(err)
  }
  debug(results)
  this.body = {status:200, data: results}
  return;
}

exports.getoptionCategory = function *(id, next) {
  
  debug('getoptionCategory')
  debug('id '+ id)
  try {
    
    var results = yield msc.findoptionCategory(id)
  } catch (err) {
    console.error('error retrieving option Category from ordering system')
    throw(err)
  }
  debug(results)
  
  this.optionCategory = results
  yield next; 
  
}

exports.readOptionCategory= function *(next) {
  if(this.optionCategory){
    this.body = {status:200, data: this.optionCategory}
    return;
  }else{
    this.body = {status:400, messsage :"Something went wrong"}
    return;
  }
}

exports.updateOptionCategory=function *(next) {
  debug('updateOptionCategory')
  debug('menu item '+this.menuItem)
  debug('option category '+ this.optionCategory)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('updateOptionCategory: Error updating option category: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('updateOptionCategory: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug('...'+ this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      debug(this.body)
      var title = this.body.title
      try {
        var results = yield msc.updateOptionCategory(this.optionCategory.id, title)
      } catch (err) {
        console.error('updateOptionCategory: Error updating option category '+ this.optionCategory.name +' ('+ this.optionCategory.id +')')
        throw(err)
      }
      debug(results)
      this.body = {status:200,data:results}
      return;

    } else {
      console.error('updateOptionCategory: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('updateOptionCategory: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.deleteOptionCategory=function *(next) {
  debug('deleteOptionCategory')
  debug('...menu item '+this.menuItem)
  debug('...option category '+ this.optionCategory)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...Role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('deleteOptionCategory: Error deleting option category: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('deleteOptionCategory: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug('...'+ this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      try {
        var results = yield msc.deleteOptionCategory(this.optionCategory.id)
      } catch (err) {
        console.error('deleteOptionCategory: Error deleting option category ('+ this.optionCategory.id +')')
        throw(err)
      }
      debug(results)
      this.body = {status:200,data:results}
      return;

    } else {
      console.error('deleteOptionCategory: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('deleteOptionCategory: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

//yield msc.createOptionExtra(this.optionCategory.id,this.optionItem.id,data)
exports.createModifier = function *(next)
{

   debug('createmodifier')
  
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('createModifier: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('createModifier: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      

      var modifier_type = this.body.modifier_type
      if (!modifier_type) {
            this.status = 400
            this.body = {status:400, error: 'modifier_type is required.'}
            return;
          }
        debug('...modifier_type '+ modifier_type)
      if(modifier_type === 'slug_builder' || modifier_type === 'sku_builder')
      {
         
          var seek = this.body.seek
          var set  = this.body.set
          
          
          if(!seek) {
            this.status = 400
            this.body = {status:400, error: 'Value for Seek is required.'}
            return;
          }
          if(!set) {
            this.status = 400
            this.body = {status:400, error: 'Value for set is required.'}
            return;
          }
          
          var data = {
                          "type": "modifier",
                          "modifier_type": modifier_type,
                          "value": 
                          {
                           "seek": seek,
                           "set": set
                          }
                        }

          
          
          debug('...seek '+ seek)
          debug('...set'+set)
      }
      else if(modifier_type === 'price_increment' || modifier_type === 'price_decrement' ) {
         
         var currency = '';
      if (this.company.country_id){
        try{
          var country = (yield Country.getSingleCountry(this.company.country_id))[0];
          
          currency = country.currency;
        }
        catch(err){
          meta.error=err;
          logger.error('error retrieving country tax band', meta);
          throw(err);
        }
      }
        var currency =  currency
        var mod_price   = this.body.mod_price

        if(!mod_price) {
            this.status = 400
            this.body = {status:400, error: 'Value for mod_price is required.'}
            return;
          }

          if(!currency) {
            this.status = 400
            this.body = {status:400, error: 'Value for currency is required.'}
            return;
          }
          var oldAmount = parseInt(mod_price) ;
          // var newAmount = mod_price*PRICE_MODIFIER ;
          var newAmount = decimalMultiply(mod_price,PRICE_MODIFIER);
          console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>1',newAmount)
          var data = {
                          "type": "modifier",
                          "modifier_type": modifier_type,
                           "value": [
                                  {
                                    "currency": currency,
                                    "amount": newAmount,
                                    "includes_tax": false
                                  }
                                ]
                        }

          
          
          debug('...currency '+ currency)
          debug('...amount'+mod_price)

      }
      
      if(this.optionCategory)
      {     
        debug('...optionCategory id '+ this.optionCategory.id)
        
        try {
          var results = yield msc.createModifer(this.optionCategory.id,this.optionItem.id,data)
          
        } catch (err) {
          console.error('createModifier: Error creating modifier item ('+data+')')
          throw(err)
        }
        debug(results)
        this.body = {status:200,data: results}
        return;
      }
      else {
      console.error('createModifier: optioncategory does not found for menuitem')
      this.status=400
      this.body = {status:400,error: 'optioncategory does not found for menuitem'}
      return;
      }

    } else {
      console.error('createModifier: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('createModifier: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }

}

exports.getmodifier = function *(id, next) {
  
  this.modifier  = {'id': id }
  yield next; 
  
}

exports.updateModifier = function *(next) {

 debug('updatemodifier')
  
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  debug('...optionItem'+this.optionItem)
  debug('...modifier'+this.modifier)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('updateModifier: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('updateModifier: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      var modifier_type = this.body.modifier_type
      if (!modifier_type) {
            this.status = 400
            this.body = { status:400,error: 'modifier_type is required.'}
            return;
          }
        debug('...modifier_type '+ modifier_type)
      if(modifier_type === 'slug_builder' || modifier_type === 'sku_builder')
      {
         
          var seek = this.body.seek
          var set  = this.body.set
          
          
          if(!seek) {
            this.status = 400
            this.body = { status:400,error: 'Value for Seek is required.'}
            return;
          }
          if(!set) {
            this.status = 400
            this.body = {status:400, error: 'Value for set is required.'}
            return;
          }
          
          var data = {
                          "type": "modifier",
                          "modifier_type": modifier_type,
                          "value": 
                          {
                           "seek": seek,
                           "set": set
                          }
                        }

          
          
          debug('...seek '+ seek)
          debug('...set'+set)
      }
      else if(modifier_type === 'price_increment' || modifier_type === 'price_decrement' ) {
         
         var currency = '';
      if (this.company.country_id){
        try{
          var country = (yield Country.getSingleCountry(this.company.country_id))[0];
          
          currency = country.currency;
        }
        catch(err){
          meta.error=err;
          logger.error('error retrieving country tax band', meta);
          throw(err);
        }
      }
        var currency = currency
        var mod_price   = this.body.mod_price

        if(!mod_price) {
            this.status = 400
            this.body = {status:400, error: 'Value for mod_price is required.'}
            return;
          }
          
          // var amount = mod_price*PRICE_MODIFIER ;
          var newAmount = decimalMultiply(mod_price,PRICE_MODIFIER);
          var data = {
                          "type": "product-modifier",
                          "modifier_type": modifier_type,
                           "value": [
                                  {
                                    "currency": currency,
                                    "amount": amount ,
                                    "includes_tax": false
                                  }
                                ]
                        }

          
          
          debug('...currency '+ currency)
          debug('...amount'+amount)

      }
      
      if(this.optionCategory)
      {     
        debug('...optionCategory id '+ this.optionCategory.id)
        
        try {
          var results = yield msc.updateModifer(this.optionCategory.id,this.optionItem.id,this.modifier.id,data)
          
        } catch (err) {
          console.error('updateModifier: Error updating modifier item ('+data+')')
          throw(err)
        }
        debug(results)
        this.body = {status:200,data:results}
        return;
      }
      else {
      console.error('updateModifier: optioncategory does not found for menuitem')
      this.status=404
      this.body = {status:404,error: 'optioncategory does not found for menuitem'}
      return;
      }

    } else {
      console.error('updateModifier: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('updateModifier: User not authorized')
    this.status=401
    this.body = {status:401,error: 'User not authorized'}
    return;
  }
}

exports.deleteModifier = function *(next) {
  debug('deleteModifier')
  
  debug('...menu item '+ this.menuItem)
  debug('...optionCategory '+ this.optionCategory)
  debug('...optionItem'+this.optionItem)
  debug('...modifier'+this.modifier)
  if (auth.isAuthorized(auth.OWNER, auth.ADMIN)) {
    debug('...role authorized')
    var user = this.passport.user
    if (user.role == auth.OWNER && user.id != this.company.user_id) {
        console.error('deleteModifier: Owner '+ user.id + 'not associated with '+ this.company.name)
        throw('Owner '+ this.user.id + ' not associated with '+ this.company.name)
    }
    if (!this.menuItem) {
      try {
        debug('...getting menu item ')
        this.menuItem = yield internalGetMenuItem(this.params.menuItemId)
      }  catch (err) {
        console.error('deleteModifier: Error retreiving menu item ('+ this.params.menuItemId +')')
        throw(err)
      }
    }
    debug(this.menuItem.company +'=='+ this.company.order_sys_id)
    if (this.menuItem.company == this.company.order_sys_id) {
      
      if(this.optionCategory)
      {     
        debug('...optionCategory id '+ this.optionCategory.id)
        
        try {
          var results = yield msc.deleteModifer(this.optionCategory.id,this.optionItem.id,this.modifier.id)
          
        } catch (err) {
          console.error('DeleteModifier: Error deleting modifier ('+this.modifier.id+')')
          throw(err)
        }
        debug(results)
        this.body = {status:200,data:results}
        return;
      }
      else {
      console.error('DeleteModifier: optioncategory does not found for menuitem')
      this.status=400
      this.body = {status:400,error: 'optioncategory does not found for menuitem'}
      return;
      }

    } else {
      console.error('DeleteModifier: Menu item does not belong to company')
      this.status=400
      this.body = {status:400,error: 'Menu item does not belong to company'}
      return;
    }
  } else {
    console.error('DeleteModifier: User not authorized')
    this.status=401
    this.body = {status:401, error: 'User not authorized'}
    return;
  }

}

exports.redeemLoyalty=function* (next) {
  var company = this.body.company_id;
  var customer = this.body.customer_id;
  var tier = this.body.tier;
  var points = tier === 'gold' ? 15 : (tier === 'silver' ? 10 : 5);

  var userCustomer = (yield Customer.getUser(customer)).rows[0];

  var tierPackage = yield Loyalty.getTierPackage(company,tier);

  yield Packages.givePackageAux(1, tierPackage.package_id, userCustomer.id);
  var packageGiven = (yield PackageModel.getGivenPackage(userCustomer.id, tierPackage.package_id));

  var customerLoyalty = (yield Loyalty.getPointBalance(customer, company))[0];

  if (customerLoyalty.balance < points) {
    this.status = 401;
    this.body = {error : 'Not enough points'};
    return;
  }

  var newBal = customerLoyalty.balance - points;

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

  var updatedLoyalty = {
    balance: newBal,
    eligible_five: isEligible_five,
    eligible_ten: isEligible_ten,
    eligible_fifteen: isEligible_fifteen,
    updated_at: new Date()
  };

  yield Loyalty.updateLoyalty(customer, company, updatedLoyalty);

  this.status = 200;
  this.body = {
      success : "QR code generated",
      qr_code : packageGiven.qr_code
  }
};

exports.getLoyaltyInfo = function *() {
  var company = this.params.companyId;
  var customer = this.params.customerId;

  var data = yield Loyalty.getLoyaltyInfo(customer, company);

  this.status = 200;
  this.body = {status:200,data: data.rows};
  return;
};

exports.getCompanyLoyaltyInfo = function *() {
  var company = this.params.companyId;

  var data = yield Loyalty.getCompanyLoyaltyInfo(company);

  this.status = 200;
  this.body = {status:200,data: data.rows};
  return;
};

