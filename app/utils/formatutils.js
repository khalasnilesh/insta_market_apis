const CURRENCY_INFO = {
    USD : {
        symbol : "$",
        locale : "en-US"
    },
    EUR : {
        symbol : "€",
        locale : "de-DE"
    },
    BRL : {
        symbol : "R$",
        locale : "de-DE"
    },
    default : {
        symbol : "R$",
        locale : "de-DE"
    }
};

exports.formatPrice = function (value, currency) {
    var formatter = CURRENCY_INFO[currency] || CURRENCY_INFO["default"] ;

    var symbol = formatter.symbol;
    var locale = formatter.locale;

    return symbol + value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
};

exports.round = function (number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}
