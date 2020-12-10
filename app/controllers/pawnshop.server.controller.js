/**
 * @author Sávio Muniz
 */
var auth = require('./authentication.server.controller');
var Pawnshop = require('../models/pawnshop.server.model');
var Request = require('../models/request.server.model');
var Offer = require('../models/offer.server.model');
var QueryHelper = require('../utils/query-helper');
var FormatUtils = require('../utils/formatutils');
var debug   = require('debug')('auth');
var ParseUtils = require('../utils/parseutils');
var geodist = require('geodist');

exports.getContractsById = function * (next) {
    var contract = yield getSingleContract(this.params.contract_id);

    if(contract.length == 0) {
        this.status = 404;
        this.body = {error : 'Invalid Contract id'};
        return;
    }

    this.status = 200;
    this.body = {status:200,data:contract};
    return;
}

exports.getContractsByQrCode = function * (next) {
    var contract = yield getSingleContractByQrCode(this.params.qr_code);

    if(contract.length == 0) {
        this.status = 404;
        this.body = {error : 'Invalid QR Code'};
        return;
    }

    this.status = 200;
    this.body = {status:200,data:contract};
    return;
}

exports.getContractsByCustomerId = function * (next){
    var customer = yield getCustomer(this.params.customer_id);

    if(!customer) {
        this.status = 404;
        this.body = {error : 'Invalid Customer id'};
        return;
    }

    this.status = 200;
    this.body = {status:200,data:(yield getContractsByCustomer(this.params.customer_id))};
    return;
}

exports.getContractsByCompanyId = function * (next){
    var company = yield getSingleCompany(this.params.company_id);

    if(!company) {
        this.status = 404;
        this.body = {error : 'Invalid Company id'};
        return;
    }

    var offer_approved = this.query.offer_approved;

    this.status = 200;
    this.body = {status:200,data:(yield getContractsByCompany(this.params.company_id, offer_approved))};
    return;
}

exports.deleteContract = function * (next) {
    var contract = yield getSingleContractId(this.params.contract_id);
    
    if(contract.length == 0) {
        this.status = 404;
        this.body = {error : 'Invalid Contract id'};
        return;
    }

    var contractOfferFlag = yield checkContractOfferFlag(this.params.contract_id);

    if(!contractOfferFlag) {
        this.status = 200;
        this.body = {error : 'Cannot Delete Contract, Offer Already Accepted'};
        return;
    }

    this.status = 200;
    this.body = {status:200,data:(yield Pawnshop.deleteSingleContract(this.params.contract_id))};
    return;
}

exports.getPawnshopsByCoordinates = function * (next){
    var customerLatitude = parseFloat(this.query.latitude);
    var customerLongitude = parseFloat(this.query.longitude);
    var distance = parseFloat(this.query.distance);

    var paramsValidation = validateCoordinatesDistance(customerLatitude, customerLongitude, distance);
    if(paramsValidation.length > 0) {
        this.status = 404;
        this.body = paramsValidation;
        return;
    }

    /*
     * This interval (5) represents about 550km radius from the coordinates
     * provided considering the coordinates are in Equator. It means that
     * the search in database will be restricted to Pawn Shops inside this
     * interval. More accurate search is performed below based on the
     * distance provided. This interval was added just to avoid returning
     * all Pawn Shops that exist in the database.
     */
    var interval =  5;
    var latRange = [customerLatitude + interval, customerLatitude - interval];
    var longRange = [customerLongitude + interval, customerLongitude - interval];

    var pawnShopList;
    try{
        pawnShopList = yield Pawnshop.getPawnShopListByCoordinates(latRange, longRange);
    }catch(err){
        logger.error('Error Getting Pawnshops');
        debug('Error Getting Pawnshops');
        throw(err);
    }

    var customerCoordinates = {lat: customerLatitude, lon: customerLongitude};
    var pawnShopsFound = [];
    for (var i = 0; i < pawnShopList.length; i++) {
        var pawnShopCoordinates = {lat: parseFloat(pawnShopList[i].latitude), lon: parseFloat(pawnShopList[i].longitude)};
        var distCustomerPawnShop = geodist(pawnShopCoordinates, customerCoordinates, {exact: true, unit: 'mi'});

        if (distCustomerPawnShop <= distance) {
            pawnShopList[i].distance = FormatUtils.round(distCustomerPawnShop, 1);
            pawnShopsFound.push(pawnShopList[i]);
        }
    }

    this.status = 200;
    this.body = {data:pawnShopsFound,status:200};
    return;
}

