var Unit = require('../models/unit.server.model');
var User = require('../models/user.server.model')
var debug = require('debug')('units.server.controller');
var logger = require('winston');
const nodemailer = require('nodemailer');

var obj = {
    "RESTAURANT": "https://drive.google.com/uc?export=view&id=15jiBHQGqNXUwcnFQCuwcKLYqyJNtF25h",
    "GHOST_KITCHEN": "https://drive.google.com/uc?export=view&id=1RZvUHD6tZyCi-AO9zv7iY48nvUUNNdlK",
    "TRUCK": "https://drive.google.com/uc?export=view&id=1aWmpRkdKY5N19VkYpczlT5KN9bNP-W-9",
    "CAFE": "https://drive.google.com/uc?export=view&id=1X633yETizaNH9BjaLzAqnPFVv6v2k3Dv",
    "BEER": "https://drive.google.com/uc?export=view&id=1Zc-Kv4HWX4dhdh_tatBwLcPXlJDxs40z",
    "CHEF": "https://drive.google.com/uc?export=view&id=1ffVlH86M_42hkm_VjvWNrxbYTswq-Giz",
    "WINE": "https://drive.google.com/uc?export=view&id=1GyZGdm1GGgAdOvCpfzejgWy_PpzG7i7k",
    "FRUIT_STAND": "https://drive.google.com/uc?export=view&id=1nN2TGKyf37CubUK9Ap1iUJ_nzx0yAU9i"
}

