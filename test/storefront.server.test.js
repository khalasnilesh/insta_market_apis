process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);


// TEST MOLTIN INTEGRATIONS

var tests = "- Storefront Tests - ";

// UNAUTHENTICATED ROUTES

// Create company
var ts = Date.now();
var userId = '123';
var companyId = '';
var ecommerceId = '';
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
});


// Test SFEZ Postgres has specfic company
describe(tests +' GET /api/v1/mol/companies/{companyId}', function() {
  it('should return test company '+ companyId +' from SFEZ db', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId)
    .end(function(err, res) {
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('id');
    res.body.id.should.equal(companyId);
    res.body.should.have.property('name');
    res.body.name.should.equal(companyName);
    res.body.should.have.property('order_sys_id');
    res.body.should.have.property('default_cat');

    ecommerceId = res.body.order_sys_id;
    defaultCat = res.body.default_cat;
    dailySpecialCat = res.body.daily_special_cat_id;
    deliveryChargeCat = res.body.delivery_chg_cat_id;
    deliveryChargeItem = res.body.delivery_chg_cat_item_id;

    done();
    });
  });
});

// Test retrieval of Moltin categories
describe(tests +' GET /api/v1/mol/companies/{companyId}/categories', function() {
  it('should return menu categories from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/categories')
    .end(function(err, res) {
        res.body.should.be.a('array');
        res.body.length.should.equal(2);
        for (var i = 0; i < res.body.length; i++) {
            res.body[i].should.have.property('type');
            res.body[i].type.should.equal('category');
            res.body[i].should.have.property('company');
            res.body[i].company.should.equal(ecommerceId);
        }
        done();
    });
  });
});



// Test retrieval of one Moltin category
describe(tests +' GET /api/v1/mol/companies/{companyId}/categories/{deliveryChargeCat}', function() {
  it('should return Delivery Charge category for '+ companyId +' from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId + '/categories/'+ deliveryChargeCat)
    .end(function(err, res) {
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('name');
    res.body.name.should.equal('Delivery Charge Category');
    done();
    });
  });
});

/*
// Test retrieval of menu items for Company and Category
describe(tests +' GET /api/v1/mol/companies/{companyId}/categories/{deliveryChargeCat}/menuitems', function() {
  it('should return menu items for Delivery Charge category from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId + '/categories/'+ deliveryChargeCat +'/menuitems')
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('slug');
        res.body[0].should.have.property('name');
        res.body[0].name.should.equal('Delivery Charge');
        done();
    });
  });
});

// Test retrieval of a specific menu item for Company and Category
describe(tests +' GET /api/v1/mol/companies/{companyId}/menuitems/{deliveryChargeItem}', function() {
  it('should return Delivery Charge menu item from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId + '/menuitems/'+ deliveryChargeItem)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('slug');
      res.body.should.have.property('title');
      res.body.title.should.equal('Delivery Charge');
      done();
    });
  });
});
*/
/*
// Test retrieval of option categories for specific menu item for Company and Category
describe(tests +' GET /api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories', function() {
  it('should return option categories for BBQ Loaf for Grilla Cheez - Dinner category from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });
});

// Test retrieval of a specific option category for specific menu item for Company and Category
describe(tests +' GET /api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories/1506186173423288515', function() {
  it('should return "OptionItems" option category for BBQ Loaf for Grilla Cheez - Dinner category from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories/1506186173423288515')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('OptionItems');
      res.body.should.have.property('type');
      res.body.type.value.should.equal('Single');
      done();
    });
  });
});

// Test retrieval of option items for an option category for specific menu item for Company and Category
describe(tests +' GET /api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories/1506186173423288515/optionitems', function() {
  it('should return option items for the "Option Items" option category for BBQ Loaf for Grilla Cheez - Dinner category from Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/1008/menuitems/1441751723700912337/optioncategories/1506186173423288515/optionitems')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      res.body[0].should.have.property('title');
      res.body[0].title.should.equal('French Fries');
      res.body[0].should.have.property('mod_price');
      res.body[0].mod_price.should.equal('+5.00');

      res.body[1].should.have.property('title');
      res.body[1].title.should.equal('Cole Slaw');
      res.body[1].should.have.property('mod_price');
      res.body[1].mod_price.should.equal('+2');

      done();
    });
  });
});
*/

// AUTHENTICATED ROUTES