function validateCoordinatesDistance(latitude, longitude, distance) {
    var errorList = [];
    if (isNaN(distance)) {
        errorList.push({field: "distance", error : 'Required parameter missing.'});
    } else if (distance < 0) {
        errorList.push({field: "distance", error : 'Distance must be greater than zero.'});
    }

    if (!latitude) {
        errorList.push({field: "latitude", error : 'Required parameter missing.'});
    } else if (latitude < -90 || latitude > 90) {
        errorList.push({field: "latitude", error : 'Latitude must be between interval -90 and 90.'});
    }

    if (!longitude) {
        errorList.push({field: "longitude", error : 'Required parameter missing.'});
    } else if (longitude < -180 || longitude > 180) {
        errorList.push({field: "longitude", error : 'Longitude must be between interval -180 and 180.'});
    }

    return errorList;
}

exports.getAllRequests = function * (next) {
    if ((this.query.latitude) || (this.query.longitude) || (this.query.distance)) {
        var companyLatitude = parseFloat(this.query.latitude);
        var companyLongitude = parseFloat(this.query.longitude);
        var distance = parseFloat(this.query.distance);

        var paramsValidation = validateCoordinatesDistance(companyLatitude, companyLongitude, distance);
        if(paramsValidation.length > 0) {
            this.status = 404;
            this.body = paramsValidation;
            return;
        }

        /*
        * This interval (5) represents about 550km radius from the coordinates
        * provided considering the coordinates are in Equator. It means that
        * the search in database will be restricted to Requests inside this
        * interval. More accurate search is performed below based on the
        * distance provided. This interval was added just to avoid returning
        * all Requests that exist in the database.
        */
        var interval =  5;
        var latRange = [companyLatitude + interval, companyLatitude - interval];
        var longRange = [companyLongitude + interval, companyLongitude - interval];

        var requestList;
        try{
            requestList = yield Request.getRequestsNoOffersByCoordinates(latRange, longRange);
        }catch(err){
            logger.error('Error Getting Requests');
            debug('Error Getting Requests');
            throw(err);
        }

        var companyCoordinates = {lat: companyLatitude, lon: companyLongitude};
        var requestsFound = [];
        for (var i = 0; i < requestList.rows.length; i++) {
            var requestsCoordinates = {lat: parseFloat(requestList.rows[i].latitude), lon: parseFloat(requestList.rows[i].longitude)};
            var distRequestCompany = geodist(companyCoordinates, requestsCoordinates, {exact: true, unit: 'mi'});

            if (distRequestCompany <= distance) {
                requestsFound.push({"request": requestList.rows[i], "offers": []});
            }
        }

        this.status = 200;
        this.body = {status:200,data:requestsFound};
        return;
    }

    var request_ids = (yield Request.getRequests());
    this.status = 200;
    this.body = {status:200,data:(yield Offer.getOffersByRequest(request_ids))};
    return;
}
exports.getCountByContext = function * (next) {
    var params = this.params[0];    
    var param_array = params.split('/');
    
    if(param_array.length != 3){
        this.status = 404;
        this.body = {status:404,message : 'Invalid Context Passed'};
        return;
    }

    this.state = 200;
    this.body = {status:200,data:(yield Pawnshop.getCountByContext(param_array))};
    return;
}

