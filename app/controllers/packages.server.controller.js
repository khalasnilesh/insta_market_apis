/**
 * @author Sávio Muniz
 */

var ParseUtils = require('../utils/parseutils');

var Packages = require('../models/packages.server.model');
var PrePay = require('../controllers/prepay.server.controller');
var Users = require('../models/user.server.model');

var Companies = require('../models/company.server.model');
var Units = require('../models/unit.server.model');
var Foodpark = require('../models/foodpark.server.model');

exports.createPackage = createPackage;
exports.getPackage = getPackage;
exports.getCompanyPackages = getCompanyPackages;
exports.givePackage = givePackage;
exports.redeemPackage = redeemPackage;
exports.redeemMultiplePackages = redeemMultiplePackages;
exports.getUserGiftedPackages = getUserGiftedPackages;
exports.updatePackage = updatePackage;
exports.deletePackageGiven = deletePackageGiven;
exports.getCompanyGiftedPackages = getCompanyGiftedPackages;
exports.registerManualRedeem = registerManualRedeem;
exports.manualRedeemPackage = manualRedeemPackage;
exports.givePackageAux = givePackageAux;

const PACKAGE_NUMBER_OF_DIGITS = 15;

function * redeemMultiplePackages() {
  try {
    var packageCodes = this.body.package_codes;

    var updateResult = yield updateRedeemedPackages(packageCodes, this.passport.user);

    this.status = updateResult.status;
    this.body = { message : updateResult.message, data : updateResult.data};
  } catch (err) {
    console.error("Error while updating multiple packages");
    throw err;
  }
}

function * updateRedeemedPackages (packageCodes, loggedUser) {
  var updateResult = {
    success : true
  };

  if (!packageCodes) {
    updateResult.status = 400;
    updateResult.message = { error : "You must provide a 'package_codes' field"};
  }

  if (!packageCodes.forEach) {
    updateResult.status = 400;
    updateResult.message = { error : "Input for 'package_codes' must be an array"};
  }

  var retrievePackagePromises = [];
  var packagesGiven = [];

  packageCodes.forEach(function (qrcode) {
    retrievePackagePromises.push(Packages.getQRCodeGivenPackage(qrcode));
  });

  var resolvePromises = Promise.all(retrievePackagePromises).then(function (retrievedPackages) {
    retrievedPackages.forEach(function (result) {
      packagesGiven.push(result.rows[0])
    });

    return packagesGiven;
  });

  yield resolvePromises;

  var updatePromises = [];
  var transactionPromises = [];

  packagesGiven.some(function (packageGiven, index) {
    if (!packageGiven) {
      updateResult.success = false;
      updateResult.status = 404;
      updateResult.message = { error : `Package '${packageCodes[index]}' does not exist`};
      return true;
    }

    else if (packageGiven.quantity < 1) {
      updateResult.success = false;
      updateResult.status = 404;
      updateResult.message = { error : `Package '${packageCodes[index]}' is not available for this user anymore (quantity < 1)`};
      return true;
    }

    else {
      packageGiven.quantity--;

      updatePromises.push(Packages.updateGivenPackage(packageGiven.gifted_user, packageGiven.package_id, packageGiven.quantity));
      transactionPromises.push(PrePay.getPrepayTransactionPromise(packageGiven.id, 'package'));
    }
  });


  if (!(yield checkCompanyMatch(packagesGiven, loggedUser))) {
    updateResult.success = false;
    updateResult.status = 401;
    updateResult.message = { error : 'One or more packages does not match company'};
  }

  if (!updateResult.success) {
    return updateResult;
  }

  resolvePromises = Promise.all(updatePromises).then(function (updates) {
    return updates;
  });

  yield resolvePromises;

  resolvePromises = Promise.all(transactionPromises).then(function (transactions) {
    return transactions;
  });

  yield resolvePromises;

  updateResult.status = 200;
  updateResult.message = "Packages sucessfully redeemed";
  updateResult.data = packagesGiven;
  return updateResult;
}

function * checkCompanyMatch(packagesGiven, user) {
  var possibleCompanyMatches = [];

  var result = null;

  if (user.role === 'OWNER') {
    result = Companies.companyForUser(user.id).then(function (company) {
      possibleCompanyMatches.push(company[0].id);
    });
    yield result;
  }

  else if (user.role === 'UNITMGR') {
    result = Units.getForUser(user.id).then(function (unit) {
      possibleCompanyMatches.push(unit[0].company_id);
    });

    yield result;
  }
  
  else {
    result = Foodpark.getManagedUnits(user.id).then(function (units) {
      units.rows.forEach(function (unit) {
        possibleCompanyMatches.push((unit.company_id));
      });
    });

    yield result;
  }
  
  return packagesGiven.every(function (packageGiven) {
    return possibleCompanyMatches.indexOf(packageGiven.company_id) !== -1;
  });
}

