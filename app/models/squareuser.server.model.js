/**
 * DB handler for collection 'square_user'. This collection is responsible for storing user authorization data.
 * @author Sávio Muniz
 */
var knex  = require('../../config/knex');
var debug = require('debug')('squareuser.model');

const SQUARE_USER_COLLECTION = "square_user";

const USER_ID_FIELD = "user_id";

exports.createSquareUserRelationship = function(userId, accessToken, merchantId, expiresAt) {
    return knex(SQUARE_USER_COLLECTION).insert(
        {
            user_id : userId,
            access_token: accessToken,
            merchant_id: merchantId,
            expires_at: new Date(expiresAt)
        }).returning('*');
};

exports.getByUser = function (userId) {
    return knex(SQUARE_USER_COLLECTION).select().where(USER_ID_FIELD, userId).first();
};

exports.updateUserInfo = function(userId, accessToken, expirationDate, merchantId) {
    const map = {
        access_token : accessToken,
        expires_at : expirationDate,
        merchant_id : merchantId
    };
    return knex(SQUARE_USER_COLLECTION).update(map).where(USER_ID_FIELD, userId).returning("*");
};
