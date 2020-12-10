/**
 * @author Sávio Muniz
 */

const User = require('../models/user.server.model');

function handle(context, user) {
  if (context === 'hotel')
    return handleHotel(user);
  else if (context === 'cod')
    return null;
  else if (context === 'prepay')
    return null;
  else
    throw new Error('Invalid context', 422);
}

function handleHotel(user) {
  if (user.custom_id && user.custom_id.room) {
    var roomNumber = user.custom_id.room['number'];
  }

  else
    throw new Error('User is not in hotel context', 422);

  return {bill_to_room : roomNumber};
}

module.exports = handle;
