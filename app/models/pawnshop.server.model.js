var knex = require('../../config/knex');
// var debug = require('debug')('events.model');

const REQUEST_TABLE = "requests";
const OFFER_TABLE = "offers";
const CUSTOMER_TABLE = "customers";
const COMPANY_TABLE = "companies";
const CONTRACT_TABLE = "contracts";
const TERRITORY_TABLE = "territories";
const UNITS_TABLE = "units";

exports.getPawnPoc = function(unit_id){
	return knex(UNITS_TABLE).select('username').where('id', unit_id).first();
}

exports.getPawnShopListByCoordinates = function * (lat, long) {
	var pawnShopList = knex('units').join('food_parks', 'units.food_park_id', 'food_parks.id')
		.select('units.*', 'food_parks.latitude', 'food_parks.longitude')
		.where('units.type', 'PAWN')
		.andWhere('food_parks.latitude', '<', lat[0])
		.andWhere('food_parks.latitude', '>', lat[1])
		.andWhere('food_parks.longitude', '<', long[0])
		.andWhere('food_parks.longitude', '>', long[1]);
	return pawnShopList;
}

exports.createContract = function (request) {
	var params = {
					company_id: request[0],
					unit_id: request[1],
					customer_id: request[2],
					offer_id: request[3],
					request_name: request[4],
					request_photo: request[5],
					cash_offer: request[6],
					buy_back_amount: request[7],
					tax_amount: request[8],
					term_months: request[9],
					qr_code: request[10]
				};
	return knex(CONTRACT_TABLE).insert(params).returning('*');
}

exports.getSingleCustomer = function(id) {
	return knex(CUSTOMER_TABLE).select('id').where('id', id).first();
}

exports.getSingleCompany = function(id){
	return knex(COMPANY_TABLE).select('*').where('id', id).first();
}

exports.getSingleContract = function(id) {
	return knex(CONTRACT_TABLE).select('*').where('id', id);
}

exports.getSingleContractId = function(id) {
	return knex(CONTRACT_TABLE).select('id').where('id', id);
}

exports.getSingleContractByQrCode = function(qr_code) {
	return knex(CONTRACT_TABLE).select('*').where('qr_code', qr_code);
}

exports.getContractsByCustomer = function(id) {
	return knex(CONTRACT_TABLE).select('*').where('customer_id', id);
}

exports.getContractsByCompany = function(id, offer_approved) {
	if(offer_approved) return knex(CONTRACT_TABLE).select('*').where({'company_id': id, 'offer_approved': true});
	else return knex(CONTRACT_TABLE).select('*').where('company_id', id);
}

exports.checkContractOfferFlag = function(id) {
	return knex(CONTRACT_TABLE).select('*').where({'id': id, 'offer_approved': false});
}

exports.deleteSingleContract = function(id) {
	return knex(CONTRACT_TABLE).where('id', '=', id).update({is_deleted: true});
}

exports.getCountByContext = function(params) {
    var splitId = params[0].substring(0, params[0].length-1) + "_id";
	return knex(params[2]).count(params[2]+'.id').join(params[0], params[0]+'.id', params[2]+"."+splitId).where(params[0]+".id", params[1]);
}

exports.getQRCode = function (qrcode) {
  	return knex(CONTRACT_TABLE).select('id').where('qr_code', qrcode);
};
