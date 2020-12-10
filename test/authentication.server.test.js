process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');
var utils = require('./utils');


chai.use(chaiHttp);


// TEST COMPANY CREATION FUNCTIONS

var tests = "- Authentication Tests - ";

// UNAUTHENTICATED ROUTES
// Test create of company
var ts = Date.now();
var userId = '123';
var companyId = '';
var defaultCat = ''; 
var dailySpecialCat = '';
var deliveryChargeCat = '';
var deliveryChargeItem = '';
var authName = 'auth.test'+ ts;
var companyName = 'Auth Test Co '+ ts;
var countryId = 1;

describe(tests +' POST /auth/register', function() {
  it('should register company and return JWT token', function(done) {
    chai.request(server)
    .post('/auth/register')
    .send( {
        "first_name": "Arthur",
        "last_name": "Test",
        "company_name": companyName,
        "email": authName+"@gmail.com",
        "password": authName,
        "role": "OWNER",
        "country_id" : countryId
    })
    .end(function (err, res) {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object')
      res.body.should.have.property('token');
      res.body.should.have.property('user');
      res.body.user.should.have.property('id');

      userId = res.body.user.id;

      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(authName+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      res.body.user.should.have.property('company_id');

      companyId = res.body.user.company_id;

      done();
    });
  });
  it('should read Auth Testing company', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/' + companyId)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal(companyName);
      res.body.should.have.property('country_id');
      res.body.country_id.should.equal(countryId);
      res.body.should.have.property('default_cat');
      res.body.should.have.property('daily_special_cat_id');
      res.body.should.have.property('delivery_chg_cat_id');
      res.body.should.have.property('delivery_chg_item_id');

      defaultCat = res.body.default_cat;
      dailySpecialCat = res.body.daily_special_cat_id;
      deliveryChargeCat = res.body.delivery_chg_cat_id;
      deliveryChargeItem = res.body.delivery_chg_item_id;
      console.log('Default cat: '+ defaultCat);
      done();
    });
  });
  it('should read "Default Category" ', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/' + companyId +'/categories/'+ defaultCat)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal(companyName + ' Menu');
        done();
    });
  });
  it('should read "Daily Special Category" ', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/' + companyId +'/categories/'+ dailySpecialCat)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Daily Specials');
      done();
    });
  });
  it('should read "Delivery Charge Category" ', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/' + companyId +'/categories/'+ deliveryChargeCat)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Delivery Charge Category');
      done();
    });
  });
  it('should read "Delivery Charge Item" ', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/' + companyId +'/menuitems/'+ deliveryChargeItem)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Delivery Charge');
      done();
    });
  });
});


var token = '';


// Clean up
describe(tests +' Clean up SFEZ/Moltin company, SFEZ user, Moltin category and product for delivery charge', function() {
  it('should login and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .send({
        "username": authName+"@gmail.com",
        "password": authName
    })
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      res.body.should.have.property('token');
      token = res.body.token;

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(authName+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      done();
    });
  });
  it('should delete "Delivery Charge" item from company', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/' + companyId +'/menuitems/'+ deliveryChargeItem)
    .set('Authorization', token)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('status')
        res.body.status.should.equal('ok')
        res.body.should.have.property('message')
        res.body.message.should.equal('Deleted successfully');
        done();
        });
    });
  it('should delete "Delivery Charge Category" category from company', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/' + companyId +'/categories/'+ deliveryChargeCat)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal('ok')
      res.body.should.have.property('message')
      res.body.message.should.equal('Deleted successfully');
      done();
    });
  });
  it('should delete Auth Testing company', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/' + companyId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal('ok')
      res.body.should.have.property('message')
      res.body.message.should.equal('Deleted successfully');
      done();
    });
  });
  it('should delete user', function(done) {
    chai.request(server)
      .post('/auth/login')
      .send({
          'username' : utils.adminCredentials.username,
          'password' : utils.adminCredentials.password
      })
      .end(function (err, res) {
          token = res.body.token;

          chai.request(server)
          .delete('/api/v1/rel/users/' + userId)
          .set('Authorization', token)
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.is_deleted.should.equal(true);
            done();
          });
      });


  });
});
  