var token  = ''
var mochaId = ''
// Test CRUD of a Category for a specific Company
describe(tests +' CRUD /api/v1/mol/companies/{companyId}/categories', function() {
  it('should login and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .field("username", authName+ "@gmail.com")
    .field("password", authName)
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      token = res.body.token

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.id.should.equal(userId);
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(authName+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      res.body.should.have.property('token');
      done();
    });
  });
  it('should create category "Mocha" in Moltin', function(done) {
    chai.request(server)
    .post('/api/v1/mol/companies/'+ companyId +'/categories')
    .set('Authorization', token)
    .field('title','Mocha')
    .field('parent', defaultCat)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        // Save the newly created category id
        mochaId = res.body.id

        res.body.should.have.property('name');
        res.body.name.should.equal('Mocha');
        res.body.should.have.property('relationships');
        res.body.relationships.should.have.property('parent');
        res.body.relationships.parent.should.have.property('data');
        res.body.relationships.parent.data.should.be.a('array');
        res.body.relationships.parent.data[0].should.have.property('type');
        res.body.relationships.parent.data[0].type.should.equal('category');
        res.body.relationships.parent.data[0].should.have.property('id');
        res.body.relationships.parent.data[0].id.should.equal(defaultCat);
        done();
    });
  });
  it('should read "Mocha" category in Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/categories/'+ mochaId)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('Mocha');
        res.body.should.have.property('company');
        res.body.company.should.equal(ecommerceId);
        res.body.should.have.property('relationships');
        res.body.relationships.should.have.property('parent');
        res.body.relationships.parent.should.have.property('data');
        res.body.relationships.parent.data.should.be.a('array');
        res.body.relationships.parent.data[0].should.have.property('type');
        res.body.relationships.parent.data[0].type.should.equal('category');
        res.body.relationships.parent.data[0].should.have.property('id');
        res.body.relationships.parent.data[0].id.should.equal(defaultCat);
        done();
    });
  });
  it('should update "Mocha" to "Mocha-Mocha" category in Moltin', function(done) {
    chai.request(server)
    .put('/api/v1/mol/companies/'+ companyId +'/categories/'+ mochaId)
    .set('Authorization', token)
    .field('title','Mocha-Mocha')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Mocha-Mocha');
      res.body.should.have.property('company');
      res.body.company.should.equal(ecommerceId);
      res.body.should.have.property('relationships');
      res.body.relationships.should.have.property('parent');
      res.body.relationships.parent.should.have.property('data');
      res.body.relationships.parent.data.should.be.a('array');
      res.body.relationships.parent.data[0].should.have.property('type');
      res.body.relationships.parent.data[0].type.should.equal('category');
      res.body.relationships.parent.data[0].should.have.property('id');
      res.body.relationships.parent.data[0].id.should.equal(defaultCat);
      done();
    });
  });
  it('should read all categories in Moltin', function(done) {
  chai.request(server)
  .get('/api/v1/mol/companies/'+ companyId +'/categories')
  .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      res.body.length.should.equal(3);
      for (var i = 0; i < res.body.length; i++) {
          res.body[i].should.have.property('type');
          res.body[i].type.should.equal('category');
          res.body[i].should.have.property('company');
          res.body[i].company.should.equal(ecommerceId);
      }
      done();
  });
});
  it('should delete "Mocha-Mocha" category in Moltin', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ companyId +'/categories/'+ mochaId)
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
    it('should read remaining categories in Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/categories')
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.length.should.equal(2);
        for (var i = 0; i < res.body.length; i++) {
            res.body[i].should.have.property('type');
            res.body[i].type.should.equal('category');
            res.body[i].should.have.property('company');
            res.body[i].company.should.equal(ecommerceId);
        }
        done();
    });
  });
});

token = ''
mochaId = ''

