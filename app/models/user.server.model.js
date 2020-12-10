var crypto = require('crypto');
var knex   = require('../../config/knex');
var debug  = require('debug')('user.model');
var logger = require('winston');


function encrypt(password) {
  var md5 = crypto.createHash('md5');
  md5 = md5.update(password).digest('hex');

  return md5;
}

exports.getmanagers = function* (id) {
  return knex('users').select('*').where('manager_id', id);
}

exports.encryptPassword = function (password) {
  return encrypt(password);
}

exports.listusers = function(role){
  return knex('users').select('*').where('role',role);
}

exports.userForUsername = function(username) {
  return knex('users').select('*').where('username', 'ILIKE', username)
};

/* Used for LocalStrategy login */
exports.getUserByUsername = function(username, callback) {
  debug('user model: get user by '+ username)
  return knex('users').select('*').where('username', 'ILIKE', username).asCallback(callback)
};

exports.getAllUsers = function() {
  return knex('users').select()
};

exports.getSingleUser = function(id) {
  return knex('users').select().where('id', id);
};

exports.createUser = function(hash) {
  hash.password = encrypt(hash.password);
  return knex('users').insert(hash).returning('*');
};

exports.updateUser = function(id, hash) {
  debug('updateUser');
  if (hash.password) hash.password = encrypt(hash.password);
  debug(hash);
  return knex('users').update(hash).where('id',id).returning('*');
};

exports.updateUserByIds = function(ids, hash) {
  debug('updateUser');
  if (hash.password) hash.password = encrypt(hash.password);
  debug(hash);
  return knex('users').update(hash).whereIn('id', ids).returning('*');
};

exports.createOrUpdateUser = function(hash) {
  debug('createOrUpdateUser');
  var userId = hash.id;
  debug(hash);
  if (userId) {
    debug('..update user');
    return this.updateUser(userId, hash)
  }
  debug('..create user');
  return this.createUser(hash)
}

exports.deleteUser = function(id) {
  return knex('users').where('id', id).del();
}

exports.authenticate = function(md5password, password) {
  var md5 = encrypt(password)

  return md5password === md5;
};

exports.getFBID = function(id) {
  logger.info('getting fbid for ' + id);
  return knex.select('fbid').from('users').leftJoin('customers', 'users.id', 'customers.user_id').where('customers.id',id).returning('*');
}

exports.getUserIdForUnitMgrByUnitId = function(id) {
  logger.info('getting fbid for ' + id);
  return knex.select('fbid').from('users').leftJoin('units', 'users.id', 'units.unit_mgr_id').where('units.id',id).returning('*');
}

exports.updateFB = function(id, fbid, fb_token) {
  logger.info(id + ',' + fbid + ',' + fb_token);
  return knex('users').update({fbid: fbid, fb_token: fb_token}).where('id', id).returning('*');
};

exports.updateProfile =function(id,hash){
  return knex('users').update(hash).where('id',id).returning('*');
}

exports.updateGoogle = function(id, googleid, google_token) {
  logger.info(id + ',' + googleid + ',' + google_token);
  return knex('users').update({googleid: googleid, google_token: google_token}).where('id', id).returning('*');
};

exports.findByFB = function(fbid) {
  logger.info(fbid);
  return knex('users').select('*').where('fbid', fbid);
};

exports.findByGoogle = function(googleid){
  logger.info(googleid);
  return knex('users').select('*').where('googleid', googleid);
}

exports.getByCustomId = function (jsonQuery) {
  return knex('users').select('*').whereRaw(jsonQuery);
}

exports.getUserByCustomerId = function (customerId) {
  return knex('users').join('customers', 'customers.user_id', 'users.id').select('users.*').where('customers.id', customerId).first();
}

exports.createGroup =function(data){
  return knex('users_groups').insert(data).returning('*');
}

exports.getGroup =function(id){
  return knex('users_groups').where('initiator_id',id).returning('*');
}

exports.deleteGroup =function(id){
  return knex('users_groups').where('id',id).del();
}

exports.getGroupbyId =function(id){
  return knex('users_groups').where('id',id).returning('*');
}

exports.updateGroup =function(data,id){
  return knex('users_groups').update(data).where('id',id);
}

exports.updatepayor =function(data,id){
  return knex('users').update({'green_money_payor_id':data}).where('id',id);
}