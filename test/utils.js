var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var knex = require('../config/knex');

chai.use(chaiHttp);

var testAdmin = {
  username : 'dn10@gmail.com',
  password : 'dn10'
};

exports.resolveSequencePromises = function (promises) {
  for (var i = 0; i < promises.length; i++) {
    cleanData(promises[i].table,promises[i].query);
  }
};

exports.cleanData = function (promises, callback) {
  handleSequencePromises(promises, 'del', callback);
};

function handleSequencePromises (promises, operation, callback) {
  handleSequencePromisesAux(promises, operation, 0, callback);
}

function handleSequencePromisesAux(promises, operation, index, callback) {
  knex(promises[index].table).where(promises[index].query)[operation]().then( function () {
    if (index === promises.length - 1)
        callback();
      else
        handleSequencePromisesAux(promises, operation, index + 1, callback);
  });
}

exports.adminCredentials = testAdmin;
exports.handleSequenceSQLPromises = handleSequencePromises;