function * getCompanyPackages() {
  try {
    var itemPackages = yield Packages.getCompanyPackages(this.params.companyId);

    this.status = 200;
    this.body = itemPackages;
  } catch (err) {
    console.error("error retrieving company's packages");
  }
}

function * updatePackage() {
  try {
    var body = this.body;

    var itemPackage = this.params.packageId;

    if (body.company) {
      this.status = 400;
      this.body = { error : "You cannot update a package's company"};
      return;
    }

    if (yield Packages.getActivePackageById(itemPackage) && !(body.hasOwnProperty('available') && body.available === false)) { //operation is already setting availability to false
      yield Packages.updatePackage({available : false}, itemPackage);
      var formerPackage = yield(Packages.getPackage(itemPackage));

      Object.keys(body).forEach(function (updatedField) {
        formerPackage[updatedField] = body[updatedField];
      });

      formerPackage.id = undefined;
      formerPackage.available = true;

      yield Packages.createPackage(formerPackage);

      this.status = 201;
      this.body = {message : "This package was still active, so another package was created with updated info, while former one was unactivated for future gifting"};
    }

    else {
      yield Packages.updatePackage(body, itemPackage);
      this.status = 200;
      this.body = {message : "Successfully updated"};
    }
  } catch (err) {
    console.error("error updating packages");
  }
}

function * getPackage() {
  try {
    var itemPackage = yield Packages.getPackage(this.params.packageId);

    if (!itemPackage) {
      this.status = 404;
      this.body = { error : 'package not found'};
      return;
    }

    this.status = 200;
    this.body = itemPackage;
  } catch (err) {
    console.error('error getting package');
    throw(err);
  }
}

function * createPackage() {
  var itemPackage = this.body;
  var userRole = this.passport.user.role;

  if (userRole !== 'FOODPARKMGR' && userRole !== 'OWNER' && userRole !== 'UNITMGR') {
    this.status = 401;
    return;
  }

  try {
    var createdPackage = yield Packages.createPackage(itemPackage);
    var response = { message : 'Package created successfully'};
    response.data = createdPackage;
    this.body = response;
    this.status = 201;
  } catch (err) {
    console.error('error creating package');
    throw(err);
  }
}

function * givePackageAux(quantity, itemPackage, giftedUser) {
  giftedUser = (yield Users.getSingleUser(giftedUser))[0];
  itemPackage = yield Packages.getPackage(itemPackage);

  if (giftedUser.role !== 'CUSTOMER') {
    this.status = 406;
    this.body = {error: "You can only give packages to a CUSTOMER user"};
    return;
  }

  if (!itemPackage) {
    this.status = 404;
    this.body = {error: "No such package"};
    return;
  }

  console.log(giftedUser)
  console.log(itemPackage)

  var givenPackage = yield Packages.getGivenPackage(giftedUser.id, itemPackage.id);

  console.log(givenPackage)

  if (!givenPackage) {
    var qrcode = undefined;

    while (!qrcode) {
      qrcode = ParseUtils.getRandomNumber(PACKAGE_NUMBER_OF_DIGITS);
      if (yield checkQRCodeExistence(qrcode))
        qrcode = undefined;
    }

    return yield Packages.createGivenPackage(giftedUser.id, itemPackage.id, quantity, qrcode);
  }

  givenPackage.quantity += quantity;

  return yield Packages.updateGivenPackage(giftedUser.id, itemPackage.id, givenPackage.quantity);
}
function * givePackage() {
  var giftedQuantity = this.body.quantity;
  var itemPackage = this.params.packageId;
  var giftedUser = this.params.userId;
  var creatorRole = this.passport.user.role;

  if (creatorRole !== 'FOODPARKMGR' && creatorRole !== 'OWNER' && creatorRole !== 'UNITMGR') {
    this.status = 401;
    this.body = {error: "Not an fpm/owner/unitmgr"};
    return;
  }

  var givenPackage = yield givePackageAux(giftedQuantity, itemPackage, giftedUser);
  this.status = 200;
  this.body = { message : "Package was given to user" };
  this.body.data = givenPackage;
}

function * checkQRCodeExistence(qrcode) {
  var packageGifted = (yield Packages.getQRCodeGivenPackage(qrcode)).rows[0];
  return packageGifted !== undefined ;
}

