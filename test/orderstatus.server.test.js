process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);

var tests = "- Order Status Tests - ";

var custToken = '';

var customer = 'mp10';

var orderId=716;
var unitId=2006;
var customerId=9003;
var apiversion = '/api/v1/rel/ord';

var orderStatusId;

describe(tests +' - Order Status Controller - ', function() {
  it('should login Customer and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .send({
        "username": customer, // no email for Customer mp10
        "password": customer
    }).end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      res.body.should.have.property('token');
      custToken = res.body.token;

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(customer);
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('CUSTOMER');
      done();
    });
  });
  // it('create Order Status', function(done) {
  //   chai.request(server)
  //   .post('/stat/create/')
  //   .set('Authorization', custToken)
  //   .send({
  //       "orderId" : 716,
  //      "stepStatus" : "order_requested",
          // "stepName" : "",
          // "apiCall": "",
          // "paramString" : "",
          // "errorInfo" : "",
          // "callInfo" : ""
  //   })
  //   .end(function(err,res){
  //       res.should.have.status(200);
  //       res.should.be.json;
  //       res.body.should.be.a('object');
  //       res.body.should.have.property('id');
  //       res.body.stepStatus.should.equal('order_requested');
  //       orderStatusId=res.body.id;
  //       done();
  //   });
  // });
  // it('get Order Status', function(done){
  //   chai.request(server)
  //   .get('/stat/'+orderStatusId)
  //   .set('Authorization', custToken)
  //   .send()
  //   .end(function(err,res){
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.should.be.a('object');
  //     res.body.id.should.equal('orderStatusId');
  //     done();
  //   });
  // });
  it('update Order Status', function(done) {
    chai.request(server)
    .post('/stat/update/'+orderStatusId)
    .set('Authorization', custToken)
    .send({
       "stepStatus" : "order_paid"
    })
    .end(function(err,res){
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.stepStatus.should.equal('order_paid');
        done();
    });
  });
});
