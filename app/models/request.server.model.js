var knex = require('../../config/knex');
// var debug = require('debug')('events.model');

const REQUEST_TABLE = "requests";
const OFFER_TABLE = "offers";

exports.createRequest = function (request) {
    return knex(REQUEST_TABLE).insert(request).returning('*');
};

exports.updateRequest = function * (request_id, params) {
	return knex(REQUEST_TABLE).where('id', '=', request_id).update(params);
}

exports.deleteSingleRequest = function(id){
	return knex(REQUEST_TABLE).where('id', '=', id).update({is_deleted: true});
}

exports.getSingleRequest = function (id) {
    return knex(REQUEST_TABLE).select('id').where('id', id).first();
};

exports.getRequest = function (id) {
    return knex(REQUEST_TABLE).select('*').where('id', id).first();
};

exports.getRequests = function() {
	return knex(REQUEST_TABLE).distinct('requests.*').andWhere('requests.is_deleted', false);
}

exports.getRequestsByCompany = function(id){
	return knex(REQUEST_TABLE).distinct('requests.*').join(OFFER_TABLE, 'offers.request_id', 'requests.id')
			.where('offers.company_id', id).andWhere('requests.is_deleted', false)
			.andWhere('offers.is_deleted', false);
}

exports.getRequestsByCompanyUnit = function(company_id, unit_id){
	return knex(REQUEST_TABLE).distinct('requests.*').join(OFFER_TABLE, 'offers.request_id', 'requests.id')
			.where('offers.company_id', company_id).andWhere('unit_id', unit_id)
			.andWhere('offers.offer_accepted', false).andWhere('requests.is_deleted', false);
}

exports.getRequestsByCompanyContractNotApproved = function(id){
	return knex.raw("SELECT requests.* FROM requests " +
						"WHERE requests.is_deleted=false AND requests.id IN " +
						"(SELECT DISTINCT offers.request_id FROM offers " + 
							"WHERE offers.company_id=" + id + " AND request_id IN " +
								"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false " +
									"AND request_id NOT IN " + 
										"(SELECT DISTINCT request_id FROM offers WHERE offers.contract_approved=true)))");
}

exports.getRequestsContractNotApproved = function(){
	return knex.raw("SELECT requests.* FROM requests " +
						"WHERE requests.is_deleted=false AND requests.id IN " +
							"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false " +
								"AND request_id NOT IN " + 
									"(SELECT DISTINCT request_id FROM offers WHERE offers.contract_approved=true))");
}

exports.getRequestsByCompanyMultiple = function(ids){
	return knex(REQUEST_TABLE).distinct('requests.*').join(OFFER_TABLE, 'offers.request_id', 'requests.id').where('offers.company_id','in' , ids);
}

exports.getRequestsByOffer = function(offer_id) {
	return knex(REQUEST_TABLE).distinct('requests.*').join(OFFER_TABLE, 'offers.request_id', 'requests.id').where('offers.id', offer_id);
}

exports.getRequestsByOfferList = function(offer_list) {
	var returnArr = [];
	
	for (var i = 0; i < offer_list.length; i++) {
		var requestArr = knex(REQUEST_TABLE).select().where('id', offer_list[i].request_id).first();
		returnArr.push({"request": requestArr, "offers": offer_list[i]});
	}

	return returnArr;
}

exports.getRequestsByOfferIdList = function(offer_id_list) {
	return knex(REQUEST_TABLE).distinct('*').where('id', 'in', offer_id_list).andWhere('is_deleted', false);
}

exports.getRequestByCustomer = function (request_id, customer_id) {
	return knex(REQUEST_TABLE).select('*').where('id', request_id).andWhere('is_deleted', false)
			.andWhere('customer_id', customer_id).first();
};

exports.getRequestsByCustomerId = function (customer_id) {
	return knex.raw("SELECT requests.* FROM requests " +
						"WHERE requests.customer_id=" + customer_id + " AND requests.is_deleted=false AND requests.id NOT IN " + 
   							"(SELECT DISTINCT offers.request_id AS id FROM offers " +
	   							"WHERE offers.is_deleted=false AND offers.contract_approved=true)");
}

exports.getRequestsByCustomerIdWeekFilter = function (customer_id, weekFilter) {
	return knex.raw("SELECT requests.* FROM requests " +
						"WHERE requests.customer_id=" + customer_id + " AND requests.created_at >= now() - interval '" + weekFilter + " week' " +
						"AND requests.is_deleted=false AND requests.id NOT IN " + 
   							"(SELECT DISTINCT offers.request_id AS id FROM offers " +
	   							"WHERE offers.is_deleted=false AND offers.contract_approved=true)");
}

exports.getRequestByCustomerContractApproved = function (customer_id) {
	return knex(REQUEST_TABLE).join(OFFER_TABLE, 'offers.request_id', 'requests.id')
			.where('requests.customer_id', customer_id).andWhere('requests.is_deleted', false)
			.andWhere('contract_approved', true);
}

exports.getRequestsByCompanyContractApproved = function(id){
	return knex(REQUEST_TABLE).join(OFFER_TABLE, 'offers.request_id', 'requests.id')
			.where('offers.company_id', id).andWhere('requests.is_deleted', false)
			.andWhere('contract_approved', true);
}

exports.getRequestsNoOffers = function(){
	return knex.raw("SELECT * FROM requests WHERE requests.is_deleted=false AND requests.id NOT IN " +
						"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false);");
}

exports.getRequestsNoOffersByCompany = function(company_id) {
	return knex.raw("SELECT * FROM requests WHERE requests.is_deleted=false AND " +
						"(requests.id NOT IN " +
							"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false) OR " +
						"requests.id NOT IN " +
							"(SELECT DISTINCT requests.id FROM requests JOIN offers ON (offers.request_id=requests.id) " +
								"WHERE offers.company_id=" + company_id + " AND requests.is_deleted=false " +
									"AND offers.is_deleted=false));");
}

exports.getRequestsNoOffersByCompanyUnit = function(company_id, unit_id) {
	return knex.raw("SELECT * FROM requests WHERE requests.is_deleted=false AND " +
						"(requests.id NOT IN " +
							"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false) OR " +
						"requests.id NOT IN " +
							"(SELECT DISTINCT requests.id FROM requests JOIN offers ON (offers.request_id=requests.id) " +
								"WHERE offers.company_id=" + company_id + " AND offers.unit_id=" + unit_id + " AND " +
									"requests.is_deleted=false AND offers.is_deleted=false));");
}

exports.getRequestsNoOffersByCoordinates = function(latitude, longitude){
	return knex.raw("SELECT * FROM requests WHERE requests.is_deleted=false " +
						"AND requests.latitude < " + latitude[0] +
						"AND requests.latitude > " + latitude[1] +
						"AND requests.longitude < " + longitude[0] +
						"AND requests.longitude > " + longitude[1] + 
						"AND requests.id NOT IN " +
							"(SELECT DISTINCT offers.request_id FROM offers WHERE offers.is_deleted=false);");
}