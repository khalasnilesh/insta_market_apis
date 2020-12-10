process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);


var tests = "- Specials Tests - ";

var ts = Date.now();
var ownertoken = '';
var coId = 1006;
var username = 'Mo@totino.com';
var pword = 'mo';
var userId = 11020;
var dailySpecialCatId =  "1463320397347816156";

var specTitle = 'Cheeses Pizza'+ ts;
var specDescription = 'All the cheeses on a toasted pizza roll';
var specPrice = 3.95;
var specItemId = '';

describe(tests +' Create a daily special and make it active', function() {
  it('should login Customer and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .send({
        "username": username, 
        "password": pword
    })
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      res.body.should.have.property('token');
      ownertoken = res.body.token;

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(username);
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      done();
    });
  });
  it('should create a new daily special', function(done) {
    chai.request(server)
    .post('/api/v1/mol/companies/'+ coId +'/categories/'+ dailySpecialCatId+'/menuitems')
    .set('Authorization', ownertoken)
    .field('title', specTitle)
    .field('description', specDescription)
    .field('price', specPrice)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      // Save the newly created item id
      specItemId = res.body.id
      console.log('daily special '+ specItemId);

      res.body.should.have.property('title');
      res.body.title.should.equal(specTitle);
      res.body.should.have.property('description');
      res.body.description.should.equal(specDescription);
      res.body.should.have.property('price');
      res.body.price.data.raw.without_tax.should.equal(specPrice);
      done();
    });
  });
  it('should get the daily special', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ coId +'/menuitems/'+ specItemId)
    .set('Authorization', ownertoken)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(specItemId);
      res.body.should.have.property('title');
      res.body.title.should.equal(specTitle);
      res.body.should.have.property('description');
      res.body.description.should.equal(specDescription);
      res.body.should.have.property('price');
      res.body.price.data.raw.without_tax.should.equal(specPrice);
      done();
    });
  });
  it('should set the new daily special as active', function(done) {
    chai.request(server)
    .put('/api/v1/rel/companies/'+ coId)
    .set('Authorization', ownertoken)
    .send({ 'daily_special_item_id' : specItemId })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(coId);
      res.body.should.have.property('daily_special_cat_id');
      res.body.daily_special_cat_id.should.equal(dailySpecialCatId);
      res.body.should.have.property('daily_special_item_id');
      res.body.daily_special_item_id.should.equal(specItemId);
      done();
    });
  });
}); 


// Unit check-in
var unitId = 2003;
var checkIn  = '2017-01-19T05:30:22.408Z';
var checkOut = '2020-05-19T05:30:22.408Z';
var lat = -5.8802;
var lon = -35.1877;

var checkinId = '';

describe(tests +' Check in in a unit', function() {
  it('should check in', function(done) {
    chai.request(server)
    .put('/api/v1/rel/checkins')
    .send({
        "company_id": coId, 
        "unit_id": unitId,
        "latitude": lat, 
        "longitude": lon,
        "check_in": checkIn,
        "check_out": checkOut,
        "display_address": "located at "+ts
    })
    .end(function (err, res) {
      console.log(res.body)
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');

      checkinId = res.body.id;

      res.body.should.have.property('company_id');
      res.body.company_id.should.equal(coId);
      res.body.should.have.property('unit_id');
      res.body.unit_id.should.equal(unitId); 
      res.body.should.have.property('check_in');
      res.body.check_in.should.equal(checkIn);
      res.body.should.have.property('check_out');
      res.body.check_out.should.equal(checkOut);
      done();
    });
  });
});

// Customer search 
var customertoken = '';
var custuser = 'mp10';
var custpword = 'mp10';

var dist = 10;

describe(tests +' Show daily specials within a specific lat/long and distance', function() {
  it('should show nearby daily specials', function(done) {
    chai.request(server)
    .post('/api/v1/dly/specials')
    .send({
        "latitude": lat, 
        "longitude": lon,
        "distance": dist
    })
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array')
      console.log(res.body[0].units);
      done();
    });
  });
});

// Unit check out

describe(tests +' Check out a unit', function() {
  it('should check out', function(done) {
    chai.request(server)
    .put('/api/v1/rel/checkins/'+ checkinId)
    .send({
        "check_out": checkIn
    })
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('company_id');
      res.body.company_id.should.equal(coId);
      res.body.should.have.property('unit_id');
      res.body.unit_id.should.equal(unitId);
      res.body.should.have.property('check_out');
      res.body.check_out.should.equal(checkIn);
      done();
    });
  });
});

// Cleanup
describe(tests +' Delete the daily  special', function() {
  it('should unset company daily special item', function(done) {
    chai.request(server)
    .put('/api/v1/rel/companies/'+ coId)
    .set('Authorization', ownertoken)
    .send({ 'daily_special_item_id' : '' })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(coId);
      res.body.should.have.property('daily_special_cat_id');
      res.body.daily_special_cat_id.should.equal(dailySpecialCatId);
      res.body.should.have.property('daily_special_item_id');
      res.body.daily_special_item_id.should.equal('');
      done();
    });
  });
  it('should delete the daily special', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ coId +'/menuitems/'+ specItemId)
    .set('Authorization', ownertoken)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status');
      res.body.status.should.equal(true);
      done();
    });
  });
}); 
