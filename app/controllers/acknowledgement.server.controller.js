var ack = require('../models/acknowledgement.server.model');

exports.createOrUpdateAck = function*() {
  var order_requested_step = (this.body.order_requested_step === 'true');
  var order_accepted_step = (this.body.order_accepted_step === 'true');
  var order_pay_fail = (this.body.order_pay_fail === 'true');
  var order_paid_step = (this.body.order_paid_step === 'true');
  var order_in_queue_step = (this.body.order_in_queue_step === 'true');
  var order_cooking_step = (this.body.order_cooking_step === 'true');
  var order_ready_step = (this.body.order_ready_step === 'true');
  var order_dispatched_step = (this.body.order_dispatched_step === 'true');
  var order_picked_up_step = (this.body.order_picked_up_step === 'true');
  var order_no_show_step = (this.body.order_no_show_step === 'true');
  var order_delivered_step = (this.body.order_delivered_step === 'true');
  var order_id = this.body.order_id;
  var apiCall = this.body.apiCall;
  var paramString = this.body.paramString;
  var errorInfo = this.body.errorInfo;
  var callInfo = this.body.callInfo;

  var hash = {};

  if (typeof order_id != 'undefined') { hash.order_id = order_id; }
  if (typeof order_requested_step != 'undefined') { hash.order_requested_step = order_requested_step; }
  if (typeof order_accepted_step != 'undefined') { hash.order_accepted_step = order_accepted_step; }
  if (typeof order_pay_fail != 'undefined') { hash.order_pay_fail = order_pay_fail; }
  if (typeof order_paid_step != 'undefined') { hash.order_paid_step = order_paid_step; }
  if (typeof order_in_queue_step != 'undefined') { hash.order_in_queue_step = order_in_queue_step; }
  if (typeof order_cooking_step != 'undefined') { hash.order_cooking_step = order_cooking_step; }
  if (typeof order_ready_step != 'undefined') { hash.order_ready_step = order_ready_step; }
  if (typeof order_dispatched_step != 'undefined') { hash.order_dispatched_step = order_dispatched_step; }
  if (typeof order_picked_up_step != 'undefined') { hash.order_picked_up_step = order_picked_up_step; }
  if (typeof order_no_show_step != 'undefined') { hash.order_no_show_step = order_no_show_step; }
  if (typeof order_delivered_step != 'undefined') { hash.order_delivered_step = order_delivered_step; }
  if (apiCall) { hash.apicall = apiCall; }
  if (paramString) { hash.paramstring = paramString; }
  if (errorInfo) { hash.errorinfo = errorInfo; }
  if (callInfo) { hash.callinfo = callInfo; }

  yield ack.createOrUpdateAck(hash);

};