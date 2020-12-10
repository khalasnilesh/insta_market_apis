var knex  = require('../../config/knex');

const SQUARE_UNIT_COLLECTION = "square_unit";

const UNIT_ID_FIELD = "unit_id";

exports.createSquareUnitRelationship = function(userId, locationId) {
    return knex(SQUARE_UNIT_COLLECTION).insert(
        {
            unit_id : userId,
            location_id: locationId
        }).returning("*");
};

exports.getByUnit = function (unitId) {
    return knex(SQUARE_UNIT_COLLECTION).select().where(UNIT_ID_FIELD, unitId).first();
};

exports.getAccessTokenByLocation = function (locationId) {
    return knex.raw("select square_user.* from square_user " +
                    "left join companies on companies.user_id=square_user.user_id " +
                    "left join units on units.company_id = companies.id " +
                    "left join square_unit on units.id = square_unit.unit_id where location_id='" + locationId + "';");
};
