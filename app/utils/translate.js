function Translate() {
  var fs = require('fs');
  var log = require('winston');
  var debug = require('debug')('translate');

  const LOCALES = '../../config/locales/';
  const TRANS_FILE = 'translation.json';

  var langMap = new Map();
  var expression = /\{\{[a-zA-Z0-9_]+\}\}/;

  var loadLang = function(lang) {
    log.info('loading lang ' + lang);
    // log.info('dirname: ' + __dirname);
    // log.info(lang);
    var transPath = __dirname + '/' + LOCALES + lang + '/' + TRANS_FILE;
    log.info(transPath + " : " + fs.existsSync(transPath));
    if (fs.existsSync(transPath)) {
      var transData = fs.readFileSync(transPath);
      // log.info(transData);
      if (transData !== '') {
        langMap.set(lang, JSON.parse(transData));
      }
    }
  }

  var interpolate = function(input, values) {
    var interpolated = input;
    debug(interpolated);
    debug(values);
    for (i = 0; i < values.length; i++) {
      debug('current val: '+ values[i]);
      interpolated = interpolated.replace(expression, values[i]);
    }
    return interpolated
  }

  var trans = function (lang, key) {
    log.info('Invoking translation ', {fn: 'trans', lang: lang, key: key})
    if (!(langMap.get(lang))) {
        loadLang(lang);
        if (!(langMap.get(lang))) {
          return "Language lookup not found";
        }
      }
      else {
        log.debug('language "' + lang + '" loaded');
      }

      return(langMap.get(lang)[key]);
  }

  return {

    loadLang : function (lang) {
      loadLang(lang);
    },

    translate : function (lang, key, ...values) {
      log.info('Translate string', {fn:'translate', lang: lang, key: key, values: values})
      var transLang = lang;
      if (lang === null) {
        transLang = 'en';
      }
      var str = trans(transLang, key);
      if (values.length > 0) {
        var finalStr = interpolate(str, values);
        return finalStr;
      }
      return str;
    }

  };

}

//
// var Translate = (function() {
//
//
//     const LOCALES = '../../config/locales/';
//     const TRANS_FILE = 'translation.json';
//
//     var langMap = new Map();
//     var self;
//
//     function Translate() {
//       self = this;
//       self.langMap = new Map();
//     }
//
//
//     Translate.prototype.loadLang = (lang) => {
//       console.log("self: " + self.langMap);
//       var transPath = LOCALES + lang + '/' + TRANS_FILE;
//       log.info('loading lang: ' + lang);
//       log.info("TransFile path: " + transPath);
//       var transData;
//       transData = fs.readFileSync(transPath);
//       log.info(transData);
//       log.info(transData !== '');
//       if (transData !== '') {
//         log.info('Setting JSON from transPath, for lang: ' + lang);
//         log.info(JSON.parse(transData));
//         self.langMap.set(lang, JSON.parse(transData));
//         log.info(self.langMap);
//       }
//     };
//
//     Translate.prototype.getLangMap = () => {
//       return langMap;
//     };
//
//
//   Translate.prototype.contains = (lang) => {
//     log.info(lang + "::" + self.langMap);
//     return (lang in self.langMap);
//   }
//
//   Translate.prototype.
//
//
//   return Translate;
//
// })();

module.exports = Translate;