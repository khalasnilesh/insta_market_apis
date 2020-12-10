var auth = require('./authentication.server.controller');
var Pawnshop = require('../models/pawnshop.server.model');
var Customer = require('../models/customer.server.model');
var Company = require('../models/company.server.model');
var Request = require('../models/request.server.model');
var Offer = require('../models/offer.server.model');
var Unit = require('../models/unit.server.model');
var Categories = require('../models/categories.server.model');
var User = require('../models/user.server.model');
var QueryHelper = require('../utils/query-helper');
var FormatUtils = require('../utils/formatutils');
var debug   = require('debug')('auth');
var ParseUtils = require('../utils/parseutils');
var logger = require('winston');
var passport = require('passport');
var geodist = require('geodist');


exports.getOffersByCompany = function * (next) {
    try {
        var companyCheck = yield Company.getSingleCompany(this.params.company_id);
    } catch (err) {
        logger.error("Invalid Company ID provided. Cannot get offers.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID.'};
        return;
    }
    
    var request_ids = (yield Request.getRequestsByCompany(this.params.company_id));

    // Filtering by Offer Accepted
    var offer_accepted = this.query.offer_accepted;
    if (offer_accepted != null) {
        this.status = 200;
        var offerList = (yield Offer.getOffersByCompanyAndOfferStatus(this.params.company_id, offer_accepted));
        var requestList = (yield Request.getRequestsByOfferIdList(offerList.map(x => x.request_id)));
        
        this.body = {status:200,message:"Get offer by company",data:mergeRequestOffer(requestList, offerList)};
        return;
    }
    
    // Filtering by Contract Approved.
    var contract_approved = this.query.contract_approved;
    if (contract_approved != null) {
        this.status = 200;
        var offerList = (yield Offer.getOffersByCompanyAndContractStatus(this.params.company_id, contract_approved));
        var requestList = (yield Request.getRequestsByOfferIdList(offerList.map(x => x.request_id)));
        
        this.body = {status:200,data:mergeRequestOffer(requestList, offerList)};
        return;
    }
    
    // If there's no query in the URL, the all offers will be displayed.
    var request_ids = (yield Request.getRequestsByCompanyContractNotApproved(this.params.company_id));
    this.status = 200;
    this.body = {status:200,data:(yield Offer.getOffersByRequestAndCompany(request_ids.rows, this.params.company_id))};
    return;
}

exports.getOffersByUnit = function * (next) {
    var company = yield Company.getCompanyByUnit(this.params.company_id, this.params.unit_id);
    if (company.length === 0) {
        logger.error("Invalid Company ID/Unit ID provided. Cannot get offers.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID/Unit ID provided.'};
        return;
    }
    
    // Filtering by Offer Accepted
    var offer_accepted = this.query.offer_accepted;
    if (offer_accepted != null) {
        this.status = 200;
        var offerList = (yield Offer.getOffersByCompanyUnitAndOfferStatus(this.params.company_id, this.params.unit_id, offer_accepted));
        var requestList = (yield Request.getRequestsByOfferIdList(offerList.map(x => x.request_id)));
        
        this.body = {status:200,data:mergeRequestOffer(requestList, offerList)};
        return;
    }
    
    // Filtering by Contract Approved.
    var contract_approved = this.query.contract_approved;
    if (contract_approved != null) {
        this.status = 200;
        var offerList = (yield Offer.getOffersByCompanyUnitAndContractStatus(this.params.company_id, this.params.unit_id, contract_approved));
        var requestList = (yield Request.getRequestsByOfferIdList(offerList.map(x => x.request_id)));
       
        this.body = {status:200,data:mergeRequestOffer(requestList, offerList)};
        return;
    }
    
    // If there's no query in the URL, the all offers will be displayed.
    //var request_ids = (yield Request.getRequestsByCompanyUnit(this.params.company_id, this.params.unit_id));
    var request_ids = (yield Request.getRequestsByCompanyContractNotApproved(this.params.company_id));
    this.status = 200;
    this.body = {status:200,data:(yield Offer.getOffersByRequestAndCompanyUnit(request_ids.rows, this.params.company_id, this.params.unit_id))};
    return;
}

function mergeRequestOffer(requestList, offerList) {
    var offerAcceptedList = [];
    for (var i = 0; i < requestList.length; i++) {
        var tempOfferList = [];
        for (var j = 0; j < offerList.length; j++) {
            if (requestList[i].id == offerList[j].request_id) {
                tempOfferList.push(offerList[j]);
            }
        }
        if (tempOfferList.length > 0) {
            offerAcceptedList.push({"request": requestList[i], "offers": tempOfferList});
        }
    }

    return offerAcceptedList;
}

exports.createOffer = function * (next) {
    var request = this.body;

    request.company_id = parseInt(this.params.company_id);
    request.unit_id = parseInt(this.params.unit_id);
    var company = yield Company.getCompanyByUnit(request.company_id, request.unit_id);
    if (company.length === 0) {
        logger.error("Invalid Company ID/Unit ID provided.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID/Unit ID provided.'};
        return;
    }
    
    var pawnPoc = null;
    try {
        pawnPoc = yield Pawnshop.getPawnPoc(request.unit_id);
    } catch (err) {
        logger.error("Invalid Unit ID provided.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Unit ID.'};
        return;
    }

    if(pawnPoc) {
        request.pawn_poc = pawnPoc.username;
    } 

    var errors = validateOfferData(request);
    if (errors.length > 0) {
        this.status = 422; // Unprocessable Entity
        this.body = {status: false, error : errors};
        return;
    }

    request.pawn_name = company[0].name;
    request.pawn_address = company[0].business_address;
    request.pawn_phone = company[0].phone;
    request.pawn_image = company[0].photo;

    var requestData;
    try {
        requestData = yield Request.getRequest(request.request_id);
        request.request_name = requestData.request_name;
        request.offer_condition = requestData.condition;
        request.offer_photo = requestData.request_photo;
        request.offer_photo2 = requestData.request_photo2;
        request.offer_photo3 = requestData.request_photo3;
        request.offer_description = requestData.request_description;
        request.offer_category = requestData.category;
        request.category_photo = requestData.category_photo;
    } catch (err) {
        this.status = 422; // Unprocessable Entity
        this.body = {status: 422, message : "Invalid Request ID provided."};
        return;
    }
    
    var userData = yield User.getUserByCustomerId(requestData.customer_id);
    request.customer = userData.first_name + " " + userData.last_name.substring(0,1);

    try {
        var unitCoordinates = yield Unit.getUnitCoordinates(request.unit_id);
        var pawnShopCoordinates = {lat: parseFloat(unitCoordinates[0].latitude), lon: parseFloat(unitCoordinates[0].longitude)};
        var customerCoordinates = {lat: parseFloat(requestData.latitude), lon: parseFloat(requestData.longitude)};
        request.distance = FormatUtils.round(geodist(pawnShopCoordinates, customerCoordinates, {exact: true, unit: 'mi'}), 1);
    } catch (err) {
        logger.error('Coordinates not available for Pawn Shop. Cannot process this request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Coordinates not available for Pawn Shop. Cannot process this request. (' + request.unit_id + ')'};
        return;
    }

    try {
        var response = yield Offer.createOffer(request);
        this.status = 201;
        this.body = {status:200,message : 'Request created.', data : response};
    } catch (err) {
        logger.error('Error saving offer');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error saving offer.'};
        // throw (err);
        return;
    }
    return;
}

exports.updateOffer = function * (next) {

    var user = this.passport.user;
    var requestInfo = yield Request.getRequestsByOffer(this.params.offer_id);
    var customerInfo = yield Customer.getSingleCustomer(requestInfo[0].customer_id);

    if (!((user.role == 'CUSTOMER' && user.id == customerInfo[0].user_id) ||
        (user.role == 'ADMIN') || (user.role == 'UNITMGR'))) {
      logger.error('User not authorized');
      this.status=401
      this.body = {status:401,message: 'User not authorized'}
      return;
    }

    var request = this.body;
    var offerData;
    try{
        offerData = yield Offer.getOffer(this.params.offer_id);
    } catch(err){
        logger.error('Error while retrieving offer.');
        this.status = 404;
        this.body = {status:404,message: 'Invalid Offer ID.'};
        return;
    } 

    var errors = validateOfferData(request);
    if (errors.length > 0) {
        this.status = 422; // Unprocessable Entity
        this.body = {status: false, error : errors};
        return;
    }

    if (request.contract_approved != null && request.contract_approved) {
        request.contract_date = new Date().toUTCString();
        
        var date = new Date();
        request.maturity_date = new Date(date.getTime() + parseInt(offerData.offer_term) * 86400000).toUTCString();

        if(parseInt(offerData.buy_back_amount) > parseInt(offerData.cash_offer)) {
            var interest_rate = (1/(offerData.offer_term/30))*(offerData.buy_back_amount/offerData.cash_offer - 1);
            request.interest_rate = FormatUtils.round(interest_rate*100, 1);
        } else {
            this.status = 422; // Unprocessable Entity
            this.body = {status: 422, error : { "field": "interest_rate", "error": "Cash offer should be less than buy back amount."}};
            return;
        }    
    }

    this.status = 200;
    this.body = {status:200,data:(yield Offer.updateOffer(this.params.offer_id, request))};
    return;
}

function validateOfferData(requestBody) {
    var errors = [];

    Object.keys(requestBody).forEach(function eachKey(key) {
        if (key == "distance" || key == "cash_offer" || key == "buy_back_amount"
         || key == "tax_amount" || key == "total_redemption" || key == "rating") {
            if (!Number.isFinite(requestBody[key])) {
                errors.push({ "field": key, "error": "Invalid value provided for the field."});
            }
        } else if (key == "request_id" || key == "company_id" || key == "unit_id") {
            if (!Number.isInteger(requestBody[key])) {
                errors.push({ "field": key, "error": "Invalid value provided for the field."});
            }
        } else if (key == "offer_term") {
            if (!Number.isFinite(requestBody[key])) {
                errors.push({ "field": key, "error": "Invalid value provided for the field."});
            }

            if (parseFloat(requestBody[key]) % 30 !== 0) {
                errors.push({ "field": key, "error": "Only multiples of 30 are accepted in the field."});
            }
        }
    });

    return errors;
}

exports.deleteOffer = function * (next) {
    try{
        var offerCheck = yield Offer.getOffer(this.params.offer_id);
        if (offerCheck.is_deleted == true) {
            this.status = 404;
            this.body = { error: 'Offer ID does not exist. Cannot delete it.' };
            return;
        }
        if ((offerCheck.company_id != parseInt(this.params.company_id))
             || (offerCheck.unit_id != parseInt(this.params.unit_id))) {
            this.status = 404;
            this.body = { status:404,message: 'Invalid Company ID/Unit ID provided. Cannot delete the Offer.' };
            return;
        }
    } catch(err){
        logger.error('Error while retrieving offer.');
        this.status = 404;
        this.body = {status:404,message: 'Invalid Offer ID. Cannot delete the Offer.'};
        return;
    } 

    this.status = 200;
    this.body = {status:200,data:(yield Offer.deleteSingleOffer(this.params.offer_id))};
    return;
}

exports.getOffersEmptyRequestsByCompany = function * (next) {
    try {
        var companyCheck = yield Company.getSingleCompany(this.params.company_id);
    } catch (err) {
        logger.error("Invalid Company ID provided. Cannot get offers.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID.'};
        return;
    }

    var requestsList = (yield Request.getRequestsByCompany(this.params.company_id));
    var unitCoordinates = yield Unit.getAllCompanyCoordinates(this.params.company_id);

    var requestsNoOffersList = (yield Request.getRequestsNoOffersByCompany(this.params.company_id));
    for (var i = 0; i < requestsNoOffersList.rows.length; i++) {
        for (var j = 0; j < unitCoordinates.length; j++) {
            var pawnShopCoordinates = {lat: parseFloat(unitCoordinates[j].latitude), lon: parseFloat(unitCoordinates[j].longitude)};
            var customerCoordinates = {lat: parseFloat(requestsNoOffersList.rows[i].latitude), lon: parseFloat(requestsNoOffersList.rows[i].longitude)};

            var currentDistance = geodist(pawnShopCoordinates, customerCoordinates, {exact: true, unit: 'mi'});
            if (currentDistance <= 30) {
                requestsList.push(requestsNoOffersList.rows[i]);
                break;
            }
        }
    }
    this.status = 200;
    this.body = {status:200,data:(yield Offer.getOffersByRequestAndCompany(requestsList, this.params.company_id))};
    return;
}

exports.getOffersEmptyRequestsByCompanyUnit = function * (next) {
    var company = yield Company.getCompanyByUnit(this.params.company_id, this.params.unit_id);
    if (company.length === 0) {
        logger.error("Invalid Company ID/Unit ID provided.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID/Unit ID provided.'};
        return;
    }

    var requestsList = (yield Request.getRequestsByCompanyUnit(this.params.company_id, this.params.unit_id));

    var unitCoordinates = yield Unit.getUnitCoordinates(this.params.unit_id);
    var requestsNoOffersList = (yield Request.getRequestsNoOffersByCompanyUnit(this.params.company_id, this.params.unit_id));
    for (var i = 0; i < requestsNoOffersList.rows.length; i++) {
        var pawnShopCoordinates = {lat: parseFloat(unitCoordinates[0].latitude), lon: parseFloat(unitCoordinates[0].longitude)};
        var customerCoordinates = {lat: parseFloat(requestsNoOffersList.rows[i].latitude), lon: parseFloat(requestsNoOffersList.rows[i].longitude)};

        var currentDistance = geodist(pawnShopCoordinates, customerCoordinates, {exact: true, unit: 'mi'});
        if (currentDistance <= 30) {
            requestsList.push(requestsNoOffersList.rows[i]);
        }
    }
    this.status = 200;
    this.body = {status:200,data:(yield Offer.getOffersByRequestAndCompanyUnitAndOfferStatus(requestsList, this.params.company_id, this.params.unit_id, false))};
    return;
}
