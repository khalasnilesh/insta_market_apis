/**
 * @author Sávio Muniz
 */

exports.getJsonQuery = function (column, pathObj) {
  var query = '';
  var keys = Object.keys(pathObj);
  keys.forEach(function (key, index) {
    query += column + ' #> ';
    var parsed = parseKey(key);
    query += "'" + parsed + "'='" + pathObj[key] + "'";

    if (index !== keys.length - 1)
      query += ' and ';
  });
  return query;
};

function parseKey(key) {
  var output = '{';
  var splittedKey = key.split('.');
  splittedKey.forEach(function (nestedProperty, index) {
      output += nestedProperty;
      if (index === splittedKey.length - 1)
        output += '}';
      else
        output += ',';
  });
  return output
}
