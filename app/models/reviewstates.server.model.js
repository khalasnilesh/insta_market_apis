var knex  = require('../../config/knex');
var debug = require('debug')('reviewstates.model');

exports.getAllowedTransitionsForCurrentState = function(currStateName) {
  return knex('review_states').select('allowed_transitions').where('name', currStateName);
}

exports.getInitialState = function() {
  return knex('review_states').select('name').where('id', 1);
}

exports.getUpdatedState = function() {
  return knex('review_states').select('name').where('id', 3);
}

exports.getApprovedState = function() {
  return knex('review_states').select('name').where('id', 2);
}

exports.getDisapprovedState = function() {
  return knex('review_states').select('name').where('id', 4);
}

exports.getStateName = function(reviewStateId) {
  return knex('review_states').select('name').where('id', parseInt(reviewStateId));
}
