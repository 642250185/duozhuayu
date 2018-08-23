const moment = require('moment');

const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

exports.formatUTC = formatUTC = (date, format) => {
    if(!date) {
        return null;
    }
    if(!format) {
        format = DEFAULT_FORMAT;
    }
    return moment.utc(date).local().format(format);
};

exports.formatDate = (date, format) => {
    if(!date) {
        return null;
    }
    if(!format) {
        format = DEFAULT_FORMAT;
    }
    return moment(date).local().format(format);
};