var Unit = require ('../models/unit.server.model');
var FoodParks = require ('../models/foodpark.server.model');
var Users = require('../models/user.server.model');
var debug = require('debug')('geo.server.controller');
var logger = require('winston');


exports.searchUnits=function *(next) {
	meta={
		fn:'searchUnits',
		latitude:this.query.latitude,
		longitude:this.query.longitude,
		distance:this.query.distance
	};
	logger.info('Searching Unit checkins', meta);
	var date = new Date();
	meta.date=date;
	var units = Unit.findByCheckinTimebox(parseFloat(this.query.latitude), parseFloat(this.query.longitude), parseFloat(this.query.distance), date).then( function (result) {
		debug(result);

		logger.info('Unit checkins found', meta);
		return result;
	}).catch(
		function (err){
			meta.error=err;
			logger.error('error while searching for unit checkins', meta);
			throw err;
		});
		console.log({units})

	var resultUnits = yield units;

	var promises = [];

	resultUnits.forEach( function (unit, index) {
	    if (unit.food_park_id) {
        promises.push(FoodParks.getSingleFoodPar(unit.food_park_id));
      }
      else {
	      promises.push(undefined);
      }
  });

	var userPromises = [];
	console.log(promises.length);

	var venueTypeResponse = Promise.all(promises).then(function (result) {
    result.forEach(function (foodPark, index) {
      if (foodPark) {
        resultUnits[index].venue_type = foodPark[0].type;
        userPromises.push(Users.getSingleUser(foodPark[0].foodpark_mgr));
      }
      else {
        resultUnits[index].venue_type = null;
        userPromises.push(undefined);
      }
    });

    return resultUnits
  });

	resultUnits = yield venueTypeResponse;

	var managerResponse = Promise.all(userPromises).then(function (result) {
    result.forEach(function (user, index) {
      if (user.length > 0) {
        resultUnits[index].venue_fbid = user[0].fbid;
        resultUnits[index].venue_fb_handle = user[0].provider_data;
      }
      else {
        resultUnits[index].venue_fbid = null;
        resultUnits[index].venue_fb_handle = null;
      }
    });

    return resultUnits
  });

	resultUnits = yield managerResponse;

	resultUnits.filter(x => x.latitude > x.longitude);

  this.body = resultUnits;
};

exports.searchPostal=function *(next) {
	meta={
		fn:'searchPostal',
		latitude:this.query.latitude,
		longitude:this.query.longitude,
		distance:this.query.distance
	};
	logger.info('Searching Unit checkins by postal', meta);
	var date = new Date();
	meta.date=date;
	var units = []
	Unit.findByCheckinTimebox(parseFloat(this.query.latitude), parseFloat(this.query.longitude), parseFloat(this.query.distance), date).then( function (result) {
    units = result;
		logger.info('Unit checkins found', meta);
		this.body = units;
	}).catch(
		function (err){
			meta.error=err;
			logger.error('error while searching for unit checkins by postal', meta);
			throw err;
		});
};
