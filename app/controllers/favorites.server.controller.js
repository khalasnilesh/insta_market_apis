var config  = require('../../config/config');
var auth = require('./authentication.server.controller');
var Company = require ('../models/company.server.model');
var Customer = require ('../models/customer.server.model');
var Favorite = require ('../models/favorites.server.model');
var Unit    = require ('../models/unit.server.model');
var debug   = require('debug')('favorites');
var logger = require('winston');


exports.getCompanyFavorites = function * (next) {
  debug('getCompanyFavorites');
  meta={
    fn:'getCompanyFavorites'
  };
  logger.info('Retrieving Company Favorites', meta);
  if (!this.company) {
    logger.error('Company ID not provided', meta);
    throw new Error('Company id missing', 422);
  }
  debug('..no authorization check required on GET');
  var faves = '';
  meta.company_id=this.company.id;
  try {
    faves = yield Favorite.getForCompany(this.company.id);
  } catch (err) {
    meta.error=err;
    logger.error('Error getting favorites', meta);
    throw err;
  }
  debug('..favorites');
  debug(faves);
  logger.info('Company Favorites retrieved', meta);
  this.body = faves;
  return;
}

exports.getCompanyUnitFavorites = function * (next) {
  debug('getCompanyUnitFavorites');
  meta={
    fn:'getCompanyUnitFavorites'
  };
  logger.info('Retrieving Company Unit Favorites', meta);
  if (!this.company || !this.unit) {
    logger.error('Company/unit id not provided', meta);
    throw new Error('Company/unit id missing');
  }
  meta.company_id=this.company.id;
  meta.unit_id=this.unit.id;
  debug('..no authorization check required on GET');
  var faves = '';
  try {
    faves = yield Favorite.getForCompanyUnit(this.company.id, this.unit.id);
  } catch (err) {
    meta.error=err;
    logger.error('Error getting favorites', meta);
    throw err;
  }
  debug('..favorites');
  debug(faves);
  logger.info('Company Unit Favorites retrieved', meta);
  this.body = faves;
  return;
}

exports.getCustomerFavorites = function * (next) {
  debug('getCustomerFavorites');
  meta={
    fn:'getCustomerFavorites'
  };
  logger.info('Retrieving Customer Favorites', meta);
  if (!this.customer) {
    logger.error('Customer ID not provided', meta);
    throw new Error('Customer id missing');
  }
  debug('..no authorization check required on GET');
  meta.customer_id=this.customer.id;
  var faves = '';
  try {
    faves = yield Favorite.getForCustomer(this.customer.id);
  } catch (err) {
    meta.error=err;
    logger.error('Error getting favorites', meta);
    throw err;
  }
  debug('..favorites');
  debug(faves);
  logger.info('Customer Favorites retrieved', meta);
  this.body = faves;
  return;
}

exports.toggleCustomerFavorite = function * (next) {
  debug('toggleCustomerFavorite');
  meta={
    fn:'toggleCustomerFavorite'
  };
  logger.info('Toggling Customer Favorite', meta);
  if (!this.customer) {
    logger.error('Customer ID not provided', meta);
    this.status= 422;
    this.body = {error: 'Customer id missing'};
    return;
  }
  if (!this.body.company_id) {
    logger.error('Company ID not provided', meta);
    this.status= 422;
    this.body = {error: 'Company id missing'};
    return;
  }
  if (!this.body.unit_id) {
    logger.error('Unit ID not provided', meta);
    this.status= 422;
    this.body = {error: 'Unit id missing'};
    return;
  }
  meta.customer_id=this.customer.id;
  meta.company_id=this.body.company_id;
  meta.unit_id=this.body.unit_id;
  debug('..check authorization');
  var user = this.passport.user;
  if (user.role == 'CUSTOMER' && user.id == this.customer.user_id) {
    debug('..authorized');
    var faves = '';
    try {
      faves = yield Favorite.toggleFavorite(this.body.company_id, this.customer.id, this.body.unit_id);
    } catch (err) {
      meta.error=err;
      logger.error('Error toggling favorite', meta);
      throw err;
    }
    debug('..faves');
    debug(faves);
    logger.info('Customer Favorite Toggled', meta);
    this.body = faves;
    return;
  } else {
    logger.error('User not authorized', meta);
    this.status=401
    this.body = {error: 'User not authorized'}
    return;
  }
}


exports.getCompany=function *(id, next) {
  debug('getCompany');
  debug('id ' + id);
  meta={
    fn:'getCompany',
    company_id:id
  };
  logger.info('Retrieving company', meta);
  var company = '';
  try {
    company = (yield Company.getSingleCompany(id))[0];
  } catch (err) {
    meta.error=err;
    logger.error('error getting company', meta);
    throw(err);
  }
  debug(company);
  logger.info('Company retrieved', meta);
  this.company = company;
  yield next;
}

exports.getCustomer=function *(id, next) {
  debug('getCustomer');
  debug('id ' + id);
  meta={
    fn:'getCustomer',
    customer_id:id
  };
  logger.info('Retrieving customer', meta);
  var customer = '';
  try {
    customer = (yield Customer.getSingleCustomer(id))[0];
  } catch (err) {
    logger.error('error getting customer', meta);
    throw(err);
  }
  debug(customer);
  logger.info('Customer retrieved', meta);
  this.customer = customer;
  yield next;
}

exports.getUnit=function *(id, next) {
  debug('getUnit');
  debug('id ' + id);
  meta={
    fn:'getUnit',
    unit_id:id
  }
  logger.info('Retrieving unit', meta);
  var unit = '';
  try {
    unit = (yield Unit.getSingleUnit(id))[0];
  } catch (err) {
    logger.error('error getting unit', meta);
    throw(err);
  }
  debug(unit);
  logger.info('Unit retrieved', meta);
  this.unit = unit;
  yield next;
}
