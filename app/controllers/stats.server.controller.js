/**
 * @author Sávio Muniz
 */

var StatsHelper = require('../utils/stats/stats-helper');

function getPerspectiveObj(params) {
  var id = undefined;
  var perspective = "";

  if (params.companyId) {
    id = params.companyId;
    perspective = 'vendor';
  }

  else if (params.foodParkId) {
    id = params.foodParkId;
    perspective = 'foodpark';
  }

  else {
    perspective = 'support';
  }

  return {
    id : id,
    perspective : perspective
  };
}

exports.getUnitSumStats = function * () {
    try {
      var perspectiveObj = getPerspectiveObj(this.params);

      this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'unit', 'sum', this.query.start, this.query.end, perspectiveObj.id);
    } catch (err) {
      throwDefaultError(err);
    }
};

exports.getUnitPercentageStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'unit', 'percentage', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getItemSumStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'item', 'sum', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getItemPercentageStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'item', 'percentage', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getCustomerSumStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'customer', 'sum', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getCustomerPercentageStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'customer', 'percentage', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getTotalSumStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'total', 'sum', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getBillingSumStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'billing', 'sum', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getBillingPercentageStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'billing', 'percentage', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getCommissionDetailedStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'commission', 'detailed', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

exports.getCommissionSumStats = function * () {
  try {
    var perspectiveObj = getPerspectiveObj(this.params);

    this.body = yield StatsHelper.getStats(perspectiveObj.perspective, 'commission', 'sum', this.query.start, this.query.end, perspectiveObj.id);
  } catch (err) {
    throwDefaultError(err);
  }
};

function throwDefaultError(err) {
  console.error('error generating stats');
  throw(err);
}
