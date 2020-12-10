const MILLISECOND_IN_MILLI = 1;
const SECOND_IN_MILLI = 1000 * MILLISECOND_IN_MILLI;
const MINUTE_IN_MILLI = 60 * SECOND_IN_MILLI;
const HOUR_IN_MILLI = 60 * MINUTE_IN_MILLI;
const DAY_IN_MILLI = 24 * HOUR_IN_MILLI;
const MONTH_IN_MILLI = 30 * DAY_IN_MILLI;
const YEAR_IN_MILLI = 12 * MONTH_IN_MILLI;

const TIME_UNIT = {
    'second' : {
        inMillis : function (seconds) {
            return SECOND_IN_MILLI * seconds;
        }
    },
    'minute' : {
        inMillis : function (minutes) {
            return MINUTE_IN_MILLI * minutes;
        }
    },
    'hour' : {
        inMillis : function (hours) {
            return HOUR_IN_MILLI * hours;
        }
    },
    'day' : {
        inMillis : function (days) {
            return DAY_IN_MILLI * days;
        }
    },
    'month' : {
        inMillis : function (months) {
            return MONTH_IN_MILLI * months;
        }
    },
    'year' : {
        inMillis : function (years) {
            return YEAR_IN_MILLI * years;
        }
    }
};

exports.getEndOfDay = function (date) {
  var newDate = date;
  newDate.setHours(23,59,59,999);
  return newDate;
};
exports.calculateInterval = function (timeUnit, start, end) {
    return (end - start)/TIME_UNIT[timeUnit].inMillis(1);
};

exports.inMillis = function (timeUnit, value) {
    return TIME_UNIT[timeUnit].inMillis(value);
};
