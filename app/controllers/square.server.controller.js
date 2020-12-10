/**
 * @author Sávio Muniz
 */

var debug = require('debug')('square');
var User = require('../models/user.server.model');
var Unit = require('../models/unit.server.model');
var SquareUser = require('../models/squareuser.server.model');
var SquareUnit = require('../models/squareunit.server.model');
var config = require('../../config/config');
var request = require('requestretry');
var timeUtils = require('../utils/timeutils');
var logger = require('winston');

const RENEWAL_TOLERANCE_IN_DAYS = 14; //number of days till expiration date that will make the api renew the code

/**
 * Registers access token data to an SFEZ user.
 * @param userId
 * @param accessToken
 * @param merchantId
 * @param expiresAt
 * @returns {string}
 */
function * registerAccessToken(userId, accessToken, merchantId, expiresAt) {
    try {
        var squareUserRelationship = yield SquareUser.createSquareUserRelationship(userId, accessToken, merchantId, expiresAt);

        debug('..Square-User relationship');
        debug(squareUserRelationship);

        this.body = squareUserRelationship;
    } catch (err) {
        logger.error('Error creating Square-User relationship');
        throw (err);
    }
}

/**
 * Accesses SquareUp API to get a valid access token using authorization code provided.
 * @param authorizationCode
 * @returns {Promise}
 */
function buildAccessToken(authorizationCode) {
    debug('oAuthSquare');
    return new Promise( function (resolve, reject) {
        request.post({
            url: config.squareAuthUrl,
            form: {
                'client_id': config.square.clientId,
                'client_secret': config.square.clientSecret,
                'code': authorizationCode,
                'redirect_uri': config.square.redirectUrl
            },
            maxAttempts: 3,
            retryDelay: 150 // wait for 150 ms before trying again
        })
        .then(function (res) {
            var data = JSON.parse(res.body);
            resolve(data);
        })
        .catch( function (err) {
            console.error(err);
            reject(err);
        });
    });
}

/**
 * Determines whether or not it's time to renew the user's access token
 * @param expirationDate
 * @returns {boolean}
 */
function isCloseToExpire(expirationDate) {
    var currentDate = new Date(1512086400000);
    return timeUtils.calculateInterval('day', currentDate.getTime(), expirationDate.getTime()) <= RENEWAL_TOLERANCE_IN_DAYS;
}

/**
 * Requests a renew of the SquareUp token at their API
 * @param accessToken
 * @returns {Promise}
 */
function requestRenew(accessToken) {
    debug('renewSquare');
    console.log(accessToken);
    console.log(config.squareRenewUrl);
    return new Promise( function (resolve, reject) {
        request.post({
            url: config.squareRenewUrl,
            headers: {
                'Authorization': 'Client  ' + config.square.clientSecret
            },
            form: {
                'access_token': accessToken
            },
            maxAttempts: 3,
            retryDelay: 150 // wait for 150 ms before trying again
        })
            .then(function (res) {
                var data = JSON.parse(res.body);
                resolve(data);
            })
            .catch( function (err) {
                console.error(err);
                reject(err);
            });
    });
}

/**
 * Requests update of the access token info at DB
 * @param userId
 * @param accessToken
 * @param expirationDate
 * @param merchantId
 * @returns {Promise.<*>}
 */
function * updateAccessTokenInfo(next, userId, accessToken, expirationDate, merchantId) {
    var updatedSquareInfo;
    try {
        updatedSquareInfo = yield SquareUser.updateUserInfo(userId, accessToken, expirationDate, merchantId);
        return updatedSquareInfo;
    } catch (err) {
        logger.error('Error updating Square-User relationship');
        throw (err);
    }
}

/**
 * Handles Square access token renewal workflow
 * @returns {Promise.<void>}
 */
exports.renewToken = function * (next) {
    const userId = this.user.id;
    var squareUserRelPromise = yield SquareUser.getByUser(userId);
    var squareUserRel = squareUserRelPromise[0];

    var shouldRenew = isCloseToExpire(squareUserRel.expires_at);

    if (shouldRenew) {
        logger.info("Renewing token of client " + userId);
        var renewedSquareInfo = yield requestRenew(squareUserRel.access_token);

        if (renewedSquareInfo.access_token) {
            var updatedAcessInfo = yield updateAccessTokenInfo(userId, renewedSquareInfo.access_token, new Date(renewedSquareInfo.expires_at), renewedSquareInfo.merchant_id);
            this.body = updatedAcessInfo[0];
        }

        else
            logger.error('Failed to renew token of client, access token provided is not valid');
    }
};

/**
 * Gets user object at DB from userId provided
 * @param userId
 * @param next
 */
exports.setUser = function *(userId, next){
    var user = undefined;

    if (!userId || userId === "") {
        this.status = 422;
        this.body = { error: 'Provide a valid user id'};
        return;
    }

    try {
        user = (yield User.getSingleUser(userId))[0];
    } catch (err) {
        console.error('register: error during registration');
        console.error(err);
        throw err;
    }

    if (!user) {
        this.status = 422;
        this.body = { error: 'User id provided does not exists'};
        return;
    }

    this.user = user;
    yield next;
};

