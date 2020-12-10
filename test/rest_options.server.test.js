process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);


// TEST ORDER MANAGEMENT

var tests = "- Rest Options/RestEasy Tests - ";



/*
pickup:
{ 
  "order_sys_order_id": "1505190689619574804",
  "desired_pickup_time":  "11/6/2016, 8:11:56 PM"
}

delivery:
{ 
  "order_sys_order_id": "1505190689619574804",
  "desired_pickup_time":  "11/6/2016, 8:11:56 PM",
  "delivery_address_id" : "1",
  "for_delivery": "true"
}
*/

var coId = 1005;
var unitId = 2006;
var customer = 'mp10';
var custId = 9001;
var orderSysOrderId = '1505190689619574804';

var puOrderId = '';
var dOrderId = '';

var custToken = '';
var unitToken = '';

var moltinItemData =
{
  "status": true,
  "result": [
      {
          "id": "1505190692077436949",
          "created_at": "2017-05-01 15:32:14",
          "updated_at": "2017-05-01 15:32:14",
          "product": {
              "value": "Pork Plate",
              "data": {
                  "id": "1494323206792676204",
                  "order": null,
                  "created_at": "2017-04-16 15:40:29",
                  "updated_at": "2017-04-16 15:40:52",
                  "sku": "classy-cuban-1490581347750-pork-plate",
                  "title": "Pork Plate",
                  "slug": "classy-cuban-1490581347750-pork-plate",
                  "sale_price": 0,
                  "status": {
                      "value": "Live",
                      "data": {
                          "key": "1",
                          "value": "Live"
                      }
                  },
                  "category": {
                      "value": "Jantar",
                      "data": {
                          "1479428322940158618": {
                              "id": "1479428322940158618",
                              "order": null,
                              "created_at": "2017-03-27 02:27:01",
                              "updated_at": "2017-05-03 20:19:09",
                              "parent": {
                                  "value": "Classy Cuban Menu",
                                  "data": {
                                      "id": "1479426037740733077",
                                      "order": null,
                                      "created_at": "2017-03-27 02:22:28",
                                      "updated_at": "2017-03-27 02:22:28",
                                      "parent": null,
                                      "slug": "classy-cuban-1490581347750",
                                      "status": {
                                          "value": "Live",
                                          "data": {
                                              "key": "1",
                                              "value": "Live"
                                          }
                                      },
                                      "title": "Classy Cuban Menu",
                                      "description": "Classy Cuban Menu",
                                      "company": {
                                          "value": "Classy Cuban",
                                          "data": {
                                              "id": "1479426030098711188",
                                              "order": null,
                                              "created_at": "2017-03-27 02:22:27",
                                              "updated_at": "2017-03-27 02:22:27",
                                              "name": "Classy Cuban",
                                              "email": "Manny@classycuban.com",
                                              "facebook": "",
                                              "photo": null,
                                              "description": "",
                                              "favdish": null
                                          }
                                      }
                                  }
                              },
                              "slug": "classy-cuban-1490581347750-dinner",
                              "status": {
                                  "value": "Live",
                                  "data": {
                                      "key": "1",
                                      "value": "Live"
                                  }
                              },
                              "title": "Jantar",
                              "description": "Dinner",
                              "company": {
                                  "value": "Classy Cuban",
                                  "data": {
                                      "id": "1479426030098711188",
                                      "order": null,
                                      "created_at": "2017-03-27 02:22:27",
                                      "updated_at": "2017-03-27 02:22:27",
                                      "name": "Classy Cuban",
                                      "email": "Manny@classycuban.com",
                                      "facebook": "",
                                      "photo": null,
                                      "description": "",
                                      "favdish": null
                                  }
                              }
                          }
                      }
                  },
                  "stock_level": 10000000,
                  "stock_status": {
                      "value": "Unlimited",
                      "data": {
                          "key": "0",
                          "value": "Unlimited"
                      }
                  },
                  "description": "Marinated shredded pork, sautéed onions and plantains served with rice and beans",
                  "requires_shipping": {
                      "value": "No",
                      "data": {
                          "key": "0",
                          "value": "No"
                      }
                  },
                  "weight": 0,
                  "height": 0,
                  "width": 0,
                  "depth": 0,
                  "catalog_only": {
                      "value": "No",
                      "data": {
                          "key": "0",
                          "value": "No"
                      }
                  },
                  "collection": null,
                  "brand": null,
                  "tax_band": {
                      "value": "Brazil Tax Band",
                      "data": {
                          "id": "1427064502431515521",
                          "title": "Brazil Tax Band",
                          "description": "Brazil Tax Band",
                          "rate": 0,
                          "created_at": null,
                          "updated_at": null
                      }
                  },
                  "company": {
                      "value": "Classy Cuban",
                      "data": {
                          "id": "1479426030098711188",
                          "order": null,
                          "created_at": "2017-03-27 02:22:27",
                          "updated_at": "2017-03-27 02:22:27",
                          "name": "Classy Cuban",
                          "email": "Manny@classycuban.com",
                          "facebook": "",
                          "photo": null,
                          "description": "",
                          "favdish": null
                      }
                  },
                  "price": {
                      "value": "R$12.00",
                      "data": {
                          "formatted": {
                              "with_tax": "R$12.00",
                              "without_tax": "R$12.00",
                              "tax": "R$0.00"
                          },
                          "rounded": {
                              "with_tax": 12,
                              "without_tax": 12,
                              "tax": 0
                          },
                          "raw": {
                              "with_tax": 12,
                              "without_tax": 12,
                              "tax": 0
                          }
                      }
                  },
                  "is_variation": false,
                  "modifiers": {
                      "1496425450040197759": {
                          "id": "1496425450040197759",
                          "order": null,
                          "created_at": "2017-04-19 13:17:16",
                          "updated_at": "2017-04-19 13:17:16",
                          "type": {
                              "value": "Single",
                              "data": {
                                  "key": "single",
                                  "value": "Single"
                              }
                          },
                          "title": "OptionItems",
                          "instructions": "",
                          "product": "1494323206792676204",
                          "variations": {
                              "1496425453898957440": {
                                  "title": "item",
                                  "product": "",
                                  "modifier": "1496425450040197759",
                                  "mod_price": "+12",
                                  "id": "1496425453898957440",
                                  "difference": "+R$12.00"
                              }
                          }
                      }
                  },
                  "images": [
                      {
                          "id": "1494323351269671847",
                          "name": "upload_94badaf9e8078a5795c1c296165503ed",
                          "url": {
                              "http": "http://commercecdn.com/1278235777548943678/0f8d9ba1-4ce2-4023-b10b-0306a0ebbf6c.jpeg",
                              "https": "https://commercecdn.com/1278235777548943678/0f8d9ba1-4ce2-4023-b10b-0306a0ebbf6c.jpeg"
                          },
                          "segments": {
                              "domain": "commercecdn.com/",
                              "suffix": "1278235777548943678/0f8d9ba1-4ce2-4023-b10b-0306a0ebbf6c.jpeg"
                          },
                          "details": {
                              "type": "image",
                              "size": 122794,
                              "width": 564,
                              "height": 846
                          }
                      }
                  ]
              }
          },
          "sku": "classy-cuban-1490581347750-pork-plate",
          "title": "Pork Plate",
          "quantity": 1,
          "tax_rate": 0,
          "tax_band": {
              "value": "Brazil Tax Band",
              "data": {
                  "id": "1427064502431515521",
                  "title": "Brazil Tax Band",
                  "description": "Brazil Tax Band",
                  "rate": 0,
                  "created_at": null,
                  "updated_at": null
              }
          },
          "options": "[]",
          "cart_identifier": "07c0189a5214369cf658b74b96912da7",
          "price": {
              "value": "R$12.00",
              "data": {
                  "formatted": {
                      "with_tax": "R$12.00",
                      "without_tax": "R$12.00",
                      "tax": "R$0.00"
                  },
                  "rounded": {
                      "with_tax": 12,
                      "without_tax": 12,
                      "tax": 0
                  },
                  "raw": {
                      "with_tax": 12,
                      "without_tax": 12,
                      "tax": 0
                  }
              }
          },
          "totals": {
              "value": "R$12.00",
              "data": {
                  "formatted": {
                      "with_tax": "R$12.00",
                      "without_tax": "R$12.00",
                      "tax": "R$0.00"
                  },
                  "rounded": {
                      "with_tax": 12,
                      "without_tax": 12,
                      "tax": 0
                  },
                  "raw": {
                      "with_tax": 12,
                      "without_tax": 12,
                      "tax": 0
                  }
              }
          }
      }
  ],
  "pagination": {
      "total": 1,
      "current": 1,
      "limit": 10,
      "offset": 0,
      "from": 1,
      "to": 1,
      "offsets": {
          "first": false,
          "previous": false,
          "next": false,
          "last": false
      },
      "links": {
          "first": false,
          "previous": false,
          "next": false,
          "last": false
      }
  }
};

