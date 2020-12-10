var auth = require('./authentication.server.controller');
var Company = require('../models/company.server.model');
var Customer = require('../models/customer.server.model');
var Categories = require('../models/categories.server.model');
var Request = require('../models/request.server.model');
var Offer = require('../models/offer.server.model');
var User = require('../models/user.server.model');
var debug   = require('debug')('auth');
var logger = require('winston');
var ParseUtils = require('../utils/parseutils');

exports.createRequest = function * (next) {
    var request = this.body;
    request.customer_id = this.params.customer_id;

    try {
        var customer = yield Customer.getSingleCustomer(request.customer_id);
    } catch (err) {
        logger.error("Invalid Customer ID provided. Cannot create request.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Customer ID.'};
        return;
    }

    var userData = yield User.getUserByCustomerId(request.customer_id);
    request.customer = userData.first_name + " " + userData.last_name.substring(0,1);

    var errors = validateRequestData(request);
    if (errors.length > 0) {
        this.status = 422; // Unprocessable Entity
        this.body = {status: false, error : errors};
        return;
    }
   
    try {
        var categories = yield Categories.getCategory(request.category_id);
        request.category = categories.category;
        request.category_photo = categories.category_photo;
    } catch (err) {
        logger.error("Invalid Category ID provided. Cannot create request.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Category provided.'};
        return;
    }

    try {
        var response = yield Request.createRequest(request);
        this.status = 201;
        this.body = {status:201,message : 'Request created.', data : response};
    } catch (err) {
        logger.error('Error saving request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error saving the request.'};
        // throw (err);
    }
    return;
}

exports.updateRequest = function * (next) {
    var requestCheck = yield Request.getRequestByCustomer(this.params.request_id, this.params.customer_id);

    if (!requestCheck) {
        logger.error("Invalid Request data provided. Cannot update the request.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Request data provided. Cannot update the request.'};
        return;
    }
    
    var request = this.body;
    var errors = validateRequestData(request);
    if (errors.length > 0) {
        this.status = 422; // Unprocessable Entity
        this.body = {status: false, error : errors};
        return;
    }
   
    try {
        var response = yield Request.updateRequest(this.params.request_id, request);
        this.status = 201;
        this.body = {status:201,message : 'Request updated.', data : response};
    } catch (err) {
        logger.error('Error updating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error saving the request.'};
        // throw (err);
    }
    return;
}

function validateRequestData(requestBody) {
    var errors = [];

    Object.keys(requestBody).forEach(function eachKey(key) {
        if (key == "latitude" || key == "longitude") {
            if (!Number.isFinite(requestBody[key])) {
                errors.push({ "field": key, "error": "Invalid value provided for the field."});
            }
        } else if (key == "category_id") {
            if (!Number.isInteger(requestBody[key])) {
                errors.push({ "field": key, "error": "Invalid value provided for the field."});
            }
        }
    });

    return errors;
}

exports.getRequestsById = function * (next) {
    var requestData = yield Request.getRequestByCustomer(this.params.request_id, this.params.customer_id);
    
    if (!requestData)
    {
        logger.error("Request not found with the Request ID and Customer ID provided.");
        this.status = 404;
        this.body = {status:404,message: 'Request not found with the Request ID and Customer ID provided.'};
        return;
    }
  
    this.status = 200;
    let data = (yield Offer.getAllOffersByRequest(requestData));
    this.body = {data:data,message:'get request by id',status:200}
    return;
};

exports.getAllRequestsByCustomerId = function * (next) {
    try {
        var customerCheck = yield Customer.getSingleCustomer(this.params.customer_id);
    } catch (err) {
        logger.error("Invalid Customer ID provided. Cannot get the request.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Customer ID.'};
        return;
    }
  
    try {
        var allRequests;
        if (this.query.filter_in_weeks) {
            allRequests = (yield Request.getRequestsByCustomerIdWeekFilter(this.params.customer_id, this.query.filter_in_weeks)).rows;
        } else {
            allRequests = (yield Request.getRequestsByCustomerId(this.params.customer_id)).rows;
        }
        
        this.status = 200;
        let data = (yield Offer.getAllOffersRequestList(allRequests))
        this.body = {data:data,message:'get request by customerid',status:200}
    } catch (err) {
        logger.error('Error getting request by customer ID.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error getting request by customer ID.'};
        // throw (err);
        return;
    }
    return;
}

exports.deleteRequest = function * (next){
    var requestCheck = yield Request.getRequestByCustomer(this.params.request_id, this.params.customer_id);

    if (!requestCheck) {
        logger.error("Invalid Request data provided. Cannot delete the request.");
        this.status = 404;
        this.body = {error: 'Invalid Request data provided. Cannot delete the request.'};
        return;
    }

    try {
        this.status = 200;
        let data = (yield Request.deleteSingleRequest(this.params.request_id));
        this.body = {status:200,message:'delete request',data:data}
    } catch (err) {
        logger.error('Error deleting request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error deleting request.'};
        // throw (err);
        return;
    }
    return;
}

exports.getRequestsContractApprovedByCompany = function * (next) {
    try {
        var companyCheck = yield Company.getSingleCompany(this.params.company_id);
    } catch (err) {
        logger.error("Invalid Company ID provided. Cannot get offers.");
        this.status = 404;
        this.body = {status:404,message: 'Invalid Company ID.'};
        return;
    }
  
    try {
        this.status = 200;
        let data = (yield Request.getRequestsByCompanyContractApproved(this.params.company_id));
        this.body = {data:data, message:'get request contract approve by company',status:200}
    } catch (err) {
        logger.error('Error getting request by company ID.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error getting request by company ID.'};
        // throw (err);
        return;
    }
    return;
}

exports.getRequestsContractApprovedByCustomer = function * (next) {
    try {
        var customerCheck = yield Customer.getSingleCustomer(this.params.customer_id);
    } catch (err) {
        logger.error("Invalid Customer ID provided. Cannot get the request.");
        this.status = 404;
        this.body = {error: 'Invalid Customer ID.'};
        return;
    }
  
    try {
        this.status = 200;
        let data = (yield Request.getRequestByCustomerContractApproved(this.params.customer_id));
        this.body = {data:data,message:'get request contract approve by customer',status:200}
    } catch (err) {
        logger.error('Error getting request by customer ID.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500,message : 'Error getting request by customer ID.'};
        return;
        // throw (err);
    }
    return;
}