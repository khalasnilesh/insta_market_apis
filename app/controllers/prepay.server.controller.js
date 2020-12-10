/**
 * @author Sávio Muniz
 */


var Prepay = require('../models/prepay.server.model');
var ParseUtils = require('../utils/parseutils');
var Users = require('../models/user.server.model');
var Units = require('../models/unit.server.model');
var request = require('requestretry');
var Customers = require('../models/customer.server.model');
var Companies = require('../models/company.server.model');
var config = require('../../config/config');

exports.recharge = recharge;
exports.registerPrepayTransaction = registerPrepayTransaction;
exports.getPrepayTransactionPromise = getPrepayTransactionPromise;
exports.registerGranuoDebit = registerGranuoDebit;

const DEFAULT_GRANUO_VALUE = "123";

function * recharge() {
  try {
    var recharge = this.body;
    var refund = this.body.refund;
    delete this.body.refund;

    var customer = (yield Users.getSingleUser(this.body.user_id))[0];
    var unit = (yield Units.getSingleUnit(this.body.unit_id))[0];
    var company = (yield Companies.getSingleCompany(unit.company_id))[0];
    var owner = (yield Users.getSingleUser(company.user_id))[0];
    var amount = this.body.amount;

    if (customer.custom_id)
      var customerId = customer.custom_id.granuo_user_id;

    if (owner.custom_id)
      var companyId = owner.custom_id.granuo_establishment_id;

    if (!customerId) {
      customerId = yield registerGranuoUser(customer);
    }

    if (!companyId) {
      var ownerGranuoId = yield registerGranuoUser(owner);
      companyId = yield registerEstablishment(ownerGranuoId, company, owner);
    }


    recharge.granuo_transaction_id = yield loadRecharge(customerId, companyId, amount);;

    var createdRecharge = (yield Prepay.createRecharge(recharge))[0];

    var response = { success : 'Recharge successfully created' };
    response.data = createdRecharge;


    this.body = {status:200,data:response,message:'Reacharge successfully'};
    this.status = 201;

    yield registerPrepayTransaction(createdRecharge.id, refund ? 'refund' : 'recharge');
  } catch (err) {
    console.error('could not create recharge');
    throw err;
  }
}

