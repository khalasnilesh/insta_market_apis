var companies = require('../models/company.server.model');
var logger = require('winston');
var msc = require('../controllers/moltin.server.controller');



exports.deleteCompany = function *(next){
    if(this.params){
        try{
            var deleteCompany = yield companies.deleteCompany(this.params.companyId);
            var singleCompany = yield companies.getSingleCompany(this.params.companyId);
            var del = yield msc.deleteCompany(singleCompany[0].order_sys_id);
            console.log('singleCompanysingleCompanysingleCompanysingleCompanysingleCompanysingleCompany',singleCompany[0].order_sys_id)
            this.status = 200;
            this.body = {status:200, message: 'Company deleted successfully!.' };
            return;
        }catch(error){
            logger.error('Error deleting request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = {status:500, message: 'Error deleting the request.',error:error };
            // throw (error);
            return;
        }
    }else{
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status:400,message: 'Please send required parameters.' };
        return;
    }
}

exports.updateCompany = function *(next){
    if(this.body){
    try{
        var updateCompany = yield companies.updateTags(this.params.companyId,this.body);
        if(updateCompany.length >0){
            this.status = 200;
            this.body = {status:200, message: 'Request updated.', data: updateCompany };
            return;
        }else{
            this.status = 404;
            this.body = { status:400,message: 'Company not found.'};
            return;
        }
    }catch(error){
        logger.error('Error updating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500, message: 'Error updating the request.' };
        // throw (error);
        return;
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
}
}


exports.updateCompanyDetails = function *(next){
    if(this.body){
    try{
        console.log('parseInt(this.params.companyId),this.body',parseInt(this.params.companyId),this.body)
        var updateCompany = yield companies.updateCompany(parseInt(this.params.companyId),this.body);
        if(updateCompany){
            this.status = 200;
            this.body = { status:200,message: 'Request updated.', data: updateCompany };
            return;
        }else{
            this.status = 404;
            this.body = {status:400, message: 'Company not found.'};
            return;
        }
    }catch(error){
        logger.error('Error updating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = {status:500, message: 'Error updating the request.',error:error };
        // throw (error);
        return;
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
}
}



exports.updateGoogleSheetDetails = function *(next){
    if(this.body){
    try{
        var updateCompany = yield companies.updateCompany(parseInt(this.params.companyId),this.body);
        console.log('tttttttttttttttttttttttttttttt',updateCompany)
        if(updateCompany){
            this.status = 200;
            this.body = { status:200,message: 'Request updated.', data: updateCompany };
            return;
        }else{
            this.status = 404;
            this.body = {status:400, message: 'Company not found.'};
            return;
        }
    }catch(error){
        logger.error('Error updating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status:500,message: 'Error updating the request.' };
        // throw (error);
        return;
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
}
}