exports.createUnits = function* (next) {
    if (this.body.username && this.body.name && this.body.password && this.body.territory_id && this.body.type) {
        try {
            this.body.company_id = this.params.companyId;
            var userObject = (yield User.createUser({ username: this.body.username, first_name: this.body.name, role: 'UNITMGR', password: this.body.password, territory_id: this.body.territory_id }))[0];
            this.body.unit_mgr_id = userObject.id;
            this.body.image = obj[this.body.type];
            var unit = yield Unit.createUnits(this.body);
            this.status = 200;
            this.body = { status: 200, data: "Request created", data: unit };
        } catch (error) {
            if (error.code == '23505') {
                this.status = 422;
                this.body = { status: 400, message: 'Entry already exist' };
                return;
            }
            logger.error('Error creating request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = { status: 500, message: 'Error creating the request.' };
            throw (error);
        }
    } else {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Please send required parameters.' };
        return;
    }
}


exports.createManager = function* () {
    if (this.body.username && this.body.first_name && this.body.password) {
        try {
            if (this.body.unitId) {
                // this.body.company_id = this.params.companyId;
                var userObject = (yield User.createUser({ username: this.body.username, manager_id: this.body.manager_id, first_name: this.body.first_name, last_name: this.body.last_name, role: 'UNITMGR', password: this.body.password }))[0];
                this.body.unit_mgr_id = userObject.id;
                // var unit = yield Unit.createUnits(this.body);
                let unit = yield Unit.updateUnitmgr(this.body.unitId, { unit_mgr_id: userObject.id });
                let email = yield sendEmail(this.body.username);
                console.log({ email })
                this.status = 200;
                this.body = { status: 200, data: "Manager created", data: userObject };
                return;
            } else {
                var userObject = (yield User.createUser({ username: this.body.username, manager_id: this.body.manager_id, first_name: this.body.first_name, last_name: this.body.last_name, role: 'FOODPARKMGR', password: this.body.password, territory_id: this.body.territory_id }))[0];
                let food = (yield Unit.getFoodPark(this.body.food_park_id))[0];
                let temp = food.additional_foodpark_mgr;
                if (temp && temp.length != null) {
                    temp.push(userObject.id)
                } else {
                    temp = [userObject.id]
                }
                let food_park = yield Unit.updateFoodParkMgr(this.body.food_park_id, { additional_foodpark_mgr: temp });
                let email = yield sendEmail(this.body.username);
                console.log({ email })
                this.status = 200;
                this.body = { status: 200, data: "Manager created", data: userObject };
                return;
            }
        } catch (error) {
            if (error.code == '23505') {
                this.status = 422;
                this.body = { status: 400, message: 'Entry already exist' };
                return;
            }
            logger.error('Error creating request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = { status: 500, message: 'Error creating the request.', error };
            throw (error);
        }
    } else {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Please send required parameters.' };
        return;
    }
}


exports.deleteManager = function* () {
    try {
        let user = (yield User.getSingleUser(this.body.user_id))[0];
        if (!user) {
            this.status = 404;
            this.body = { status: 404, message: "User not found!" };
            return;
        }
        if (this.body.unit_id) {
            let unit = yield Unit.updateUnitmgr(this.body.unit_id, { unit_mgr_id: null });
            let deleteUser = yield User.deleteUser(this.body.user_id);
            if (deleteUser) {
                this.body = { status: 200, message: "Manager deleted" };
                return;
            }
        } else {
            let food = (yield Unit.getFoodPark(this.body.food_park_id))[0];
            let temp = food.additional_foodpark_mgr;
            let val = temp.filter(x => x != this.body.user_id);
            let food_park = yield Unit.updateFoodParkMgr(this.body.food_park_id, { additional_foodpark_mgr: val });
            let deleteUser = yield User.deleteUser(this.body.user_id);
            if (deleteUser) {
                this.body = { status: 200, message: "Manager deleted" };
                return;
            }
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Error creating the request.', error };
        throw (error);
    }
}

// exports.updateManager = function* () {
//     try {
//         let user = (yield User.getSingleUser(this.body.user_id))[0];
//         if (!user) {
//             this.status = 404;
//             this.body = { status: 404, message: "User not found!" };
//             return;
//         }
//         if (this.body.unit_id) {
//             let unit = yield Unit.updateUnitmgr(this.body.unit_id, { unit_mgr_id: user.id });
//             let body = {
//                 username: this.body.username ? this.body.username : user.username,
//                 first_name: this.body.first_name ? this.body.first_name : user.first_name , 
//                 last_name: this.body.last_name ? this.body.last_name : user.last_name , 

//             }
//             let deleteUser = yield User.deleteUser(this.body.user_id);
//             if (deleteUser) {
//                 this.body = { status: 200, message: "Manager deleted" };
//                 return;
//             }
//         } else {
//             let food = (yield Unit.getFoodPark(this.body.food_park_id))[0];
//             let temp = food.additional_foodpark_mgr;
//             let val = temp.filter(x => x != this.body.user_id);
//             let food_park = yield Unit.updateFoodParkMgr(this.body.food_park_id, { additional_foodpark_mgr: val });
//             let deleteUser = yield User.deleteUser(this.body.user_id);
//             if (deleteUser) {
//                 this.body = { status: 200, message: "Manager deleted" };
//                 return;
//             }
//         }
//     } catch (error) {
//         this.status = 400; // Internal Server Error - Operation Failed
//         this.body = { status: 400, message: 'Error creating the request.', error };
//         throw (error);
//     }
// }


sendEmail = function (email) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: 'tls',
            auth: {
                user: 'info@instamarkt.co',
                pass: 'GroovyShoes56!!'
            }
        });
        var mailOptions = {
            from: 'info@instamarkt.co',
            to: email,
            subject: 'Manager for Instamarkt.co',
            html: `<!DOCTYPE> <html>
            <body>
            <p>
            "Owner First Name" (Nicole) from "Pho House" would like for you to set up a user account as a "Hub Master" (or "Hub Manager").  Please choose a username that relates to this role (<vendor name>hub1, <vendor name>mgr1, etc.).
            </p>
            </body>
            </html>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error)
            }
            resolve(info)
        });
    })
};

exports.listUnits = function* () {
    try {
        let units = yield Unit.listUnits();
        this.body = { status: 200, message: "Units fetched", data: units };
        return;
    } catch (error) {
        this.status = 400;
        this.body = { status: 400, message: "Something went wrong", error };
        return;
    }
}