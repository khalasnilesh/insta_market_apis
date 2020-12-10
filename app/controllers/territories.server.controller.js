const Territory = require('../models/territories.server.model');
var logger = require('winston');

exports.createTerritory = function* (next) {
    if(this.body){
    if (this.passport.user.role === 'ADMIN') {
        try {
            var territory = (yield Territory.createTerritory(this.body));
            this.status = 200;
            this.body = { status:200,message: 'Request created.', data: territory };
            return;
        } catch (error) {
            logger.error('Error creating request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = { status:500,message: 'Error creating the request.' };
            // throw (error);
            return;
        }
    } else {
        this.status = 401;
        this.body = { status:401,message: 'role is not accessable' }
        return;
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
}
}

exports.updateTerritory = function*(){
    if(this.body){
    if (this.passport.user.role === 'ADMIN'){
        try{
            var territory = (yield Territory.updateTerritory(this.body, this.params.territoryId));
            this.status = 200;
            this.body = { status:200,message: 'Request updated.', data: territory };
            return;
        }catch(error){
            logger.error('Error updating request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = {status:500, message: 'Error updating the request.' };
            // throw (error);
            return;
        }
    }else{
        this.status = 401;
        this.body = {status:401, message: 'role is not accessable' }
        return;
    }
}else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
}
}

exports.deleteTerritory = function*(){
    if (this.passport.user.role === 'ADMIN'){
        try{
            var territory = (yield Territory.deleteTerritory(this.params.territoryId));
            this.status = 200;
            this.body = {status:200, message: 'Territory Deleted', territory };
            return;
        }catch(error){
            logger.error('Error deleting request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = {status:500, message: 'Error deleting the request.' };
            // throw (error);
            return;
        }
    }else{
        this.status = 401;
        this.body = {status:401, message: 'role is not accessable' } 
        return;
    }
}