/**
 * @author Sávio Muniz
 */

var knex = require('../../config/knex');
var debug = require('debug')('events.model');

const EVENT_TABLE = "events";
const EVENT_GUESTS_TABLE = "event_guests";

exports.createEvent = function (event) {
    return knex(EVENT_TABLE).insert(event).returning('*');
};

exports.getSingleEvent = function (id) {
    return knex(EVENT_TABLE).select().where('id', id).first();
};

exports.addGuest = function (guestId, eventId) {
    return knex(EVENT_GUESTS_TABLE).insert({guest : guestId, event : eventId}).returning('*');
};

exports.getGuests = function (eventId) {
    return knex.raw(`select users.* from event_guests eg right join users on eg.guest = users.id where eg.event = ${eventId}`);
};

exports.getSingleGuest = function (guestId) {
    return knex.raw(`select users.* from event_guests eg right join users on eg.guest = users.id where eg.guest = ${guestId}`);
};

exports.getNearbyEvents = function (latitude, longitude, distance) {
    return knex(EVENT_TABLE).select().whereRaw(`calc_earth_dist(cast (events.latitude as numeric), cast(events.longitude as numeric), ${latitude}, ${longitude}) <= ${distance}`);
};
