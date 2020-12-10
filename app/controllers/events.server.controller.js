/**
 * @author Sávio Muniz
 */

var Events = require('../models/events.server.model');
var TimeUtils = require('../utils/timeutils');
var Users = require('../models/user.server.model');

exports.createEvent = function * (next) {
  var event = this.body;

  var startDate = new Date(event.start_date);
  var endDate = new Date(event.end_date);

  var daysInterval = TimeUtils.calculateInterval('day', startDate.getTime(), endDate.getTime()) + 1;

  if (!isValidSchedule(event.schedule, daysInterval)) {
    this.status = 415;
    this.body = {status:400,message : 'you must provide a schedule with a length of 1 or the interval in days of the event'};
    return;
  }

  var response = yield registerEvent(this.body);
  this.status = 201;
  this.body = {status:200,message : 'event created', data : response};
  return;
};

exports.getManager = function * (next) {
  var event = yield getEvent(this.params.eventId);

  if (!event) {
    this.status = 404;
    this.body = {status:400,message : 'Invalid event id'};
    return;
  }

  var managerId = event.manager;

  this.status = 200;
  this.body = (yield Users.getSingleUser(managerId))[0]
};

exports.addGuest = function * (next) {
  var event = yield getEvent(this.params.eventId);

  if (!event) {
    this.status = 404;
    this.body = {status:400,message: 'Invalid event id'};
    return;
  }

  var userId = this.body.user_id;

  if (!userId) {
    this.status = 415;
    this.body = {status:400,message: 'You should provide a user_id field'};
    return;
  }

  var user = (yield Users.getSingleUser(userId))[0];

  if (!user) {
    this.status = 404;
    this.body = {error: 'Invalid user id'};
    return;
  }

  var guests = yield getSingleGuest(user.id);

  if (guests.rows[0]) {
    this.status = 400;
    this.body = {error: 'The user is already a guest'};
    return;
  }

  yield addGuest(user.id, event.id);
  this.status = 201;
  this.body = {message : 'guest added'};
};

exports.getGuests = function *(next) {
  var event = yield getEvent(this.params.eventId);

  if (!event) {
    this.status = 404;
    this.body = {status:400,message: 'Invalid event id'};
    return;
  }

  var guests = yield getGuests(event.id);
  this.status = 200;
  this.body = guests.rows;
};

exports.getNearby = function * (next) {
  var latitude = this.query.latitude;
  var longitude = this.query.longitude;
  var range = this.query.distance;

  if (!latitude || !longitude || !range) {
    this.status = 415;
    this.body = {status:400,message: 'You must provide a latitude, longitude and distance'};
    return;
  }

  var events = yield getNearbyEvents(latitude, longitude, range);
  this.status = 200;
  this.body = events;
  return;
};

function isValidSchedule(schedule, interval) {
  return schedule.length === 1 || schedule.length === interval;
}

function getSingleGuest(guest) {
  try {
    return Events.getSingleGuest(guest);
  } catch (err) {
    logger.error('Error while retrieving single guest');
    debug('Error while retrieving single guest');
    throw (err);
  }
}

function getNearbyEvents(latitude, longitude, range) {
  try {
    return Events.getNearbyEvents(latitude,longitude,range);
  } catch (err) {
    logger.error('Error while retrieving nerby events');
    debug('Error while retrieving nerby events');
    throw (err);
  }
}

function getGuests(event) {
  try {
    return Events.getGuests(event);
  } catch (err) {
    logger.error('Error while retrieving guests');
    debug('Error while retrieving guests');
    throw (err);
  }
}

function addGuest(guestId, eventId) {
  try {
    return Events.addGuest(guestId, eventId);
  } catch(err) {
    logger.error('Error while adding guest');
    debug('Error while adding guest ');
    throw (err);
  }
}

function getEvent(id) {
  try {
    return Events.getSingleEvent(id);
  }
  catch (err) {
    logger.error('Error while retrieving event');
    debug('Error while retrieving event');
    throw (err);
  }
}

function registerEvent(event) {
  try {
      return Events.createEvent(event);
  } catch (err) {
      logger.error('Error creating event');
      debug('Error creating event');
      throw (err);
  }
}
