var knex  = require('../../config/knex');
var debug = require('debug')('territories.model');

exports.getAllTerritories = function() {
  return knex('territories').select();
};

exports.getSingleTerritory = function(id) {
  return knex('territories').select().where('id', id);
};

exports.createTerritory = function(data){
    return knex('territories').insert(data).returning('*');
}
exports.updateTerritory = function(data,id){
  let final = {
      city:data.city,
      territory: data.territory,
      state:data.state,
      country:data.country,
      timezone:data.timezone,
      latitude:data.latitude,
      longitude:data.longitude
      }
  return knex('territories').update(final).where('id',id).returning('*')
}

exports.deleteTerritory = function(id){
  return knex('territories').where('id',id).del();
}