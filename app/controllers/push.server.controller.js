var config = require('../../config/config');
var admin = require("firebase-admin");
var FCM = require('fcm-node');
var gcm = require('node-gcm');
var request = require('requestretry');

var moltin = require('./moltin.server.controller');
var OrderHistory = require('../models/orderhistory.server.model');
var timestamp = require('../utils/timestamp');
var debug = require('debug')('push');
var logger = require('winston');

var deviceInfo = {};

const ORDER = '/orders';
const ORDER_CREATED = 'ORDER_CREATED';
const ORDER_ACCEPTED_STATUS = 'ORDER_ACCEPTED_STATUS';
const ORDER_REQUESTED = 'order_requested';


// var serviceAccount = require("../../config/SFEZ-113af0fa7076.json");
var serviceAccount = require("../../app/controllers/instamarkt-1592284680809-firebase-adminsdk-z8gp7-c823b86d8c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sfez-17981.firebaseio.com/"
});

function *sendRequest(authKey, url, method, data) {
  debug('sendRequest');
  debug(data);
  var meta = {fn: 'sendRequest', user_id: this.passport.user.id, role : this.passport.user.role, url: url, method: method};
  logger.info('Starting request', meta);
  return new Promise(function(resolve, reject) {
    request({
      method: method,
      url: url,
      json: data,
      headers: {
        'Authorization': 'key= '+ config.gcmServerKey,
		'Content-Type': 'application/json'
      },
      maxAttempts: 3,
      retryDelay: 150,  // wait for 150 ms before trying again
    })
    .then( function (res) {
      debug('status code '+ res.statusCode)
      debug('sendRequest: parsing...')
      debug(res.body)
      if (res.statusCode == 401 ) { // Unauthorized
		  var unauth = 'User not authorized';
		  meta.error = unauth;
		  logger.error('Error sending request - unauthorized.', meta);
          reject(new Error('Unauthorized'));
		  return;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        debug('..call successful');
        var payload = res.body.results;
        debug(payload);
		if (payload[0].status == 'OK') {
			debug('Status OK');
			var gcmId = payload[0].registration_token;
			debug(gcmId);
			resolve (gcmId);
			return;
		} else { // status indicates failure
			debug('..received failure');
			var statErr = "Google import API indicated: "+ payload[0].status;
			debug('Status '+ statErr);
			meta.error = statErr;
			logger.error('Error returned from APNS-GCM request', meta);
            reject(new Error(statErr));
			return;
		}
      } else { // something went wrong
        debug('..something went wrong with call');
        var errors = res.body;
		meta.error = errors;
        logger.error('Error returned from APNS-GCM request', meta);
        debug(errors);
        reject(new Error(errors));
		return;
      }
    })
    .catch( function (err) {
		meta.error = err;
		logger.error('Error sending APNS-GCM request', meta);
      	reject (err);
    });
  });
}

exports.importAPNS = function *( apns ) {
  	logger.info('Sending APNS to GCM', {fn: 'importAPNS', 
	user_id: this.passport.user.id, role : this.passport.user.role, apns_id: apns});
	var gcmId = '';
	var authKey = 'key='+ config.gcmServerKey;
	var gcmUrl = "https://iid.googleapis.com/iid/v1:batchImport";
	var data =
		{
			application : "com.streetfoodez.sfez", 
			sandbox :true,
			apns_tokens: [ apns ]
		};
	try {
		gcmId = yield sendRequest.call(this, authKey, gcmUrl, 'POST', data);
	} catch (err) {
		debug(err);
		logger.error('Error sending APNS token to GCM', 
			{fn: 'importAPNS', user_id: this.passport.user.id, 
			role: this.passport.user.role, error: err});
		throw err;
	}
	debug('Got gcm id '+ gcmId);
	return gcmId;
}


var setOrderStatusMessage = function(orderId, msgTarget) {

	var title = msgTarget.title;
	var status = msgTarget.status;
	var message = msgTarget.message;
	var body = msgTarget.body;
	var data = msgTarget.data; 
	var os = msgTarget.os;

	// Removing the below notification format (Titanium/GCM/FCM)
	
	if (!data) data = {};
	data.message = message;
	data.title = title;
	data.status = status;

	if (status == 'order_requested') {
		note = {
			"notification" : {
				"body" : body,
				"title" : title
			},
			"data" : data
		};
	} else {
		note = {
			"notification" : {
				"body" : body,
				"title" : title
			},
			"data" : data
		}
	}; 

	var note = '';
	
	if (msgTarget.os == 'ios') {

		note = {
			aps: {
				alert: message,
				badge: "+2",
				sound: "door_bell"
			},
			title: title,
			icon: "little_star",
			vibrate: true,
			status: status

		};

	} else { // assume android so that something will go out

		// desired format
		/*
		note = {
			payload: {
				message: message,
				title: title,
				company_id: XXXX, // not available
				order_sys_order_id: YYYY, // not availabe here
				order_id: IIII, // not available here
				time_stamp: TTT,
				android: {
					alert: message,
					title: title,
					icon: "push",
					status: ZZZZ,
					company_id: XXXX, // not available here
					order_sys_order_id: YYYY, // not available here
					order_id: IIII, // not available here
					time_stamp: TTT
				}
			}
		}
		*/
		// Format using existing data in msgTarget
		var ts = timestamp.now();
		// note = {
		// 	payload: {
		// 		message: message,
		// 		title: title,
		// 		time_stamp: ts,
		// 		"data":"Hello hi from insta",
		// 		android: {
		// 			alert: message,
		// 			title: title,
		// 			icon: "push",
		// 			status: status,
		// 			time_stamp: ts
		// 		}
		// 	},
		// 	"notification" : {
		// 		"body" : body,
		// 		"title" : title
		// 	},
			
		// };
		var note = {
			data: {
			  dataValuesToGetWhenClickedOn: '111',
			},
			notification: {
				id: '4',
				title: 'Title test',
				text: 'Test message',
				smallIcon: 'drawable/icon',
				largeIcon: 'https://avatars2.githubusercontent.com/u/1174345?v=3&s=96',
				// autoCancel: true,
				// vibrate: [200,300,200,300],
				color: '0000ff',
				// headsUp: true,
				// sound: true
			  }
		  };
	}

	return note;
};

