var debug = require('debug')('payment');
var sts = require('./security.server.controller');
var config = require('../../config/config');
var request = require('request');
var uuid = require('uuid');
var logger = require('winston');
var OrderHistory = require('../models/cart.server.model')
var moltin =require('../controllers/moltin.server.controller');
var parser = require('fast-xml-parser');
var Users = require('../models/user.server.model');

const DELETE = 'DELETE';
const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';

const CHECKOUT = "/v0.1/checkouts";
const OTP = "/one-time-tokens";
const PAYSTANDURL = "https://api.paystand.co/v3/";

var sumupAccessToken = "";

var oAuthSumUp = function (callback) {
  request.post({
    url: config.sumup.sumupAuthUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'client_id': config.sumup.clientId,
      'client_secret': config.sumup.client_secret
    })
  },
    function (err, res, body) {
      if (!err && res.statusCode === 200) {
        var data = JSON.parse(body);
        console.log(data);
        sumupAccessToken = data.access_token;
        console.log(sumupAccessToken);

        callback(sumupAccessToken);
      }
      else {
        console.log("Sumup access token error ", err)
        callback(err);
      }
    })
};

var getBearerToken = function (callback) {
  oAuthSumUp(callback);
};


exports.createCheckout = function* (next) {
  var checkoutData = setCheckoutData(this.body || {});
  console.log(checkoutData)
  var resData = {};
  try {
    var checkout = yield requestEntities(CHECKOUT, POST, checkoutData);
    var otp = yield requestEntities(OTP, POST, {});
    resData.checkoutId = checkout.id;
    resData.otp = otp.otpToken
  } catch (err) {
    console.error('error getting sumup token')
    console.error(err)
    throw (err)
  }
  this.body = { data: resData, status: 200, message: "Create checkout successfully" };
  return;
}

var setCheckoutData = function (body) {
  var checkoutData = { "amount": body.amount, "currency": body.currency, "pay_to_email": body.pay_to_email };
  checkoutData.checkout_reference = uuid.v1();
  return checkoutData;
}


var requestEntities = function (flow, method, data, id) {

  return new Promise(function (resolve, reject) {
    getBearerToken(function (token) {
      if (token instanceof Error) {
        reject(token);
        return;
      }
      console.log('token : ' + token)
      var oid = '';
      if (id) oid = '/' + id
      request(
        {
          method: method,
          url: config.sumup.sumupUrl + flow + oid,
          json: data,
          headers: {
            'Authorization': 'Bearer ' + token
          }
        },
        function (err, res, body) {
          if (!err && (res.statusCode === 200 || res.statusCode === 201)) {
            console.log(body)
            var bodyJson = JSON.stringify(res);
            bodyJson = JSON.parse(bodyJson).body;
            console.log(bodyJson)
            resolve(bodyJson)
            return;
          }
          else {
            console.error('Response Status: ' + res.statusCode)
            if (err) {
              console.error('err' + err);
              reject(err)
              return;
            }
            console.error(body)
            console.log(body.error)
            reject(body.error)
            return;
          }
        })
    })
  })
}

getPaymentResponse = (body)=>{
  let params = {};
  if(body.type=='card'){
    params =  {
      "amount": body.amount,
      "currency": "USD",
      "card": {
        "nameOnCard": body.name,
        "cardNumber": body.cardNumber,
        "expirationMonth": body.expirationMonth,
        "expirationYear": body.expirationYear,
        "securityCode": body.cvv,
        "billingAddress": {
          "street1": "41 Grandview St Unit C",
          "city": "Santa Cruz",
          "state": "CA",
          "postalCode": "95060",
          "country": "USA"
        }
      },
      "personalContact": {
        "email": body.email
      }
    }
  }
  if(body.type=='bank'){
    params = {
      "amount": body.amount,
      "currency": 'USD',
      "bank": {
        "nameOnAccount": body.nameOnAccount,
        "accountHolderType": body.accountHolderType,
        "accountNumber": body.accountNumber,
        "routingNumber": body.routingNumber,
        "accountType": body.accountType,
        "country": body.country,
        "currency": 'USD'
      },
      "payer": {
        "name": body.nameOnAccount,
        "email": body.email,
        "address": {
          "street1": '123 First St',
          "street2": '#2',
          "city": 'Santa Cruz',
          "state": 'CA',
          "postalCode": '95060',
          'country': 'USA'
        }
      }
    }
    // params = {
    //   "amount": '5000.00',
    //   "currency": 'USD',
    //   "bank": {
    //     "nameOnAccount": 'Jessica Lin',
    //     "accountHolderType": 'company',
    //     "accountNumber": '000123456789',
    //     "routingNumber": '110000000',
    //     "accountType": 'checking',
    //     "country": 'USA',
    //     "currency": 'USD'
    //   },
    //   "payer": {
    //     "name": 'Shalin Shaun',
    //     "email": 'shalin+test@paystand.com',
    //     "address": {
    //       "street1": '123 First St',
    //       "street2": '#2',
    //       "city": 'Santa Cruz',
    //       "state": 'CA',
    //       "postalCode": '95060',
    //       'country': 'USA'
    //     }
    //   }
    // }
  }
  return new Promise((resolve, reject)=>{
    request.post({
      url: PAYSTANDURL+'payments/secure',
      headers: {
        'content-type': 'application/json',
        'X-CUSTOMER-ID': config.payStand.customer_id,
        authorization: `Bearer ${body.token}`,
        accept: 'application/json'
      },
      body : params,
      json: true
    }, (err, res, body)=>{
      if (!err && res.statusCode === 200) {
        resolve(body);
      }
      else {
        console.log("Something went wrong", err,res,body)
        reject(err);
      }
    })
  })
}

