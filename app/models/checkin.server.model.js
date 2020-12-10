var knex = require('../../config/knex');
var debug = require('debug')('checkin.model');


exports.findByTimeBox = function(lat1, lon1, lat2, lon2, searchtime) {
  if (lat1 < lat2) {
    var minlat = lat1;
    var maxlat = lat2;
  } else {
    var minlat = lat2;
    var maxlat = lat1;
  }
  if (lon1 < lon2) {
    var minlon = lon1;
    var maxlon = lon2;
  } else {
    var minlon = lon2;
    var maxlon = lon1;
  }
  return knex('checkins').select('*').whereBetween('latitude', [minlat, maxlat]).andWhereBetween('longitude', [minlon, maxlon]).andWhere('check_in','<',searchtime).andWhere('check_out','>',searchtime)
};

exports.findOpenCheckinForUnit = function(id) {
  var now = (new Date()).toISOString();
  return knex('checkins').select('*').where('unit_id',id).andWhere('check_in','<',now).andWhere('check_out','>',now);
};

exports.createCheckin = function(checkin) {
  return knex('checkins').insert(checkin).returning('*');
};

exports.findCompanyCheckin = function(company_id) {
  return knex('checkins').select('*').where('company_id',company_id).returning('*');
};

exports.getCheckin = function (id) {
  return knex('checkins').select('*').where('unit_id', id);
}

exports.updateCheckin = function (data, id) {
  return knex('checkins').update(data).where('unit_id', id);
}