// Test CRUD of a Daily Special Menu Item for a specific Company
describe(tests +' CRUD /api/v1/mol/companies/{companyid}/categories/{categoryid}/menuitems', function() {
  it('should login and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .field("username", authName+ "@gmail.com")
    .field("password", authName)
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      token = res.body.token

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.id.should.equal(userId);
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(authName+ '@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      res.body.should.have.property('token');
      done();
    });
  });
  it('should create menu item "Mocha Sandwich" for the Daily Specials category in Moltin', function(done) {
      var prices = [ 
          { "amount": 525, "currency": "USD", "includes_tax": true},
          { "amount": 495, "currency": "BRL", "includes_tax": true} 
        ];
    chai.request(server)
    .post('/api/v1/mol/companies/'+ companyId +'/categories/'+ dailySpecialCat +'/menuitems')
    .set('Authorization', token)
    .send({
        'title' : 'Mocha Sandwich',
        'price': prices,
        'description': 'Spicy chocolate mousse and bitter chocolate shavings fill a flash-fried tortilla'
    })
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        // Save the newly created id
        mochaId = res.body.id
        res.body.should.have.property('name');
        res.body.name.should.equal('Mocha Sandwich');
        res.body.should.have.property('status');
        res.body.status.should.equal('live');
        res.body.should.have.property('manage_stock');
        res.body.manage_stock.should.equal(false);
        res.body.should.have.property('description');
        res.body.description.should.equal('Spicy chocolate mousse and bitter chocolate shavings fill a flash-fried tortilla');
        res.body.should.have.property('relationships');
        res.body.relationships.should.have.property('categories');
        res.body.relationships.categories.data[0].should.have.property('type');
        res.body.relationships.categories.data[0].type.should.equal('category');
        res.body.relationships.categories.data[0].should.have.property('id');
        res.body.relationships.categories.data[0].id.should.equal(dailySpecialCat);

        res.body.should.have.property('price');
        res.body.price[0].amount.should.equal(5.25);
        res.body.price[0].currency.should.equal('USD');
        res.body.price[0].includes_tax.should.equal(true);
        done();
    });
  });
  it('should read "Mocha Sandwich" menu item in Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');

      res.body[0].should.have.property('name');
      res.body[0].name.should.equal('Mocha Sandwich');
      res.body[0].should.have.property('status');
      res.body[0].status.should.equal('live');
      res.body[0].should.have.property('manage_stock');
      res.body[0].manage_stock.should.equal(false);
      res.body[0].should.have.property('description');
      res.body[0].description.should.equal('Spicy chocolate mousse and bitter chocolate shavings fill a flash-fried tortilla');
      res.body[0].should.have.property('relationships');
      res.body[0].relationships.should.have.property('categories');
      res.body[0].relationships.categories.data[0].should.have.property('type');
      res.body[0].relationships.categories.data[0].type.should.equal('category');
      res.body[0].relationships.categories.data[0].should.have.property('id');
      res.body[0].relationships.categories.data[0].id.should.equal(dailySpecialCat);

      res.body[0].should.have.property('price');
      res.body[0].price[0].amount.should.equal(5.25);
      res.body[0].price[0].currency.should.equal('USD');
      res.body[0].price[0].includes_tax.should.equal(true);
      done();
    });
  });
  it('should update "Mocha Sandwich" to "Mocha Avalanche Sandwich" item title & price in Moltin', function(done) {
    chai.request(server)
    .put('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId)
    .set('Authorization', token)
    .send ( {
        'title': 'Mocha Avalanche Sandwich',
        'price': 695
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      console.log(res.body)
      res.body.should.be.a('array');
      console.log(res.body[0][0]);
      res.body[0][0].should.have.property('name');
      res.body[0][0].name.should.equal('Mocha Avalanche Sandwich');
      res.body[0][0].should.have.property('description');
      res.body[0][0].description.should.equal('Spicy chocolate mousse and bitter chocolate shavings fill a flash-fried tortilla');
      res.body[0][0].should.have.property('price');
      console.log(res.body[0][0].price);
      res.body[0][0].price[0].amount.should.equal(695);
      res.body[0][0].should.have.property('status');
      res.body[0][0].status.should.equal('live');
      res.body[0][0].relationships.should.have.property('categories');
      res.body[0][0].relationships.categories.data[0].should.have.property('type');
      res.body[0][0].relationships.categories.data[0].type.should.equal('category');
      res.body[0][0].relationships.categories.data[0].should.have.property('id');
      res.body[0][0].relationships.categories.data[0].id.should.equal(dailySpecialCat);
      done();
    });
  });
  it('should delete '+mochaId+': "Mocha Avalanche Sandwich" menu item in Moltin', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      console.log(res.body)
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal('ok')
      res.body.should.have.property('message')
      res.body.message.should.equal('Deleted successfully');
      done();
    });
  });
});

token = ''
var ocId = ''