exports.makePayment = function *(next) {
  if(Object.keys(this.body).length > 0){
    let orderId = this.body.orderId;
    if(orderId){
      let order = (yield OrderHistory.getOrderById(orderId));
      console.log('orderorderorderorderorderorderorderorderorderorderorderorderorderorder',order.rows[0].order_detail);
      let obj = order && order.rows.length > 0 ? order.rows[0].order_detail : {};

      let paymentStatus = (yield moltin.orderManualPayment(orderId)); 
      if(paymentStatus){
          obj['payment'] = "paid";
          obj['status'] = paymentStatus.status;
          let paymentcaptureStatus = (yield moltin.orderManualCapturePayment(orderId,paymentStatus.id));
      } 
      updatedOrder = (yield OrderHistory.updatedOrderByid(order.rows[0].id,obj));
      let payment = (yield getPaymentResponse(this.body));

      this.body = {status :200, message : "Payment has been successfull!"};
      return; 
    }else{
      this.body = {status :400, message : "Please send required parmas"};
      return; 
    }
  // let payment = (yield getPaymentResponse(this.body));
  // this.body = {status :200,data: payment};
  return; 
  }else{
    this.body = {status :400, message : "Please send required parmas"};
    return; 
  }
}


getPaystandToken = ()=>{
  return new Promise((resolve, reject)=>{
    request.post({
      url: PAYSTANDURL+'oauth/token',
      body: JSON.stringify({
        "grant_type": "client_credentials",
        "client_id": config.payStand.client_id,
        "client_secret": config.payStand.client_secret,
        "scope": "auth"
      }),
      headers: { 'content-type': 'application/json', accept: 'application/json' }
    }, (err, res, body)=> {
      if (!err && res.statusCode === 200) {
        var data = JSON.parse(body);
        console.log('i came here:::',data)
        resolve(data);
      }
      else {
        console.log("client access token error ", err)
        reject(err);
      }
    })
  })
}
exports.getAccessToken = function *() {
  console.log('config.payStandconfig.payStandconfig.payStand',config.payStand.client_id)
  let token = (yield getPaystandToken());
  this.body = {status:200,data:token}
  return;
}


getPaystandRefund = (body)=>{
  console.log('dsadasdasdasdasdasdasdasd',body)
  return new Promise((resolve, reject)=>{
    request.post({
      url: PAYSTANDURL+'payments/'+body.paymentId+'/refunds',
      headers: {
        'content-type': 'application/json',
        'X-CUSTOMER-ID': config.payStand.customer_id,
        authorization: `Bearer ${body.token}`,
        accept: 'application/json'
      },
      body: {
        "amount": body.amount,
        "currency": "USD",
        "description": body.description,
        "meta": {}
      },
      json: true
    }, (err, res, body)=> {
      if (!err && res.statusCode === 200) {
        // var data = JSON.parse(body);
        // console.log('i came here:::',data)
        resolve(body);
      }
      else {
        console.log("client access token error ", err)
        reject(err);
      }
    })
  })
}

exports.refundAmount = function* () {
  console.log('config.payStandconfig.payStandconfig.payStand', config.payStand.client_id)
  let refund = (yield getPaystandRefund(this.body));
  this.body = { status: 200, data: refund }
  return;
}


