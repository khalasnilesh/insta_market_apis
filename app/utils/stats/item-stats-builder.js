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
    var items = order.order_detail;

    Object.keys(items).forEach(function (itemId) {
      if (!rawStats[items[itemId]]) {
        rawStats[itemId] = {};
        rawStats[itemId].count = items[itemId].quantity;
        rawStats[itemId].name = items[itemId].title;
        rawStats[itemId].company_id = order.company_id;
        rawStats[itemId].unit_id = order.unit_id;
      }

      else
        rawStats[itemId].count += items[itemId].quantity;
    });
  });

  return rawStats;
}

function formatPercentageStatsResponse(sumStats) {
  var countTotal = 0;

  sumStats.forEach(function (item) {
    countTotal += item.count;
  });

  sumStats.forEach(function (item, itemIndex) {
    sumStats[itemIndex].count = ParseUtils.getPercentage(sumStats[itemIndex].count,countTotal);
  });

  return sumStats;
}

function formatSumStatsResponse(rawStats) {
  var statsResponse = [];

  Object.keys(rawStats).forEach(function (item_id) {
    var item = {name : '', count : 0, id : ''};

    item.count = rawStats[item_id].count;
    item.id = item_id;
    item.name = rawStats[item_id].name;
    item.company_id = rawStats[item_id].company_id;
    item.unit_id = rawStats[item_id].unit_id;

    statsResponse.push(item);
  });

  statsResponse.sort(function (a, b) {
    return b.count - a.count;
  });

  return statsResponse;
}
