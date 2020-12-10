/**
 * @author Sávio Muniz
 */

var Users = require('../models/user.server.model');
var Customers = require('../models/customer.server.model');
var Company = require('../models/company.server.model');
var QueryHelper = require('../utils/query-helper')
var logger = require('winston');
const request = require('request-promise');

exports.getUsersByCustomId = function* (next) {
  var jsonQuery = QueryHelper.getJsonQuery('custom_id', this.query);

  var users = yield Users.getByCustomId(jsonQuery);
  this.status = 200;
  this.body = users;
};

exports.getUser = function* (next) {
  var user = (yield Users.getSingleUser(this.params.userId))[0];

  if (user.role === 'CUSTOMER') {
    var customer = (yield Customers.getForUser(user.id))[0];
    user.customer_id = customer.id;
  }

  this.status = 200;
  this.body = {data:user,status:200,message:'get user'};
  return;
};

exports.modifyUser = function* (next) {
  if(this.body.latitude && this.body.longitude){
  var user = (yield Users.getSingleUser(this.params.userId))[0];
  var apikey = '07575882452c47d09baf188e72e1bba5';
  if (user.role === 'CUSTOMER' || user.role === 'ADMIN') {
    try {
      var response = yield request.get(`https://api.opencagedata.com/geocode/v1/json?q=${this.body.latitude}+${this.body.longitude}&key=${apikey}`);
      var data = JSON.parse(response);
      var city = data.results[0].components.city;
      var customer = (yield Customers.modifyCustomer(user.id, this.body.phone, this.body.room, city));
      this.status = 200;
      this.body = { message: 'Request updated.', data: customer,status:200 };
    } catch (error) {
      logger.error('Error updating request.');
      this.status = 500; // Internal Server Error - Operation Failed
      this.body = { message: 'Error updating the request.',status:500 };
      return;
      // throw (error);
    }
  }else{
    this.status = 400; // Internal Server Error - Operation Failed
    this.body = { status:400,message: 'Please send required parameters.' };
    return;
  }
  }

  if(user.role === 'OWNER'){
    var customer = (yield Company.updateCompany(user.id, this.body.google_api_key, this.body.google_sheet_url, this.body.google_sheet_tab_name));
      this.status = 200;
      this.body = { message: 'Request updated.', data: customer,status:200 };
  }
}

exports.checkProfile = function* () {
  try {
    var user = (yield Users.getSingleUser(this.params.userId))[0];
    if (user) {
      if (user.phone && user.state && user.zip && user.username) {
        this.status = 200;
        this.body = { status: 200, message: "Profile is updated", data: user }
        return;
      } else {
        this.status = 404
        this.body = { status: 404, message: "Profile is not updated", data: user };
        return;
      }
    } else {
      this.status = 404;
      this.body = { status: 404, message: "User not found!" };
      return;
    }

  } catch (error) {
    this.status = 400;
    this.body = { status: 200, message: "Something went wrong" };
    return;
  }
}