/**
 * Handles Square access token creation workflow
 * @param res
 * @returns {Promise.<void>}
 */
exports.setupToken = function * (next, res) {
    var authenticationCode = this.body.authentication_code;
    var result = yield buildAccessToken(authenticationCode);

    if (result.access_token) {
         var accessToken = result.access_token;
         var expiresAt = result.expires_at;
         var merchantId = result.merchant_id;

         console.log(accessToken);
         console.log(expiresAt);
         console.log(merchantId);

        logger.info("Getting user square access token");

        yield registerAccessToken(this.user.id, accessToken, merchantId, expiresAt);
    }
};

function getUserSquareInfo(userId) {
    try {
        return SquareUser.getByUser(userId);
    } catch (err) {
        logger.error('Couldnt get square unit');
        throw (err);
    }
}

exports.getToken = function * () {
    var response = yield getUserSquareInfo(this.user.id);

    this.status = 200;
    this.body = response;
};

exports.setUnit = function * (unitId, next) {
    var unit = yield Unit.getSingleUnit(unitId);

    if (!unit || Object.keys(unit).length === 0) {
        this.status = 422;
        this.body = { error : 'Please provide a valid unit id.'}
    }

    this.unit = unit[0];
    yield next;
};

/**
 * Accesses SquareUp API to get a user's locations
 * @param accessToken
 * @returns {Promise}
 */
function getLocations(accessToken) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: config.square.locationsUrl,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            maxAttempts: 3,
            retryDelay: 150 // wait for 150 ms before trying again
        })
        .then(function (res) {
            var data = JSON.parse(res.body);
            resolve(data);
        })
        .catch( function (err) {
            console.error(err);
            reject(err);
        });
    });
}

/**
 * Creates link between SFEZ units and SquareUp locations in DB
 * @param userId
 * @param locationId
 */
function registerUnitLocation (userId, locationId) {
    try {
        return SquareUnit.createSquareUnitRelationship(userId, locationId);
    } catch (err) {
        logger.error('Error creating Square-Unit relationship');
        throw (err);
    }
}

function getSquareUnit (unitId) {
    try {
        return SquareUnit.getByUnit(unitId);
    } catch (err) {
        logger.error('Couldnt get square unit');
        throw (err);
    }
}

/**
 * Gets all user's locations at Square's API
 * @returns {Promise.<void>}
 */
exports.getSquareLocations = function * (ctx, next) {
    var squareUserInfo = yield SquareUser.getByUser(this.user.id);
    var accessToken = squareUserInfo.access_token;

    var response = yield getLocations(accessToken);
    this.status = 200;
    this.body = response;
};

/**
 * Links SquareUp location to units
 * @returns {Promise.<void>}
 */
exports.registerLocation = function * (next) {
    var locationId = this.body.location_id;

    if (isValidLocation(locationId)) {
        var response = yield registerUnitLocation(this.unit.id, locationId);
        this.body = response;
        this.status = 200;
    }
    yield next;
};

function * getSquareOrder(locationId, orderId) {
    var order_ids = [];
    order_ids.push(orderId);
    var form = {
        'order_ids' : order_ids
    };

    var squareInfo = yield SquareUnit.getAccessTokenByLocation(locationId);
    var accessToken = squareInfo.rows[0].access_token;

    return new Promise(function (resolve, reject) {
        request.post({
            url: config.square.orderUrl(locationId),
            json: form,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            maxAttempts: 3,
            retryDelay: 150 // wait for 150 ms before trying again
        })
        .then(function (res) {
            var data = res.body;
            if (data.orders)
              resolve(data.orders[0]); //retrieve only one order
            else
              resolve({});
        })
        .catch( function (err) {
            console.error(err);
            reject(err);
        });
    });
}

exports.getOrder = function * (locationId, orderId, next){
    var response = yield getSquareOrder(locationId, orderId);
    return response;
};

exports.getUnitSquareInfo = function * (unitId, next) {
    var response = yield getSquareUnit(unitId);
    return response;
};

exports.simplifySquareOrderDetails = function (order) {
    var items = order.line_items;
    var parsedOrder = {};
    if (items) {
      items.forEach(function (item) {
        parsedOrder[item.catalog_object_id] = generateSingleItemJSON(item);
      });
      return parsedOrder;
    }
    return {};
};

function generateSingleItemJSON(item) {
    var parsed = {options : []};
    parsed.quantity = item.quantity;
    parsed.title = item.name + (item.variation_name ? (" - " + item.variation_name) : "");
    item.modifiers.forEach(function (modifier) {
        parsed.options.push(modifier.name);
    });
    return parsed;
}

function isValidLocation(locationId) {
    return locationId && locationId !== '';
}