// Test CRU of an Option Category for a specific Company/Menu Item
describe(tests +' CRU /api/v1/mol/companies/{companyid}/menuitems/{menuitemid}/optioncategories', function() {
  it('should login and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .field("username", "grilla@grillacheez.com")
    .field("password", "grilla")
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')
      // Save the JWT token
      token = res.body.token

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.id.should.equal(11025);
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal('Grilla@grillacheez.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('OWNER');
      res.body.should.have.property('token');
      done();
    });
  });
  it('should create option category "Pickles" in Moltin', function(done) {
    chai.request(server)
    .post('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories')
    .set('Authorization', token)
    .field('title','Pickles')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      // Save the newly created id
      ocId = res.body.id
      res.body.should.have.property('title');
      res.body.title.should.equal('Pickles');

      res.body.should.have.property('type');
      res.body.type.value.should.equal('Variant');
      done();
    });
  });
  it('should read "Pickles" option category in Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('Pickles');

      res.body.should.have.property('type');
      res.body.type.value.should.equal('Variant');
      done();
    });
  });
  it('should update "Pickles" option category to "PicklePickle" title in Moltin', function(done) {
    chai.request(server)
    .put('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId)
    .set('Authorization', token)
    .field('title','PicklePickle')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('PicklePickle');

      res.body.should.have.property('type');
      res.body.type.value.should.equal('Variant');
      done();
    });
  });
});


var oiId = '';

// Test CRU of an Option Item for an Option Category for a specific Company/Menu Item
describe(tests +' CRU /api/v1/mol/companies/{companyid}/menuitems/{menuitemid}/optioncategories/{optcatId}/optionitems', function() {
  it('should create option item "Spelt" for option category '+ ocId +' of the BBQ Loaf for Grilla Cheez in Moltin', function(done) {
    chai.request(server)
    .post('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems')
    .set('Authorization', token)
    .field('title','Spelt')
    .field('mod_price','+0.00')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      // Save the newly created id
      oiId = res.body.id
      res.body.should.have.property('title');
      res.body.title.should.equal('Spelt');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
  it('should read "Spelt" option item for the '+ ocId +' option category of the  BBQ Loaf for Grilla Cheez in Moltin', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ oiId)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('Spelt');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
  it('should update "Spelt" option item title to "Amaranth" ', function(done) {
    chai.request(server)
    .put('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ oiId)
    .set('Authorization', token)
    .field('title','Amaranth')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('Amaranth');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
});


var multiOiId = '';

// Test CRU of multi-select Option Items for a specific Company/Menu Item
describe(tests +' CRU /api/v1/mol/companies/{companyid}/menuitems/{optCatId}/optionitems', function() {
  it('should create option item "Iced" for the BBQ Loaf menu item in the Dinner category in Moltin', function(done) {
    chai.request(server)
    .post('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optionitems')
    .set('Authorization', token)
    .field('title','Iced')
    .field('mod_price','+0.00')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      // Save the newly created id
      multOiId = res.body.id
      res.body.should.have.property('title');
      res.body.title.should.equal('Iced');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
  it('should read "Iced" option item for the BBQ Loaf menu item', function(done) {
    chai.request(server)
    .get('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ multOiId)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('Iced');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
  it('should update "Iced" option item title to "Blended" ', function(done) {
    chai.request(server)
    .put('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ multOiId)
    .set('Authorization', token)
    .field('title','Blended')
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('title');
      res.body.title.should.equal('Blended');

      res.body.should.have.property('mod_price');
      res.body.mod_price.should.equal('+0.00');
      done();
    });
  });
});




// Test Delete of option category, option item, and multi-select Option Items for a specific Company/Menu Item
describe(tests +' Delete /api/v1/mol/companies/{companyid}/menuitems/{menutItemId}/optioncategories/{optCatId}/optionitems', function() {
  it('should delete '+oiId+': "Amaranth" option item ', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ oiId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal(true)
      res.body.should.have.property('message')
      res.body.message.should.equal('Variation removed successfully');
      done();
    });
  });
  it('should delete the "Blended" option item ', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId +'/optionitems/'+ multOiId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal(true)
      res.body.should.have.property('message')
      res.body.message.should.equal('Variation removed successfully');
      done();
    });
  });
  it('should delete  the '+ ocId +' option category ', function(done) {
    chai.request(server)
    .delete('/api/v1/mol/companies/'+ companyId +'/menuitems/'+ mochaId +'/optioncategories/'+ ocId )
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status')
      res.body.status.should.equal(true)
      res.body.should.have.property('message')
      res.body.message.should.equal('Modifier removed successfully');
      done();
    });
  });
});

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
            console.log(token);
  
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