function * redeemPackage() {
  var user = this.passport.user;
  var givenPackage = undefined;

  if (this.params.qrcode) {
    givenPackage = (yield Packages.getQRCodeGivenPackage(this.params.qrcode)).rows[0];
  }

  else {
    var itemPackage = this.params.packageId;
    var giftedUser = this.params.userId;

    givenPackage = yield (Packages.getGivenPackage(giftedUser, itemPackage));
  }

  if (!givenPackage) {
    this.status = 404;
    this.body = { error : "No such package"};
    return;
  }

  if (givenPackage.quantity < 1) {
    this.status = 400;
    this.body = { error : "Package not available, quantity is 0"};
    return;
  }

  givenPackage.quantity--;

  var packageUpdated = yield Packages.updateGivenPackage(givenPackage.gifted_user, givenPackage.package_id, givenPackage.quantity);
  this.status = 200;
  this.body = { message : "Package successfully redeemed", data : givenPackage};
  this.body.data = givenPackage;

  yield PrePay.registerPrepayTransaction(givenPackage.id, 'package');
}

function * getUserGiftedPackages() {
  var giftedUser = Number(this.params.userId);
  var loggedUser = this.passport.user;

  if (loggedUser.id !== giftedUser) {
    this.status = 401;
    this.body = { error : "User queried does not match authorization"};
    return;
  }

  var givenPackages = yield Packages.getUserGiftedPackages(giftedUser);

  this.status = 200;
  this.body = givenPackages.rows;
}

function * deletePackageGiven() {
  var giftedUser = this.params.userId;
  var packageId = this.params.packageId;
  var userRole = this.passport.user.role;

  if (userRole !== 'FOODPARKMGR' && userRole !== 'OWNER' && userRole !== 'UNITMGR') {
    this.status = 401;
    this.body = {
      error : "Only fpm/owner/unitmgr can delete a package given to a user"
    };
    return;
  }

  var deletedPackage = yield Packages.deletePackageGiven(giftedUser, packageId);

  this.status = 202;
  this.body = {
    success : "Deleted package " + packageId + " activation for user " + giftedUser
  };
}

function * getCompanyGiftedPackages() {
  var company = this.params.companyId;
  var userRole = this.passport.user.role;

  if (userRole !== 'FOODPARKMGR' && userRole !== 'OWNER' && userRole !== 'UNITMGR') {
    this.status = 401;
    this.body = {
      error : "Only fpm/owner/unitmgr can delete a package given to a user"
    };
    return;
  }

  var packages = (yield Packages.getGiftedPackages(company)).rows;
  var packageOutput = [];
  var currentPackageId = null;

  packages.forEach(function (giftedPackage) {
    if (giftedPackage.id !== currentPackageId) {
      currentPackageId = giftedPackage.id;
      giftedPackage.gifted_users = [{id : giftedPackage.gifted_user, quantity : giftedPackage.quantity}];
      delete giftedPackage.gifted_user;
      delete giftedPackage.quantity;
      packageOutput.push(giftedPackage);
    }

    else
      packageOutput[packageOutput.length - 1].gifted_users.push({id : giftedPackage.gifted_user, quantity : giftedPackage.quantity});
  });

  this.body = packageOutput;
  this.status = 200;
}

function * registerManualRedeem () {
  try {
    var packageCodes = this.body.package_codes;

    if (!packageCodes) {
      this.status = 400;
      this.body = { error : "You must provide a 'package_codes' field"};
      return;
    }

    if (!packageCodes.forEach) {
      this.status = 400;
      this.body = { error : "Input for 'package_codes' must be an array"};
      return;
    }

    var retrievePackagePromises = [];
    var packagesGiven = [];

    packageCodes.forEach(function (qrcode) {
      retrievePackagePromises.push(Packages.getQRCodeGivenPackage(qrcode));
    });

    var resolvePromises = Promise.all(retrievePackagePromises).then(function (retrievedPackages) {
      retrievedPackages.forEach(function (result) {
        packagesGiven.push(result.rows[0])
      });

      return packagesGiven;
    });

    yield resolvePromises;

    var qrCodeExists = !packagesGiven.some(function (packageGiven, index) {
      if (!packageGiven) {
        return true;
      }
    });

    if (!qrCodeExists) {
      this.status = 400;
      this.body = {error : `Some/one of the qrcodes(s) doesn't exist`};
      return;
    }

    var redeemCode = ParseUtils.generateCharDigitCode(5);

    var redeemObj = {
      redeem_code : redeemCode,
      package_codes : packageCodes
    };

    var result = yield Packages.registerManualRedeem(redeemObj);

    this.status = 201;
    this.body = {
      success : "Code successfully registered",
      data : result
    }
  } catch (err) {
    console.error(err);
    throw(err);
  }
}

function * manualRedeemPackage () {
  try {
    var packages = (yield Packages.getManualRedeemPackages(this.body.redeem_code)).package_codes;

    var updateResult = yield updateRedeemedPackages(packages, this.passport.user);

    this.status = updateResult.status;
    this.body = { message : updateResult.message, data : updateResult.data};
  } catch (err) {
    console.error("Error while updating multiple packages");
    throw err;
  }
}


