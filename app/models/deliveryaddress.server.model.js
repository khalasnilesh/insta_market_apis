var knex  = require('../../config/knex');
var debug = require('debug')('deliveryaddress.model');
var axios = require('axios')
exports.getAddressesForCustomer = function(customerId) {
  return knex('delivery_addresses').select().where('customer_id', customerId);
};

exports.getSingleAddress = function(id) {
  return knex('delivery_addresses').select().where('id', id);
};

exports.getSingleCustomerAddress = function(id) {
  return knex('delivery_addresses').select().where('customer_id', id);
};

getAddress = (hash)=>{
  return new Promise((resolve,reject)=>{
    axios('https://api.opencagedata.com/geocode/v1/json?q='+hash.address1+','+hash.city+','+hash.state+'&key=07575882452c47d09baf188e72e1bba5')
    .then(data => {
      obj = data.data.results[0].geometry;
      hash['latitude'] = obj.hasOwnProperty('lat') ? obj.lat : '';
      hash['longitude'] = obj.hasOwnProperty('lng') ? obj.lng : '';
      resolve(hash);
    });
  })
}

exports.createAddress = async(hash)=>{
  let obj = {};
  // axios('https://api.opencagedata.com/geocode/v1/json?q='+hash.address1+','+hash.city+','+hash.state+'&key=07575882452c47d09baf188e72e1bba5')
  // .then(data => {
  //   obj = data.data.results[0].geometry;
  //   hash['latitude'] = obj.hasOwnProperty('lat') ? obj.lat : '';
  //   hash['longitude'] = obj.hasOwnProperty('lng') ? obj.lng : '';
  //   console.log('ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt',hash)
  //   debug('createAddress');
  //   debug(hash);
  // });
  let address = await getAddress(hash);
    console.log('ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt222',address)
  // hash['latitude'] = obj.hasOwnProperty('lat') ? obj.lat : '';
  // hash['longitude'] = obj.hasOwnProperty('lng') ? obj.lng : '';
  // debug('createAddress');
  // debug(hash);
  return knex('delivery_addresses').insert(address ? address : hash).returning('*');
};

exports.updateAddress = function(id, hash) {
  debug('updateAddress');
  debug(hash);
  return knex('delivery_addresses').update(hash).where('id',id).returning('*');
};

exports.deleteAddress = function(id) {
  return knex('delivery_addresses').where('id', id).del()
};

