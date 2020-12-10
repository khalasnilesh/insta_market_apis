// get current date and time
// query for all stub companies and get their hours/days of operation
// filter result set to find companies that are currently checked-out and need to be checked-in
// apply this checkin via knex update
// filter result set to find companies that are currently checked-in and need to be checked-out
// apply this checkout via knex update
// Done.

var knex = require('../config/knex');
var cron = require('node-cron');

var getUnitInfo = function(id, callback) {
  knex.select('units.id','units.company_id', 'units.food_park_id',
                'food_parks.latitude', 'food_parks.longitude',
                'food_parks.name', 'food_parks.city', 'food_parks.state',
                'food_parks.postal_code', 'food_parks.address',
                'food_parks.country')
        .from('units')
        .innerJoin('food_parks', 'units.food_park_id', 'food_parks.id')
        .where('units.id', id)
    .then(function(unit) {
      callback(unit);
    });
}

var doCheckIn = function(unitData, currentDateTime, expectedCloseHour, callback) {
  knex('checkins').insert({company_id: unitData.company_id, unit_id: unitData.id,
                            check_in: currentDateTime, check_out: expectedCloseHour,
                            latitude: unitData.latitude, longitude: unitData.longitude,
                            food_park_id: unitData.food_park_id, food_park_name: unitData.name})
    .then(function(result) {
      callback(result);
    });
}

var doCheckOut = function(unitData, currentDateTime, callback) {
  knex('checkins').where({company_id: unitData.company_id, unit_id: unitData.id}).andWhere('check_out', '>=', currentDateTime)
    .update({check_out: currentDateTime})
    .then(function(result){
      callback(result);
    });
}

var getUnits = function(currDayOfWeekOrdinal, callback) {
  knex.select('id', 'schedule', 'hours').from('units')
    .where('stub', true)
    .andWhere('schedule', 'LIKE', '%' + currDayOfWeekOrdinal + '%')
    .then(function(result) {
      callback(result);
    });
}

/*
 * Updates unit with the current food park address.
 */
var updateUnitData = function(unitData, callback) {
  knex('units').where({id: unitData.id})
    .update({from_city: unitData.city, from_state: unitData.state,
              from_zip: unitData.postal_code, from_country: unitData.country,
              from_street: unitData.address})
    .then(function(result){
      callback(result);
    });
}

var getOpenCloseHour = function(openCloseHourRaw) {
  var splitHours = openCloseHourRaw.split('-');
  var openCloseTime = { open: null, close: null };

  if (splitHours && splitHours.length > 1) {
    var openHour = parseHour(splitHours[0]);
    openCloseTime.open = openHour;

    var closeHour = parseHour(splitHours[1]);
    openCloseTime.close = closeHour;
  }

  return openCloseTime;
}

var parseHour = function(hourRaw) {
  var hourData = { hour: 0, minutes: 0 };

  if (hourRaw.toLowerCase().indexOf('a') > 0) {
    var tempHourRaw = hourRaw.toLowerCase().split('a');

    // Hour (AM)
    var hourMinute = tempHourRaw[0].split(':');
    hourData.hour = parseInt(hourMinute[0]);
    if (hourData.hour == 12) {
      hourData.hour = 0; // 12am is 0 hours
    }
    // Minutes (AM)
    hourData.minutes = parseInt(hourMinute[1]);
  } else if (hourRaw.toLowerCase().indexOf('p') > 0) {
    var tempHourRaw = hourRaw.toLowerCase().split('p');

    // Hour (PM)
    var hourMinute = tempHourRaw[0].split(':');
    hourData.hour = parseInt(hourMinute[0]);
    if (hourData.hour < 12) {
      hourData.hour += 12;
    }
    // Minutes (PM)
    hourData.minutes = parseInt(hourMinute[1]);
  } else {
    var hourMinute = hourRaw.split(':');
    hourData.hour = parseInt(hourMinute[0]);
    hourData.minutes = parseInt(hourMinute[1]);
  }

  return hourData;
}

var getExpectedCloseHour = function(openCloseHour) {
  var closeHour = new Date();

  if (openCloseHour.close.hour - openCloseHour.open.hour < 0) {
    closeHour.setDate(closeHour.getDate() + 1);
  }
  closeHour.setHours(openCloseHour.close.hour);
  closeHour.setMinutes(openCloseHour.close.minutes);
  closeHour.setSeconds(59);
  closeHour.setMilliseconds(999);

  return closeHour;
}

// Main logic
cron.schedule('0,59 * * * *', function() {
  main();
});

var main = function() {
  var currentDateTime = new Date();
  console.log('------------------------------');
  console.log('Updating Check-in/Check-out...');
  console.log('Current date and time: ' + currentDateTime);

  var currHour = currentDateTime.getHours();
  var currMinute = currentDateTime.getMinutes();
  /*
  * 0 = Sunday / 1 = Monday / 2 = Tuesday / 3 = Wednesday
  * 4 = Thursday / 5 = Friday / 6 = Saturday
  */
  var currDayOfWeekOrdinal = currentDateTime.getDay();

  getUnits(currDayOfWeekOrdinal, function(result) {
    result.forEach(function(row) {
      if (row.hours) {
        var openCloseHour = getOpenCloseHour(row.hours);
        if ((openCloseHour.open != null) && (openCloseHour.close != null)) {

          // CHECK-IN
          if ((currHour == openCloseHour.open.hour) && (currMinute == openCloseHour.open.minutes)) {
            getUnitInfo(row.id, function(result){
              if (result[0].id) {
                console.log('Check-in: Unit ' + row.id);
                expectedCloseHour = getExpectedCloseHour(openCloseHour);
                doCheckIn(result[0], currentDateTime, expectedCloseHour, function(result) {});
                updateUnitData(result[0], function(result) {})
              }
            });

          // CHECK-OUT
          } else if ((currHour == openCloseHour.close.hour) && (currMinute == openCloseHour.close.minutes)) {
            getUnitInfo(row.id, function(result){
              if (result[0].id) {
                doCheckOut(result[0], currentDateTime, function(result) {
                  if (result > 0) {
                    console.log('Check-out: Unit ' + row.id);
                  }
                });
              }
            });
          }
        } else {
          console.log("Open/Close hour not found!");
        }
      } else {
        console.log("Hours object not defined.");
      }
    });
  });
}