describe(tests +' Create a new order', function() {
  it('should login Customer and retrieve JWT token', function(done) {
    chai.request(server)
    .post('/auth/login')
    .send({
        "username": customer, // no email for Customer mp10
        "password": customer
    })
    .end(function (err, res) {
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
  it('should create a new pickup order', function(done) {
    chai.request(server)
    .post('/api/v1/rel/companies/'+ coId +'/units/'+ unitId+'/order_history')
    .set('Authorization', custToken)
    .send({
        "order_sys_order_id": orderSysOrderId,
        "desired_pickup_time": "6/6/2017, 8:11:56 PM",
        "commission_type": 'hotel',
        "amount": "R$12.00",
        "menu_items_data" : moltinItemData
    })
    .end(function(err, res) {
      console.log(err);
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      // Save the newly created category id
      puOrderId = res.body.id

      res.body.should.have.property('order_sys_order_id');
      res.body.order_sys_order_id.should.equal(orderSysOrderId);
      res.body.should.have.property('company_id');
      res.body.company_id.should.equal(coId);
      res.body.should.have.property('company_id');
      res.body.company_id.should.equal(coId);
      res.body.should.have.property('unit_id');
      res.body.unit_id.should.equal(unitId);
      res.body.should.have.property('customer_id');
      res.body.customer_id.should.equal(custId);
      done();
    });
  });
});

describe(tests +' Delete the pickup order', function() {
  it('should delete the pickup order', function(done) {
    chai.request(server)
    .delete('/api/v1/rel/companies/'+ coId +'/units/'+ unitId +'/order_history/'+ puOrderId)
    .set('Authorization', custToken)
    .end(function(err, res) {
      console.log(err);
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  });
});
