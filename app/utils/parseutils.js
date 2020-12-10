/**
 * @author Sávio Muniz
 */

exports.parseBalance = function (currencyString) {
  const REGEX = /[^0-9.]/g;
  return Number(currencyString.replace(REGEX, ''));
};

exports.getPercentage = function(part, total) {
  return (part / total) * 100;
};

exports.getRandomNumber = function (digits) {
  var max = 10 ** digits - 1;
  var min = 10 ** (digits - 1);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.generateCharDigitCode = function (length) {
  var code = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    code += possible.charAt(Math.floor(Math.random() * possible.length));

  return code;
};
