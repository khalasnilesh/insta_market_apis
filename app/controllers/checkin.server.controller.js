var Checkin = require('../models/checkin.server.model');
var FoodPark = require('../models/foodpark.server.model')
var Unit = require('../models/unit.server.model')
var logger = require('winston');
const fs = require("fs");
const multer = require("multer");
const OAuth2Data = require("../../credentials_gdrive.json");
var name, pic

const { google } = require("googleapis");


const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];
const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
);

// If modifying these scopes, delete token.json.
const SCOPES_DRIVE =
    "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file";
exports.createCheckin = function* (next) {
    if (this.body) {
        var checkin = this.body;
        var unitData = yield Unit.getSingleUnit(parseInt(checkin.unit_id));

        var foodpark = yield FoodPark.getSingleFoodPar(parseInt(checkin.food_park_id));

        unitData[0].food_park_id = parseInt(checkin.food_park_id);
        unitData[0].from_city = foodpark[0].city;
        unitData[0].from_state = foodpark[0].state;
        unitData[0].from_zip = foodpark[0].postal_code;
        unitData[0].from_country = foodpark[0].country;
        unitData[0].from_street = foodpark[0].address;

        try {
            // Updating Checkin table
            let checkins = (yield Checkin.getCheckin(checkin.unit_id))[0];
            if (!checkins) {
                var response = yield Checkin.createCheckin(checkin);
            } else {
                var response = yield Checkin.updateCheckin(checkin, checkin.unit_id);
            }
            let respo = (yield Checkin.getCheckin(checkin.unit_id))[0];
            var unitResponse = yield Unit.updateUnit(checkin.unit_id, unitData[0]);
            this.status = 201;
            this.body = { status: 200, message: "get checking successfully", data: respo };
        } catch (err) {
            logger.error('Error saving request.');
            this.status = 500; // Internal Server Error - Operation Failed
            this.body = { status: 500, message: 'Error saving the request.' };
            throw (err);
        }
        return;
    } else {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Please send required parameters.' };
        return;
    }
}

exports.getcheckins = function* () {
    try {
        let getcheckin = yield Checkin.getCheckin(this.params.unitId);
        if (getcheckin) {
            this.body = { status: 200, message: "Unit checkin", data: getcheckin };
            return;
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}

exports.getauthenticatedbygoogle = function* () {
    try {
        var url = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES_DRIVE,
        });
        console.log(url, "URLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL");
        if (url) {
            this.body = { status: 200, message: "Authenication Success", data: url };
            return;
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}

exports.getcallbackfromgoogle = function* () {
    try {
        const code = this.query.code;
        console.log("codecodecodecodecode", code)
        if (code) {
            // Get an access token based on our OAuth code
            oAuth2Client.getToken(code, function (err, tokens) {
                if (err) {
                    console.log("Error authenticating");
                    console.log(err);
                } else {
                    console.log("Successfully authenticated");
                    console.log(tokens)
                    oAuth2Client.setCredentials(tokens);
                    authed = true;
                    this.redirect("https://admin.instamarkt.co/#/menuitems")
                }
            });
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}

exports.createfolderIndrive = function* () {
    try {
        let folders = this.body.foldername
        for (i = 0; i < folders.length; i++) {
            item = folders[i];
            var fileMetadata = {
                'name': folders[i],
                'mimeType': 'application/vnd.google-apps.folder'
            };
            drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            }, function (err, file) {
                if (err) {
                    // Handle error
                    //   console.error(err);
                    this.body = { status: 400, message: 'Something went wrong.' };

                } else {
                    this.status = 200
                    this.body = { status: 200, message: 'Folder Create in Drive' };

                    console.log('Folder Id: ', file.id);
                    return;

                }
            });
        }

    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}