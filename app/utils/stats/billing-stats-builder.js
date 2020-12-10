/**
 * @author Sávio Muniz
 */

var ParseUtils = require('../parseutils');

const CONTEXT_NAMES = {
  creditcardpick : 'CC Pick-Up',
  creditcarddelivery : 'CC Delivery',
  prepay : 'Pre-Pay',
  hotel : 'Room-Service',
  cod : 'Cash on Delivery'
};

exports.generateSumStats = generateSumStats;

function * generateSumStats (orderInput) {
  return formatSumStatsResponse(getRawSumStats(orderInput));
}

exports.generatePercentageStats = generatePercentageStats;

function * generatePercentageStats (orderInput) {
  return formatPercentageStatsResponse(yield generateSumStats(orderInput));
}

function getRawSumStats(orderInput) {
  var rawStats = {
    hotel : {
      count : 0,
      amount : 0
    },
    cod : {
      count : 0,
      amount : 0
    },
    prepay : {
      count : 0,
      amount : 0
    },
    creditcardpick : {
      count : 0,
      amount : 0
    },
    creditcarddelivery : {
      count : 0,
      amount : 0
    }
  };

  orderInput.forEach(function (order) {
    var context = order.context;
    var amount = ParseUtils.parseBalance(order.amount);

    if (!context) {
      if (!order.for_delivery) {
        rawStats.creditcardpick.count++;
        rawStats.creditcardpick.amount += amount
      }
      else {
        rawStats.creditcarddelivery.count++;
        rawStats.creditcarddelivery.amount += amount
      }

    } else {
      rawStats[context].count++;
      rawStats[context].amount += amount;
    }
  });

  return rawStats;
}

function formatPercentageStatsResponse(sumStats) {
  var countTotal = 0;
  var amountTotal = 0;

  sumStats.forEach(function (context) {
    countTotal += context.count;
    amountTotal += context.amount;
  });

  sumStats.forEach(function (context, contextIndex) {
    sumStats[contextIndex].count = ParseUtils.getPercentage(sumStats[contextIndex].count,countTotal);
    sumStats[contextIndex].amount = ParseUtils.getPercentage(sumStats[contextIndex].amount,amountTotal);
  });

  return sumStats;
}

function formatSumStatsResponse(rawStats) {
  var statsResponse = [];

  Object.keys(rawStats).forEach(function (context_id) {
    var context = {};

    context.id = context_id;
    context.name = CONTEXT_NAMES[context_id];
    context.count = rawStats[context_id].count;
    context.amount = rawStats[context_id].amount;

    statsResponse.push(context);
  });

  statsResponse.sort(function (a, b) {
    return b.amount - a.amount;
  });

  return statsResponse;
}

