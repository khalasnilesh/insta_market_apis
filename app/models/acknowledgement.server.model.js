var knex   = require('../../config/knex');
var logger = require('winston');



function isNumber (o) {
  return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}


exports.createOrUpdateAck = function*(hash) {
  logger.info("createOrUpdateAck model");
  var order_id = hash.order_id;
  if (isNumber(order_id)) {
    logger.info(hash);
    var ackForIdCount = yield(knex.raw('select count(order_id) from order_state where order_id = ' + order_id));

    // (yield knex('order_state').count('order_id').where('order_id', order_id))[0];
    logger.info("Count: " + ackForIdCount);
    logger.info(ackForIdCount);
    logger.info(ackForIdCount.rows);
    var count = ackForIdCount.rows.count;
    if (count === 0 || count === '0') {
      logger.info('inserting');
      return knex('order_state').returning('*').insert(hash);
    }
    else {
      logger.info('updating');
      return knex('order_state').update(hash).where('order_id', order_id).returning('*');
    }
  }
};