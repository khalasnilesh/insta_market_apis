var knex  = require('../../config/knex');
var debug = require('debug')('company.model');


exports.setchat = function(data,id){
  return knex('companies').update({telegram_url : data}).where('id',id).returning('*');
}

exports.companyForCompanyName = function(companyName) {
  return knex('companies').select('*').where('name', 'ILIKE', companyName)
};

exports.companyForUser = function(userId) {
  return knex('companies').select('*').where('user_id', userId)
};

exports.getAllCompanies = function() {
  return knex('companies').select('*')
};
exports.listState = function(id) {
  return knex('states').select('*').where('country_id',id)
};

exports.getAllUnits = function(id){
  return knex('units').select('*').where('company_id',id)
}

exports.getSingleCompany = function(id) {
  return knex('companies').select('*').where('id', id)
};
exports.getSingleCompanyByunit = function(id) {
  return knex('units').select('*').where('id', id)
};

exports.getProductsBycategoryandcompany = function(id){
  return knex('products').select('*')

}

exports.getSingleCategory = function(name) {
  return knex('categories').select('*').where('name', name)
};



exports.getForUser = function(userId) {
  return knex('companies').select('*').where('user_id', userId)
};

exports.updateFeaturedDish = function(companyId, cdnPath) {
  var hash = { featured_dish : cdnPath }
  return knex('companies').update(hash).where('id', companyId).returning('*')
};
exports.updateThumbnail = function(companyId, cdnPath) {
  var hash = { thumbnail : cdnPath }
  return knex('companies').update(hash).where('id', companyId).returning('*')
};

exports.updatePhoto = function(companyId, cdnPath) {
  var hash = { photo : cdnPath }
  return knex('companies').update(hash).where('id', companyId).returning('*')
};

exports.updateCompany = function(companyId, data) {
  return  knex('companies').update(data).where({'id': companyId});
};


exports.verifyOwner = function(companyId, userId) {
  return knex('companies').select('*').where({
    id: companyId,
    user_id: userId
  })
};

exports.createCompany = function(name, email, userId, moltCoId, moltDefCat, moltSlug, 
  deliveryCat, deliveryItem, deliveryChgAmount, dailySpecialCat, countryId, taxband, latitude, longitude, distance_range,google_api_key,google_sheet_url,google_sheet_tab_name) {
  return knex('companies').insert(
    {
      name: name,
      email: email,
      user_id: parseInt(userId),
      order_sys_id: moltCoId,
      default_cat: moltDefCat,
      delivery_chg_cat_id: deliveryCat,
      delivery_chg_item_id: deliveryItem,
      delivery_chg_amount: deliveryChgAmount,
      daily_special_cat_id: dailySpecialCat,
      base_slug: moltSlug,
      country_id: countryId,
      taxband: taxband,
      latitude ,
      longitude,
      distance_range,
      google_api_key,
      google_sheet_url,
      google_sheet_tab_name
    }).returning('*');
};

exports.deleteCompany = function(companyId) {
  return knex('companies').where('id', companyId).del();
};

exports.softDeleteCompany = function(companyId) {
 return knex('companies').update( {
          is_deleted: true
        }).where({id: companyId});
}

exports.getCompanyByUnit = function(company_id, unit_id) {
  return knex('companies').select('companies.*').join('units', 'companies.id', 'units.company_id')
          .where('companies.id', company_id).andWhere('units.id', unit_id);
}

exports.updateTags = function(id,{tags,hours,schedule}){
  return knex('companies').update({hours,tags,schedule}).where({id}).returning('*');
}