exports.GenerateWidget = function* () {
  try {
    let order = yield OrderHistory.getOrderById(this.params.orderId);
    if (order.rows.length) {
      let data = yield greenmoneyapi(order.rows[0]);
      this.body =  data;
      return;
    } else {
      this.status = 404;
      this.body = { status: 404, message: "Order not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

exports.GenerateCheck = function* () {
  try {
    let order = yield OrderHistory.getOrderById(this.params.orderId);
    if (order.rows.length) {
      let data = yield greenmoneycheckapi(order.rows[0], this.body);
      this.body = { status: 200, message: "success", data };
      return;
    } else {
      this.status = 404;
      this.body = { status: 404, message: "Order not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

greenmoneyapi = function* (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/FTFTokenizer.asmx/GenerateWidget",
      headers: {
        'content-type': 'application/json'
      },
      body: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "ApiPassword": config.GREEN_MONEY_APIPASSWORD,
        "Amount": Number(data.amount),
        "Display": 'fill',
        "CustomerId":  null,
        "CustomerData": {
          "firstName": data.delivery_address_details.first_name,
          "lastName": data.delivery_address_details.last_name,
          "emailAddress": data.order_detail.customer.email
        }
      },
      json: true
    }, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        console.log('i came here:::', body)
        resolve(body.d)
      }
      else {
        console.log("client access token error ", err)
        reject(err)
      }
    });
  })
};

greenmoneycheckapi = function* (data, body) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/FTFTokenizer.asmx/GenerateCheck",
      headers: {
        'content-type': 'application/json'
      },
      body: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "APIPassword": config.GREEN_MONEY_APIPASSWORD,
        "FirstName": data.delivery_address_details.first_name,
        "LastName": data.delivery_address_details.last_name,
        "PhoneNumber": data.delivery_address_details.phone_number,
        "NameOnAccount": data.order_detail.customer.name,
        "StreetAddress": data.order_detail.shipping_address.line_1,
        "Suite": "some suit",
        "City": data.order_detail.shipping_address.city,
        "State": "AZ",
        "Zip": "85002",
        "Country": "US",
        "EmailAddress": data.order_detail.customer.email,
        "Amount": Number(data.amount),
        "Date": new Date(),
        "Memo": "some memo",
        "CustomerToken": body.CustomerToken,
        "AccountToken": body.AccountToken
      },
      json: true
    }, async(err, res, body) => {
      if (!err && res.statusCode === 200) {
        let update = await updatepaymentresponse(data.id, body);
        console.log('i came here:::', body, update)
        resolve(body.d)
      }
      else {
        let update = await updatepaymentresponse(data.id, err);
        console.log("error", err, update)
        reject(err)
      }
    });
  })
};

updatepaymentresponse = function (id, data) {
  return new Promise(async(resolve, reject) => {
    try {
      let payment = await OrderHistory.updatePayment(id, JSON.stringify(data));
      if (payment) {
        resolve(payment);
      }
    } catch (error) {
      reject(error)
    }
  })
};

exports.getPaymentStatus = function* () {
  try {
    let order = yield OrderHistory.getOrderById(this.params.orderId);
    if (order.rows.length) {
      this.status = 200;
      this.body = { status: 200, message: 'Payment status', data: order.rows[0].payment_response };
      return;
    } else {
      this.status = 404;
      this.body = { status: 404, message: "Order not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}



// -----------------------------------------------------------------------------------------------------
exports.getPaymentForSumup = function* () {
  try {
    let order = yield OrderHistory.getOrderById(this.params.orderId);
    if (order.rows.length) {
      let gettoken = yield generateTokens();
      if (gettoken) {
        let checkout = yield createCheckouts(this.params.orderId, gettoken, order.rows[0]);
        let completePayment = yield updateCheckout(this.body, checkout.id, gettoken);

        let obj = order && order.rows.length > 0 ? order.rows[0].order_detail : {};
        let paymentStatus = (yield moltin.orderManualPayment(this.params.orderId));
        if (paymentStatus) {
          obj['payment'] = "paid";
          obj['status'] = paymentStatus.status;
          let paymentcaptureStatus = (yield moltin.orderManualCapturePayment(this.params.orderId, paymentStatus.id));
        }
        updatedOrder = (yield OrderHistory.updatedOrderByid(order.rows[0].id, obj));
        if (completePayment) {
          this.body = { status: 200, message: "Payment successful", data: completePayment };
          return;
        }
      }
    } else {
      this.status = 404;
      this.body = { status: 404, message: "Order not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}

generateTokens = function () {
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://api.sumup.com/oauth',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        "client_id": config.sumup.clientId,
        "client_secret": config.sumup.client_secret
      },
      json: true
    }, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("client access token error ", err)
        reject(err)
      }
    })
  })
};


createCheckouts = function (id, {access_token}, body) {
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://api.sumup.com/v0.1/checkouts',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${access_token}`,
      },
      body: {
        "checkout_reference": id,
        "amount": Number(body.amount),
        "currency": "USD",
        "pay_to_email": "instamarkt.co@sumup.com",
        "description": "Payment for instamarkt.co",
        "return_url": "http://example.com"
        },
      json: true
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("client access token error ", err)
        reject(err)
      }
    })
  })
};


