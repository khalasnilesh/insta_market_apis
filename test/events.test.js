/**
 * @author Sávio Muniz
 * @type {string}
 */
process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');
var utils = require('./utils');
var assert = require('chai').assert;

var MANAGER_ID = 11012;
var GUEST_ID = 11008;

const NEARBY_LOCATION = {
  lat : -7.221888,
  lng : -35.905587
};

const NOT_NEARBY_LOCATION = {
  lat : -7.432380,
  lng : -36.030942
};

var eventId = undefined;

chai.use(chaiHttp);

var chaiServer = chai.request(server);

var testCase = 'Events management - ';

const EVENTS_URL = '/api/v1/rel/events/';

before(function (done) {
  var sqlPromises = [
    {
      table : 'event_guests',
      query : {'guest' : GUEST_ID}
    }
  ];
  console.log('Cleaning data');
  utils.cleanData(sqlPromises, done);
});

after(function (done) {
  var sqlPromises = [
    {
      table : 'event_guests',
      query : {'guest' : GUEST_ID}
    },
    {
      table : 'events',
      query : {'id' : eventId}
    }
  ];
  console.log('Cleaning data');
  utils.cleanData(sqlPromises, done);
});

describe(testCase + 'Event creation', function () {
  it('should create an event', function (done) {
    chaiServer
      .post(EVENTS_URL)
      .send({
        "name": "test event",
        "ticketed": false,
        "start_date": "2017-12-13T03:00:00.000Z",
        "end_date": "2017-12-15T03:00:00.000Z",
        "social_media": {
          "facebook": "event",
          "twitter": "@event",
          "instagram": "@event"
        },
        "latitude": -7.25589,
        "longitude": -35.937,
        "image": "auhdfaishdfiuajaowief",
        "sponsors": [
          {
            "name": "nike",
            "image": ""
          },
          {
            "name": "adidas",
            "image": ""
          }
        ],
        "schedule": [
          {
            "start": "08:00-03:00",
            "end": "10:00-03:00"
          }
        ],
        "manager": MANAGER_ID
      })
      .end(function (err, res) {
        assert.notEqual(res.body.data, undefined, 'could not create event');
        var event = res.body.data[0];
        res.body.message.should.equal('event created');
        event.should.not.equal(undefined);
        eventId = event.id;
        done();
      })
  });
  it('should prevent from creating an event with schedule length different than event duration', function (done) {
    chaiServer
      .post(EVENTS_URL)
      .send({
        "name": "test event",
        "ticketed": false,
        "start_date": "2017-12-13T03:00:00.000Z",
        "end_date": "2017-12-15T03:00:00.000Z",
        "social_media": {
          "facebook": "event",
          "twitter": "@event",
          "instagram": "@event"
        },
        "latitude": 93.9394,
        "longitude": -84.8848,
        "image": "auhdfaishdfiuajaowief",
        "sponsors": [
          {
            "name": "nike",
            "image": ""
          },
          {
            "name": "adidas",
            "image": ""
          }
        ],
        "schedule": [
          {
            "start": "08:00-03:00",
            "end": "10:00-03:00"
          },
          {
            "start": "08:00-03:00",
            "end": "10:00-03:00"
          }
        ],
        "manager": MANAGER_ID
      })
      .end(function (err, res) {
          assert.notEqual(res.body.error, undefined, 'event was created event with wrong schedule');
          res.body.error.should.be.equal('you must provide a schedule with a length of 1 or the interval in days of the event');
          done();
      })
  })
  it('should prevent from creating event with invalid manager', function (done) {
    chaiServer
      .post(EVENTS_URL)
      .send({
        "name": "test event",
        "ticketed": false,
        "start_date": "2017-12-13T03:00:00.000Z",
        "end_date": "2017-12-15T03:00:00.000Z",
        "social_media": {
          "facebook": "event",
          "twitter": "@event",
          "instagram": "@event"
        },
        "latitude": 93.9394,
        "longitude": -84.8848,
        "image": "auhdfaishdfiuajaowief",
        "sponsors": [
          {
            "name": "nike",
            "image": ""
          },
          {
            "name": "adidas",
            "image": ""
          }
        ],
        "schedule": [
          {
            "start": "08:00-03:00",
            "end": "10:00-03:00"
          }
        ],
        "manager": undefined
      })
      .end(function (err, res) {
        assert.notEqual(res.body.error, undefined, 'event was created event with invalid user id');
        done();
      })
  })
});

describe(testCase + 'Guests management', function () {
  it('should add a guest to an event', function (done) {
    chaiServer
      .post(EVENTS_URL + eventId + '/guests')
      .send({
          "user_id" : GUEST_ID
      })
      .end(function (err, res) {
        res.status.should.equal(201);
        res.body.message.should.equal('guest added');
        done();
      });
  });
  it('should retrieve guests', function (done) {
    chaiServer
      .get(EVENTS_URL + eventId + '/guests')
      .end(function (err, res) {
        var guests = res.body;
        guests[0].id.should.equal(GUEST_ID);
        done();
      });
  });
});

describe(testCase + 'Manager info', function () {
  it('should retrieve manager info', function (done) {
    chaiServer
      .get(EVENTS_URL + eventId + '/manager')
      .end(function (err, res) {
        var manager = res.body;
        manager.id.should.equal(MANAGER_ID);
        done();
      });
  });
});

describe(testCase + 'Nearby events', function () {
  it('should retrieve nearby event', function (done) {
    chaiServer
      .get(EVENTS_URL + 'mapsearch?latitude=' + NEARBY_LOCATION.lat + '&longitude=' + NEARBY_LOCATION.lng + '&distance=10')
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.length.should.not.equal(0);
        var len = res.body.length;
        res.body[len-1].id.should.equal(eventId);
        done();
      });
  });
  it('should not retrieve any nearby event', function (done) {
    chaiServer
      .get(EVENTS_URL + 'mapsearch?latitude=' + NOT_NEARBY_LOCATION.lat + '&longitude=' + NOT_NEARBY_LOCATION.lng + '&distance=10')
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.length.should.equal(0);
        done();
      });
  });
});