function * registerEstablishment(ownerGranuoId, company, user) {
  try {
    var granuoEstablishment = {
      "idusuario" : ownerGranuoId,
      "documento" : String(ParseUtils.generateCharDigitCode(14)),
      "cep" : "",
      "endereco" : "",
      "bairro" : "",
      "cidade" : "",
      "estado" : "",
      "nome" : company.name,
      "telefone" : "",
      "site" : "",
      "facebook" : "",
      "instagram" : "",
      "foto" : ""
    };

    var granuoEstablishmentId = null;

    var granuoRegisterPromise = new Promise( function (resolve, reject) {
      request.post({
        url: config.granuo.urls.registerEstablishment,
        headers: {
          'Authorization': 'Token ' + config.granuo.token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify(granuoEstablishment),
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
        .then(function (res) {
          var granuoEstablishment = JSON.parse(res.body);
          granuoEstablishmentId = granuoEstablishment.id;
          resolve(granuoEstablishment);
        })
        .catch( function (err) {
          console.error(err);
          reject(err);
        });
    });
  } catch (err) {
    console.error(err);
    throw new Error('Debit failed on granuo api', 400);
  }

  yield granuoRegisterPromise;

  var updatedCustomId = user.custom_id;

  updatedCustomId.granuo_establishment_id = granuoEstablishmentId;

  var updateObj = {
    "custom_id" : updatedCustomId
  };

  yield Users.updateUser(user.id, updateObj);

  return granuoEstablishmentId;
}

function * loadRecharge (customerId, companyId, amount) {
  try {
    var generatedCode = ParseUtils.generateCharDigitCode(6);

    var rechargeBody = {
      "idusuario": customerId,
      "idestabelecimento": companyId,
      "idpacote" : 0,
      "valor" : "" + amount,
      "codigoRecarga" : generatedCode
    };

    var rechargePromise = new Promise( function (resolve, reject) {
      request.post({
        url: config.granuo.urls.recharge,
        headers: {
          'Authorization': 'Token ' + config.granuo.token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify(rechargeBody),
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
        .then(function (res) {
          var recharge = JSON.parse(res.body);
          console.log('...Recharge made on granuo api. Result is: ');
          console.log(recharge);
          resolve(recharge);
        })
        .catch( function (err) {
          console.error(err);
          reject(err);
        });
    });

    yield rechargePromise;

    var redeemRechargeBody = {
      "idusuario" : customerId,
      "codigoRecarga" : generatedCode
    };

    var redeemPromise = new Promise( function (resolve, reject) {
      request.post({
        url: config.granuo.urls.redeemRecharge,
        headers: {
          'Authorization': 'Token ' + config.granuo.token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify(redeemRechargeBody),
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
      .then(function (res) {
        var recharge = JSON.parse(res.body);
        console.log('...Recharge redeemed on granuo api. Current balance is: ');
        console.log(recharge.valorRestante);
        resolve(recharge);
      })
      .catch( function (err) {
        console.error(err);
        reject(err);
      });
    });

    yield redeemPromise;

    console.log('load completed');
    return generatedCode;
  } catch (err) {
    console.error ('could not recharge granuo wallet');
    throw new Error('Recharge failed on granuo api', 400);
  }
}

function * registerGranuoDebit(amount, companyId, customerId) {
  try {
    var ownerId = (yield Companies.getSingleCompany(companyId))[0].user_id;
    var owner = (yield Users.getSingleUser(ownerId))[0];

    var customer = (yield Customers.getUser(customerId)).rows[0];

    if (!customer.custom_id.granuo_user_id) {
      yield registerGranuoUser(customer);
    }

    var granuoUserId = customer.custom_id.granuo_user_id;

    var rechargeId = yield getRechargeId(granuoUserId);

    console.log(rechargeId);
    var remainingBalance = yield debitAmount(amount, rechargeId, granuoUserId);

    console.log('Debit sucessfully made on granuo');
    console.log('Remaining balance for user ' + customer.id + " is : " + remainingBalance);
  } catch (err) {
    console.error('could not register granuo debit');
    throw new Error('Debit failed on granuo api', 400);
  }
}

function * debitAmount(amount, rechargeId, userId) {
  try {
    var debitBody = {
      "idrecarga" : rechargeId,
      "idusuario": userId,
      "itemRestante" : 0,
      "valorRestante" : "" + amount,
      "codigoTransacao" : ParseUtils.generateCharDigitCode(6)
    };

    var remainingBalance = null;

    var debitPromise = new Promise( function (resolve, reject) {
      request.post({
        url: config.granuo.urls.debit,
        headers: {
          'Authorization': 'Token ' + config.granuo.token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify(debitBody),
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
      .then(function (res) {
        var debit = JSON.parse(res.body);
        remainingBalance = debit.valorRestante;
        resolve(debit);
      })
      .catch( function (err) {
        console.error(err);
        reject(err);
      });
    });

    yield debitPromise;

    return remainingBalance;
  } catch (err) {
    console.error(err);
    throw new Error('Debit failed on granuo api', 400);
  }
}

function * getRechargeId(id) {
  try {
    var rechargeId = null;
    var rechargePromise = new Promise(function (resolve, reject) {
      request.get({
        url: config.granuo.urls.getRecharge + id,
        headers: {
          'Authorization': 'Token ' + config.granuo.token
        },
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
        .then(function (res) {
          var data = JSON.parse(res.body);
          rechargeId = data[0].id;
          resolve(data);
        })
        .catch( function (err) {
          console.error(err);
          reject(err);
        });
    });

    yield rechargePromise;
    return rechargeId;
  } catch (err) {
    console.error(err);
    throw new Error('Debit failed on granuo api', 400);
  }
}

function * registerGranuoUser(user) {
  try {
    var granuoUser = {
      nome : user.first_name + " " + user.last_name[0],
      email : user.username.indexOf("@") === -1 ? user.username + "@default.com" : user.username,
      senha : user.username,
      facebookId : DEFAULT_GRANUO_VALUE,
      celular : DEFAULT_GRANUO_VALUE
    };

    var granuoUserId = null;

    var granuoRegisterPromise = new Promise( function (resolve, reject) {
      request.post({
        url: config.granuo.urls.registerUser,
        headers: {
          'Authorization': 'Token ' + config.granuo.token,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify(granuoUser),
        maxAttempts: 3,
        retryDelay: 150 // wait for 150 ms before trying again
      })
      .then(function (res) {
        var granuoUser = JSON.parse(res.body);
        granuoUserId = granuoUser.id;
        resolve(granuoUser);
      })
      .catch( function (err) {
        console.error(err);
        reject(err);
      });
      });
  } catch (err) {
    console.error(err);
    throw new Error('Debit failed on granuo api', 400);
  }

  yield granuoRegisterPromise;

  var updatedCustomId = user.custom_id;

  updatedCustomId.granuo_user_id = granuoUserId;

  var updateObj = {
    "custom_id" : updatedCustomId
  };

  yield Users.updateUser(user.id, updateObj);

  return granuoUserId;
}

function * registerPrepayTransaction(id, type) {
  try {
    var createdTransaction = yield getPrepayTransactionPromise(id,type);
    console.log('Transaction successfully registered!');
    console.log(createdTransaction);
  } catch (err) {
    console.error('could not register transaction to history');
    throw err;
  }
}

function getPrepayTransactionPromise(id, type) {
  var transaction = {
    type : type,
    transaction_id : id,
    date : new Date()
  };

  return Prepay.registerTransaction(transaction);
}
