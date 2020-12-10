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
    var amount = ParseUtils.parseBalance(order.amount);

    if (rawStats[order.company_id]) {
      if (rawStats[order.company_id][order.unit_id]) {
        rawStats[order.company_id][order.unit_id].count += 1;
        rawStats[order.company_id][order.unit_id].amount += amount;
      }
      else {
        rawStats[order.company_id][order.unit_id] = {};
        rawStats[order.company_id][order.unit_id].count = 1;
        rawStats[order.company_id][order.unit_id].amount = amount;
      }
    }
    else {
      rawStats[order.company_id] = {};
      rawStats[order.company_id][order.unit_id] = {};
      rawStats[order.company_id][order.unit_id].count = 1;
      rawStats[order.company_id][order.unit_id].amount = amount;
    }
  });

  return rawStats
}


function formatPercentageStatsResponse(sumStats) {
  var countTotal = 0;
  var amountTotal = 0;

  sumStats.forEach(function (company) {
    countTotal += company.count;
    amountTotal += company.amount;
  });

  sumStats.forEach(function (company, companyIndex) {
    var companyCountSum = sumStats[companyIndex].count;
    var companyAmountSum = sumStats[companyIndex].amount;

    sumStats[companyIndex].count = ParseUtils.getPercentage(companyCountSum,countTotal);
    sumStats[companyIndex].amount = ParseUtils.getPercentage(companyAmountSum,amountTotal);

    company.units.forEach(function (unit, unitIndex) {
      sumStats[companyIndex].units[unitIndex].count = ParseUtils.getPercentage(sumStats[companyIndex].units[unitIndex].count, companyCountSum);
      sumStats[companyIndex].units[unitIndex].amount = ParseUtils.getPercentage(sumStats[companyIndex].units[unitIndex].amount, companyAmountSum);
    });
  });

  return sumStats;
}


function formatSumStatsResponse(rawStats) {
  var statsResponse = [];
  Object.keys(rawStats).forEach(function (company_id) {
    var company = {company_id : company_id, count : 0, amount : 0, units : []};

    Object.keys(rawStats[company_id]).forEach(function(unit_id) {
      company.count += rawStats[company_id][unit_id].count;
      company.amount += rawStats[company_id][unit_id].amount;
      company.units.push({
        unit_id : unit_id,
        count : rawStats[company_id][unit_id].count,
        amount : rawStats[company_id][unit_id].amount
      });
    });

    statsResponse.push(company);
  });

  return statsResponse;
}
