var knex  = require('../../config/knex');
var debug = require('debug')('reviews.model');


exports.getCompanyId = function(reviewId) {
  return knex('reviews').select('company_id').where('id', parseInt(reviewId));
}

exports.getAverageRating = function(companyId, approvedReviewId) {
  var coId = parseInt(companyId);
  var rId = parseInt(approvedReviewId);
  
  var column = [ knex.raw('round((sum(rating)/count(rating))::numeric,2) as avg_rating') ];
  var sta = 'Approved';
  
  // During dev testing, found that the earlier transaction to set status 'Approved' to the review table record
  // is not yet committed, and so this query must use the 'orWhere' with the approved review's ID.
  
  return knex('reviews').select(column).where({company_id: coId, status: sta}).orWhere('id', rId).groupBy('company_id');
}