var sendFCMNotification = function (message) {
	// Send a message to the device corresponding to the provided
	// registration token.
	var payload = { notification: message.notification, data: message.data};
	debug(payload);
	return new Promise( function(resolve, reject) {
		admin.messaging().sendToDevice(message.to, payload)
		.then(function(response) {
			// See the MessagingDevicesResponse reference documentation for
			// the contents of response.
			debug('..sent message');
			console.log(response);
			var error = response.results[0].error;
			if (error) {
				console.error(error.errorInfo);
				reject(error.errorInfo.message);
			}
			resolve(response);
		})
		.catch(function(error) {
			console.error("Error sending message:");
			console.log(error);
			reject(error);
		});
	});
}

var sendGCMNotification = function (message){
	debug('sendGCMNotification');
	return new Promise( function(resolve, reject) {
		if (message) {
			var  gcmMsg = new gcm.Message();
			gcmMsg.addData(message.data);
			gcmMsg.addNotification(message.notification)
			debug(gcmMsg)
			var regtokens = [message.to];
			debug(regtokens)
			var sender = new gcm.Sender(config.gcmServerKey);
			debug(sender);
			debug('..sending');
			console.log('Sending GCM notification...');
			sender.send(gcmMsg, {registrationTokens : regtokens}, function (err, response) {
				debug('..returned from call to Google')
				if(err) {
					console.error(err);
					reject(err);
				} else {
					console.log('GCM notification sent');
					console.log(response);
					resolve(response);
				}
			})
		} else {
			reject(new Error('Empty message or sender. GCM notification not sent'));	
		}
	})
}

exports.notifyOrderUpdated = function *(orderId, msgTarget){
	debug('notifyOrderUpdated');
	var msg = setOrderStatusMessage(orderId, msgTarget);
	debug(msg);
	debug('..sending notification..');
	var notified = {};
	var fcmRes = '';
	if (msgTarget.fcmId) {
		debug('...to fcm id');
		console.log('Sending FCM notification...');
		msg.to = msgTarget.fcmId;
		try {
			fcmRes = yield sendFCMNotification(msg);
		} catch (err) {
			// failed notification is not a showstopper
			notified.fcm = false;
			console.error(err);
		}
		debug('...response')
		debug(fcmRes)
		if (fcmRes && fcmRes.success > 0 && fmcRes.failure == 0) {
			notified.fcm = true;
		}
	} else console.log('No fcm id - no fcm notification sent to '+ msgTarget.to +' '+ msgTarget.toId)
	if (msgTarget.gcmId) {
		debug('...to gcm id');
		msg.to = msgTarget.gcmId;
		var gcmRes = '';
		try {
			gcmRes = yield sendGCMNotification(msg);
		} catch (err) {
			//failed notificaiton is not a showstopper
			notified.gcm = false;
			console.error(err);
		}
		debug('...response');
		debug(gcmRes);
		if (gcmRes && gcmRes.success > 0 && fcmRes.failure == 0) {
			notified.gcm = true;
		}
		debug('...done with notifications attempts')
	} else console.log('No gcm id - no gcm notification sent to '+ msgTarget.to +' '+ msgTarget.toId)
	return notified;
}


exports.testnotifyUpdated = function *(){
	debug('notifyOrderUpdated');
	let {orderId,msgTarget } = this.body;
	var msg = setOrderStatusMessage(orderId, msgTarget);
	debug(msg);
	debug('..sending notification..');
	var notified = {};
	var fcmRes = '';
	if (msgTarget.fcmId) {
		debug('...to fcm id');
		console.log('Sending FCM notification...');
		msg.to = msgTarget.fcmId;
		try {
			fcmRes = yield sendFCMNotification(msg);
			console.log({fcmRes})
		} catch (err) {
			// failed notification is not a showstopper
			notified.fcm = false;
			console.error(err);
		}
		debug('...response')
		debug(fcmRes)
		if (fcmRes && fcmRes.success > 0 && fmcRes.failure == 0) {
			notified.fcm = true;
		}
	} else console.log('No fcm id - no fcm notification sent to '+ msgTarget.to +' '+ msgTarget.toId)
	if (msgTarget.gcmId) {
		debug('...to gcm id');
		msg.to = msgTarget.gcmId;
		var gcmRes = '';
		try {
			gcmRes = yield sendGCMNotification(msg);
		} catch (err) {
			//failed notificaiton is not a showstopper
			notified.gcm = false;
			console.error(err);
		}
		debug('...response');
		debug(gcmRes);
		if (gcmRes && gcmRes.success > 0 && fcmRes.failure == 0) {
			notified.gcm = true;
		}
		debug('...done with notifications attempts')
	} else console.log('No gcm id - no gcm notification sent to '+ msgTarget.to +' '+ msgTarget.toId)
	return notified;
}