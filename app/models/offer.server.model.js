var knex = require('../../config/knex');
// var debug = require('debug')('events.model');

const REQUEST_TABLE = "requests";
const OFFER_TABLE = "offers";

exports.getOffersByRequestId = function(id) {
	return knex(OFFER_TABLE).select().where('request_id', id);
}

exports.createOffer = function (request) {
	return knex(OFFER_TABLE).insert(request).returning('*');
}

exports.getAllOffersByRequest = function (requestList) {
	var offersArr = [];

	offersArr = knex(OFFER_TABLE).select().where('request_id', requestList.id).andWhere('is_deleted', false);
	return {"request": requestList, "offers": offersArr};
}

exports.getAllOffersRequestList = function (requestList) {
	var returnArr = [];
	var offersArr = [];
	
	for (var i = requestList.length - 1; i >= 0; i--) {
		offersArr = knex(OFFER_TABLE).select().where('request_id', requestList[i].id).andWhere('is_deleted', false);
		returnArr.push({"request": requestList[i], "offers": offersArr});
	}

	return returnArr;
}

exports.updateOffer = function * (offer_id, params) {
	return knex(OFFER_TABLE).where('id', '=', offer_id).update(params);
}

exports.deleteSingleOffer = function(id) {
	return knex(OFFER_TABLE).where('id', '=', id).update({is_deleted: true});
}

exports.getSingleOffer = function(id) {
	return knex(OFFER_TABLE).select('id').where('id', id).first();
}

exports.getOffer = function(id) {
	return knex(OFFER_TABLE).where('id', id).first();
}

exports.getOffersByRequest = function(request_ids) {
	var returnArr = [];
	var offersArr = [];
	
	for (var i = request_ids.length - 1; i >= 0; i--) {
		offersArr = knex(OFFER_TABLE).select().where('request_id', request_ids[i].id).andWhere('is_deleted', false);
		returnArr.push({"request": request_ids[i], "offers": offersArr});
	}

	return returnArr;
}

exports.getOffersByRequestAndCompany = function(request_ids, company_id) {
	var returnArr = [];
	var offersArr = [];
	
	for (var i = request_ids.length - 1; i >= 0; i--) {
		offersArr = knex(OFFER_TABLE).select().where('request_id', request_ids[i].id)
						.andWhere('company_id', company_id).andWhere('is_deleted', false);
		returnArr.push({"request": request_ids[i], "offers": offersArr});
	}

	return returnArr;
}

exports.getOffersByRequestAndCompanyUnit = function(request_ids, company_id, unit_id) {
	var returnArr = [];
	var offersArr = [];
	
	for (var i = request_ids.length - 1; i >= 0; i--) {
		offersArr = knex(OFFER_TABLE).select().where('request_id', request_ids[i].id)
						.andWhere('company_id', company_id).andWhere('unit_id', unit_id)
						.andWhere('is_deleted', false);
		returnArr.push({"request": request_ids[i], "offers": offersArr});
	}

	return returnArr;
}

exports.getOffersByRequestAndCompanyUnitAndOfferStatus = function(request_ids, company_id, unit_id, offer_accepted) {
	var returnArr = [];
	var offersArr = [];
	
	for (var i = request_ids.length - 1; i >= 0; i--) {
		offersArr = knex(OFFER_TABLE).select().where('request_id', request_ids[i].id)
						.andWhere('company_id', company_id).andWhere('unit_id', unit_id)
						.andWhere('offer_accepted', offer_accepted).andWhere('is_deleted', false);
		returnArr.push({"request": request_ids[i], "offers": offersArr});
	}

	return returnArr;
}

exports.getOffersByCompanyAndOfferStatus = function(company_id, offer_accepted) {
	return knex(OFFER_TABLE).select().where('company_id', company_id)
			.andWhere('offer_accepted', offer_accepted).andWhere('is_deleted', false);
}

exports.getOffersByCompanyUnitAndOfferStatus = function(company_id, unit_id, offer_accepted) {
	return knex(OFFER_TABLE).select().where('company_id', company_id)
			.andWhere('unit_id', unit_id).andWhere('offer_accepted', offer_accepted)
			.andWhere('is_deleted', false);
}

exports.getOffersByCompanyAndContractStatus = function(company_id, contract_approved) {
	return knex(OFFER_TABLE).select().where('company_id', company_id).andWhere('contract_approved', contract_approved);
}

exports.getOffersByCompanyUnitAndContractStatus = function(company_id, unit_id, contract_approved) {
	return knex(OFFER_TABLE).select().where('company_id', company_id)
			.andWhere('unit_id', unit_id).andWhere('contract_approved', contract_approved);
}