exports.createContract = function * (next) {
    var request = this.body;
    var company = yield getSingleCompany(request.company_id);

    if(!company){
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company id'};
        return;
    }

    var checkArr = [undefined,null,'',""];
    var param_array = [ request.company_id,
                        request.unit_id,
                        request.customer_id,
                        request.offer_id,
                        request.request_name,
                        request.request_photo,
                      ];

    if ( param_array.includes(undefined) || param_array.includes(null) || param_array.includes('') ) {          
        this.status = 415;
        this.body = {status:415,message : 'Missing Required Fields'};
        return;
    }else{
        param_array[6] = request.cash_offer;
        param_array[7] = request.buy_back_amount;
        param_array[8] = request.tax_amount;
        param_array[9] = request.term_months;

        var errors = [];
        var regex = /^[-+]?\d+(\.\d+)?$/;

        if(checkArr.includes(param_array[0]) || !regex.test(param_array[0])){
            errors.push({ "field": "company_id", "error": "Invalid Company ID Provided"});
        }
        if(checkArr.includes(param_array[1]) || !regex.test(param_array[1])){
            errors.push({ "field": "unit_id", "error": "Invalid Unit ID Provided"});
        }
        if(checkArr.includes(param_array[2]) || !regex.test(param_array[2])){
            errors.push({ "field": "customer_id", "error": "Invalid Customer ID Provided"});
        }
        if(checkArr.includes(param_array[3]) || !regex.test(param_array[3])){
            errors.push({ "field": "offer_id", "error": "Invalid Offer ID Provided"});
        }
        if(checkArr.includes(param_array[4])){
            errors.push({ "field": "request_name", "error": "Invalid Request Name Provided"});
        }
        if(checkArr.includes(param_array[5])){
            errors.push({ "field": "request_photo", "error": "Invalid Request Photo Provided"});
        }

        if((!checkArr.includes(param_array[6]) && !regex.test(param_array[6])) || param_array[9] == "" ){
            errors.push({ "field": "cash_offer", "error": "Invalid Cash Offer Provided"});
        }
        if((!checkArr.includes(param_array[7]) && !regex.test(param_array[7])) || param_array[10] == "" ){
            errors.push({ "field": "buy_back_amount", "error": "Invalid Buy Back Amount Provided"});
        }
        if((!checkArr.includes(param_array[8]) && !regex.test(param_array[8])) || param_array[13] == "" ){
            errors.push({ "field": "tax_amount", "error": "Invalid Tax Amount Provided"});
        }
        if((!checkArr.includes(param_array[9]) && !regex.test(param_array[9])) || param_array[14] == "" ){
            errors.push({ "field": "term_months", "error": "Invalid Term Months Provided"});
        }

        if(errors.length > 0){
            this.status = 415;
            this.body = {status:415,status: false, error : errors};
            return;
        }

        var qrcode = undefined;

        while (!qrcode) {
          qrcode = ParseUtils.getRandomNumber(15);
          if (qrcode.length > 0)
            qrcode = undefined;
        }

        param_array[10] = qrcode;

        var response = yield saveContract(param_array);
        this.status = 201;
        this.body = {status:200,message : 'contract created', data : response};
        return;
    }
}

function * checkQRCodeExistence(qrcode) {
  var qrCode = (yield Pawnshop.getQRCode(qrcode));
  return qrCode;
}

function checkContractOfferFlag(id){
    try{
        return Pawnshop.checkContractOfferFlag(id);
    }catch(err){
        logger.error('Error Getting Contract');
        debug('Error Getting Contract');
        throw(err);
    }
}

function getContractsByCustomer(id) {
    try{
        return Pawnshop.getContractsByCustomer(id);
    }catch(err){
        logger.error('Error Getting Contract');
        debug('Error Getting Contract');
        throw(err);
    }
}

function getContractsByCompany(id, offer_approved) {
    try{
        return Pawnshop.getContractsByCompany(id, offer_approved);
    }catch(err){
        logger.error('Error Getting Contract');
        debug('Error Getting Contract');
        throw(err);
    }
}

function getSingleCompany(company){
    try{
        return Pawnshop.getSingleCompany(company);
    } catch(err) {
        logger.error('Error Getting Company');
        debug('Error Getting company');
        throw(err);
    }
}

function saveContract(request) {
  try {
      return Pawnshop.createContract(request);
  } catch (err) {
      logger.error('Error saving contract');
      debug('Error saving contract');
      throw (err);
  }
}

function getCustomer(id) {
  try {
    return Pawnshop.getSingleCustomer(id);
  }
  catch (err) {
    logger.error('Error while retrieving request');
    debug('Error while retrieving request');
    throw (err);
  }
}

function getSingleContractId(qr_code) {
    try{
        return Pawnshop.getSingleContractId(qr_code);
    }catch(err){
        logger.error('Error while retrieving contract');
        debug('Error while retrieving contract');
        throw(err);
    }
}

function getSingleContractByQrCode(id) {
    try{
        return Pawnshop.getSingleContractByQrCode(id);
    }catch(err){
        logger.error('Error while retrieving contract');
        debug('Error while retrieving contract');
        throw(err);
    }
}

function getSingleContract(id) {
    try{
        return Pawnshop.getSingleContract(id);
    }catch(err){
        logger.error('Error while retrieving contract');
        debug('Error while retrieving contract');
        throw(err);
    }
}