updateCheckout = function (body,id, {access_token}) {
  return new Promise((resolve, reject) => {
    request.put({
      url: `https://api.sumup.com/v0.1/checkouts/${id}`,
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${access_token}`,
      },
      body: {
        "payment_type": "card",
        "card": {
          "cvv": body.cvv,
          "number": body.card_number,
          "expiry_year": body.year,
          "expiry_month": body.month,
          "name": body.name
        }
      },
      json: true
    }, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
}

//-------------------------------------------------------------------------------------------------------------

exports.getPayorId = function*(){
  try{
    let user = (yield Users.getSingleUser(this.params.userId))[0];
    if(user){
      let id = user.green_money_payor_id;
      this.body = {status:200, message:"Payor_id", data:id};
      return;
    }else{
      this.status=404;
      this.body={status:404, message:"user not found!"};
      return;
    }
  }catch(error){
    this.status=400;
    this.body = {status:400, message:"Something went wrong",error};
    return;
  }
}


exports.echequeCreateCustomer = function* () {
  try {
    let order = yield OrderHistory.getOrderById(this.params.orderId);
    let user = (yield Users.getSingleUser(this.body.userId))[0];
    if (order.rows.length) {
      if (!user.green_money_payor_id) {
        let customer = yield createCustomers(this.body, order.rows[0], user);
        if (customer) {
          if (customer.CustomerResult.Result == 0) {
            let update = yield Users.updatepayor(customer.CustomerResult.Payor_ID, this.body.userId);
            let check = yield CustomerOneTimeDraftRTV(customer.CustomerResult.Payor_ID, order.rows[0]);
            this.body = { status: 200, message: "success", data: check };
            return;
          } else {
            this.status = 400;
            this.body = { status: 400, message: "Something went wrong", data: customer };
            return;
          }
        }
      } else {
        let check = yield CustomerOneTimeDraftRTV(user.green_money_payor_id, order.rows[0]);
        if (check) {
          this.body = { status: 200, message: "success", data: check };
          return;
        }
      }
    } else {
      this.status = 404;
      this.body = { status: 404, message: "Order not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}


createCustomers = function (data, resp, user) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/eCheck.asmx/CreateCustomer",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      form: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "ApiPassword": config.GREEN_MONEY_APIPASSWORD,
        "NickName": resp.order_detail.shipping_address.first_name,
        "NameFirst": resp.order_detail.shipping_address.first_name,
        "NameLast": resp.order_detail.shipping_address.last_name,
        "PhoneWork": user.phone,
        "PhoneWorkExtension": "555",
        "EmailAddress": resp.order_detail.customer.email,
        "MerchantAccountNumber": data.MerchantAccountNumber,
        "BankAccountCompanyName": resp.company_name,
        "BankAccountAddress1": "test",
        "BankAccountAddress2": "test",
        "BankAccountCity": resp.order_detail.shipping_address.city,
        "BankAccountState": "AZ",
        "BankAccountZip": "98764",
        "BankAccountCountry": "US",
        "BankName": data.BankName,
        "RoutingNumber": data.RoutingNumber,
        "AccountNumber": data.AccountNumber,
        "Note": "test",
        "x_delim_data":"",
        "x_delim_char":""
      }
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        var json = parser.parse(body);
        resolve(json)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
}

exports.echequeDeleteCustomer = function* () {
  try {
    let customer = yield deleteCustomers(this.body);
    this.body = {status:200, message:"success", data:customer};
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}


deleteCustomers = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/eCheck.asmx/DeleteCustomer",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      form: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "ApiPassword": config.GREEN_MONEY_APIPASSWORD,
        "Payor_ID": data.payor_id,
        "DeletePendingChecks":data.DeletePendingChecks,
        "x_delim_data":"",
        "x_delim_char":""
      }
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        var json = parser.parse(body);
        resolve(json)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
}

exports.echequeCancelCheque = function* () {
  try {
    let customer = yield cancelCheque(this.body);
    this.body = {status:200, message:"success", data:customer};
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong", error };
    return;
  }
}

cancelCheque = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/eCheck.asmx/CancelCheck",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      form: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "ApiPassword": config.GREEN_MONEY_APIPASSWORD,
        "Check_ID": data.check_id,
        "x_delim_data":"",
        "x_delim_char":""
      }
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        var json = parser.parse(body);
        resolve(json)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
}


CustomerOneTimeDraftRTV = function (payor_id, data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "https://cpsandbox.com/eCheck.asmx/CustomerOneTimeDraftRTV",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      form: {
        "Client_ID": config.GREEN_MONEY_CLIENT_ID,
        "ApiPassword": config.GREEN_MONEY_APIPASSWORD,
        "Payor_ID":payor_id,
        "CheckMemo":"test",
        "CheckAmount":Number(data.amount),
        "CheckDate":new Date(),
        "x_delim_data":"",
        "x_delim_char":""
      }
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        var json = parser.parse(body);
        resolve(json)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
}
