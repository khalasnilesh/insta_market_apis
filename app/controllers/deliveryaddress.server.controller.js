var Delivery = require('../models/deliveryaddress.server.model');
var debug = require('debug')('units.server.controller');
var logger = require('winston');

exports.createAddress = function* (next) {
    if(this.body){
    try {
        this.body.customer_id = this.params.customerId;
        var unit = yield Delivery.createAddress(this.body);
        this.status = 200;
        this.body = {status:200,message: "Request created", data: unit };
        return;
    } catch (error) {
        if(error.code == '23505'){
            this.status = 422;
            this.body = {status:400, message : 'Entry already exist'};
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status:400, message: 'Error creating the request.' };
        return;
        // throw (error);
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
  }
}

exports.getAddress = function* (next) {
    try {
        var unit = yield Delivery.getSingleCustomerAddress(this.params.customerId);
        this.status = 200;
        this.body = {status:200,message: "Request created", data: unit };
        return;
    } catch (error) {
        if(error.code == '23505'){
            this.status = 422;
            this.body = {status:400, message : 'Entry already exist'};
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status:400, message: 'Error creating the request.' };
        return;
        // throw (error);
    }

}