exports.updateProfile = function* () {
  try {
    var user = (yield Users.getSingleUser(this.params.userId))[0];
    if (user) {
      var apikey = '07575882452c47d09baf188e72e1bba5';
    if(this.body.latitude){
      var response = yield request.get(`https://api.opencagedata.com/geocode/v1/json?q=${this.body.latitude}${this.body.longitude}&key=${apikey}`);
      var data = JSON.parse(response);
      var city = data.results[0].components.city;
      var state = data.results[0].components.state_code;
    }
      let body = {
        zip: this.body.zip ? this.body.zip : user.zip,
        phone: this.body.phone ? this.body.phone : user.phone,
        username: this.body.username ? this.body.username : user.username,
        first_name: this.body.first_name ? this.body.first_name : user.first_name,
        last_name: this.body.last_name ? this.body.last_name : user.last_name,
        state_id: this.body.state_id ? this.body.state_id : user.state_id,
        city: this.body.city ? city : user.city,
        country_id: this.body.country_id ? this.body.country_id : user.country_id,
        image: this.body.image ? this.body.image : user.image,
        telegram_id: this.body.telegram_id ? this.body.telegram_id : user.telegram_id,
        state : state ? state : user.state
      };
      let update = yield Users.updateProfile(this.params.userId, body);
      if (update) {
        this.body = { status: 200, message: "Profile updated", data: update };
        return;
      }
    } else {
      this.status = 404;
      this.body = { status: 404, message: "User not found!" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 200, message: "Something went wrong" };
    return;
  }
}

exports.createGroup = function* () {
  try {
    let ids = this.body.participant_id.split(',');
    let body = {
      initiator_id: this.body.initiator_id,
      participant_id: ids,
      group_name: this.body.group_name
    };
    let group = (yield Users.createGroup(body))[0];
    let arr = [];
    for (let it of group.participant_id) {
      let user = (yield Users.getSingleUser(it))[0];
      if (user) {
        arr.push({ first_name: user.first_name, last_name: user.last_name, id: it });
      } else {
        arr.push({ first_name: "test", last_name: "test", id: it });
      }
    }
    group.participant_id = arr;
    this.body = { status: 200, message: "Group created", data: group };
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

exports.getGroup = function* () {
  try {
    let getGroup = yield Users.getGroup(this.params.initiator_id);
    if (getGroup.length) {
      for(let item of getGroup){
        let arr = [];
        for(let it of item.participant_id){
          let user = (yield Users.getSingleUser(it))[0];
          if(user){
            arr.push({ first_name: user.first_name, last_name: user.last_name,id:it});
          }else{
            arr.push({ first_name: "test", last_name: "test",id:it});
          }
        }
        item.participant_id = arr;
      }
      this.body = { status: 200, message: "Group fetched", data: getGroup };
      return;
    } else {
      this.body = { status: 404, message: "No group found with this user" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

exports.deleteGroup = function* () {
  try {
    let getGroup = yield Users.getGroup(this.body.initiator_id);
    if (getGroup.length) {
      let group= yield Users.deleteGroup(this.body.id);
      if(group){
        this.body = { status: 200, message: "Group deleted"};
        return;
      }
    } else {
      this.body = { status: 404, message: "No group found with this user" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
};

exports.updateGroup = function* () {
  try {
    let getGroup = (yield Users.getGroupbyId(this.params.id))[0];
    if (getGroup) {
      let ids = this.body.participant_id.split(',');
      let body = {
        participant_id: ids,
        group_name: this.body.group_name
      }
      let update = yield Users.updateGroup(body, this.params.id);
      let Group = (yield Users.getGroupbyId(this.params.id))[0];
      let arr = [];
        for(let it of Group.participant_id){
          let user = (yield Users.getSingleUser(it))[0];
          if(user){
            arr.push({ first_name: user.first_name, last_name: user.last_name,id:it});
          }else{
            arr.push({ first_name: "test", last_name: "test",id:it});
          }
        }
        Group.participant_id = arr;
      this.body = { status: 200, message: "Group updated", data: Group };
      return;
    } else {
      this.body = { status: 404, message: "No group found with this user" };
      return;
    }
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}


//-------------------------telegram bot api-------------------------------------------------

exports.createSupportGroup = function* () {
  try {
    let group = yield supportGroup(this.body);
    let savechat = yield Company.setchat(group.chat_invite, this.params.companyId);
      this.body = { status: 200, message: "support group created", data: group };
      return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

supportGroup = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "http://localhost:3000/createSupportGroup",
      headers: {
        'content-type': 'application/json',
      },
      body: {
        "name": data.group_name
      },
      json: true
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
};

exports.createTelegramGroup = function* () {
  try {
    let group = yield createtelegramGroup(this.body);
    this.body = { status: 200, message: "group created", data: group };
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

createtelegramGroup = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "http://localhost:3000/createGroup",
      headers: {
        'content-type': 'application/json',
      },
      body: {
        "name": data.group_name
      },
      json: true
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
};


exports.createTelegramInvite = function* () {
  try {
    let group = yield createtelegramInvite(this.body);
    this.body = { status: 200, message: "invite created", data: group };
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

createtelegramInvite = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "http://localhost:3000/createInvite",
      headers: {
        'content-type': 'application/json',
      },
      body: {
        "chat_id": data.chat_id
      },
      json: true
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
};


exports.addMemberTelegram = function* () {
  try {
    let group = yield addmembertelegram(this.body);
    this.body = { status: 200, message: "invite created", data: group };
    return;
  } catch (error) {
    this.status = 400;
    this.body = { status: 400, message: "Something went wrong" };
    return;
  }
}

addmembertelegram = function (data) {
  return new Promise((resolve, reject) => {
    request.post({
      url: "http://localhost:3000/addUsersToGroup",
      headers: {
        'content-type': 'application/json',
      },
      body: {
        "chat_id": data.chat_id,
        "user_ids": data.user_ids
      },
      json: true
    }, (err, res, body) => {
      if (!err) {
        console.log('i came here:::', body)
        resolve(body)
      }
      else {
        console.log("error", err)
        reject(err)
      }
    })
  })
};