/**
 * @author Sávio Muniz
 */

var ParseUtils = require('../parseutils');

exports.generateSumStats = generateSumStats;

function * generateSumStats (orderInput) {
  return formatSumStatsResponse(getRawSumStats(orderInput));
}

exports.generatePercentageStats = generatePercentageStats;

function * generatePercentageStats (orderInput) {
  return formatPercentageStatsResponse(yield generateSumStats(orderInput));
}

function getRawSumStats(orderInput) {
  var rawStats = {};
  orderInput.forEach(function (order) {
    var customer = order.customer_id;
    var amount = ParseUtils.parseBalance(order.amount);

    if (!rawStats[customer]) {
      rawStats[customer] = {
        name : order.customer_name,
        amount : amount,
        count : 1
      };
    } else {
      rawStats[customer].amount += amount;
      rawStats[customer].count += 1;
    }
  });

  return rawStats;
}

function formatPercentageStatsResponse(sumStats) {
  var countTotal = 0;
  var amountTotal = 0;

  sumStats.forEach(function (item) {
    countTotal += item.count;
    amountTotal += item.amount;
  });

  sumStats.forEach(function (item, itemIndex) {
    sumStats[itemIndex].count = ParseUtils.getPercentage(sumStats[itemIndex].count,countTotal);
    sumStats[itemIndex].amount = ParseUtils.getPercentage(sumStats[itemIndex].amount,amountTotal);
  });

  return sumStats;
}

function formatSumStatsResponse(rawStats) {
  var statsResponse = [];

  Object.keys(rawStats).forEach(function (customer_id) {
    var customer = {};

    customer.id = customer_id;
    customer.name = rawStats[customer_id].name;
    customer.count = rawStats[customer_id].count;
    customer.amount = rawStats[customer_id].amount;

    statsResponse.push(customer);
  });

  statsResponse.sort(function (a, b) {
    return b.amount - a.amount;
  });

  return statsResponse;
}

