process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');
var utils = require('./utils');

var FOOD_PARK_ID = 3002;
var UNIT_ID = 2003;

chai.use(chaiHttp);

var chaiServer = chai.request(server);

var testCase = 'Food park management - ';

var token = undefined;
var userId = undefined;
var driver = undefined;

var ts = Date.now();
var fpmname = 'fpm'+ ts;

function getFoodParkUrl() {
    return '/api/v1/rel/food_parks/' + FOOD_PARK_ID + '/'
}

after(function (done) {
  var sqlPromises = [
    {
      table : 'users',
      query : {'id' : userId}
    },
    {
      table : 'food_park_management',
      query : {'unit_id' : UNIT_ID, 'food_park_id' : FOOD_PARK_ID}
    },
    {
      table : 'users',
      query : {'id' : driver.id}
    }
  ];

  utils.cleanData(sqlPromises, done);
});

describe(testCase + 'Food park manager auth/register', function () {
    it('should register a manager and retrieve JWT with FOODPARKMGR permissions', function (done) {
      chaiServer
          .post('/auth/register')
          .send({
              "first_name": "Test",
              "last_name": "FoodParkMgr",
              "email": fpmname + "@fpm.com",
              "password": fpmname,
              "company_name": "FoodParkMgr",
              "country_id": "1",
              "territory_id": "3",
              "food_park_id" : FOOD_PARK_ID,
              "role" : "FOODPARKMGR"
          })
          .end(function (err, res) {
            console.log(err);
            var user = res.body.user;
            user.role.should.equal('FOODPARKMGR');
            userId = user.id;
            done();
          })
    });
    it('should receive a food park id when logged in', function (done) {
      chaiServer
        .post('/auth/login')
        .send({
          "username" : fpmname + "@fpm.com",
          'password': fpmname
        })
        .end(function (err, res) {
          var user = res.body.user;
          var foodPark = user.food_park_id;
          foodPark.should.equal(FOOD_PARK_ID);
          token = res.body.token;
          done();
        });
    });
});

describe(testCase + 'Food park unit management', function () {
  it('should insert unit in food park management', function (done) {
    chaiServer
      .post(getFoodParkUrl() + 'units')
      .send({
        'unit_id' : UNIT_ID
      })
      .set('Authorization', token)
      .end(function (err, res) {
          res.status.should.equal(200);
          done();
      })
  });
  it('should get inserted unit info', function (done) {
    chaiServer
      .get(getFoodParkUrl() + 'units')
      .set('Authorization', token)
      .end(function (err, res) {
        console.log(err);
        var units = res.body;
        units[0].id.should.equal(UNIT_ID);
        done();
      });
  })
});

describe(testCase + 'Food park driver management', function () {
  it('should add a new driver to a food park', function (done) {
    chaiServer
      .post('/auth/register')
      .send({
        "first_name": "Joe",
        "last_name": "Smith",
        "email": "driver@driver.com",
        "password": "123",
        "phone" : "3333-3333",
        "territory_id": "3",
        "country_id": "1",
        "role": "DRIVER"
      })
      .end(function (err, res) {
        driver = res.body.user;
        chaiServer
          .post(getFoodParkUrl() + 'drivers')
          .send({
            "user_id" : driver.id
          })
          .set('Authorization', token)
          .end(function (err, res) {
              res.body.message.should.equal('driver-foodpark relationship created!');
              done();
          })
      })
  });
  it('should get drivers assigned to a food park', function (done) {
    chaiServer
      .get(getFoodParkUrl() + 'drivers')
      .set('Authorization', token)
      .end(function (err, res) {
          var assignedDriver = res.body[0];
          assignedDriver.id.should.equal(driver.id);
          done();
      })
  });
  it('should set availability of a driver', function (done) {
    chaiServer
      .get(getFoodParkUrl() + 'drivers')
      .set('Authorization', token)
      .end(function (err, res) {

        var assignedDriver = res.body[0];
        assignedDriver.available.should.equal(false);

        chaiServer
          .put(getFoodParkUrl() + 'drivers/' + driver.id)
          .send({
            'available' : true
          })
          .set('Authorization', token)
          .end(function (err, res) {
            res.body.message.should.equal('update was successful');

            chaiServer
              .get(getFoodParkUrl() + 'drivers')
              .set('Authorization', token)
              .end(function (err, res) {
                var assignedDriver = res.body[0];
                assignedDriver.available.should.equal(true);
                done();
              })
          })
      })
  })
  it('should delete a driver', function (done) {
    console.log('okokkokokok');
    console.log(driver.id);
    console.log(token);
    chaiServer
      .delete(getFoodParkUrl() + 'drivers/' + driver.id)
      .set('Authorization', token)
      .end(function (err, res) {
        res.body.message.should.equal('deleted successfully');
        chaiServer
          .get(getFoodParkUrl() + 'drivers')
          .set('Authorization', token)
          .end(function (err, res) {
            var assignedDrivers = res.body;
            assignedDrivers.length.should.equal(0);
            done();
          });
      })
  })
});
