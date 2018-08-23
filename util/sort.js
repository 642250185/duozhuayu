const firstBy = require('thenby');

const sortNumArray = arr => {
    if (!arr || arr.length <= 0) {
        return arr;
    }
    return arr.sort(firstBy(Number));
};

const sortNestedArray = arr => {
    if (!arr || arr.length <= 0) {
        return arr;
    }
    return arr.sort(firstBy(function (v1, v2) {
        return v1[0] - v2[0];
    }));
};

const sortNestedNumberArray = arr => {
    if (!arr || arr.length <= 0) {
        return arr;
    }
    arr = arr.map(entity => {
        return sortNumArray(entity);
    });
    return arr.sort(firstBy(function (v1, v2) {
        return v1[0] - v2[0];
    }));
};

const sortNestedByProperty = (arr, field) => {
    if (!arr || arr.length <= 0) {
        return arr;
    }

    arr = arr.map(entity => {
        return entity.sort(firstBy(function (v1, v2) {
            return JSON.parse(v1)[field] - JSON.parse(v2)[field];
        }));
    });
    arr.sort(firstBy(function (v1, v2) {
        return JSON.parse(v1[0])[field] - JSON.parse(v2[0])[field];
    }));
    return arr;
};

const sortByProperty = (arr, field) => {
    if (!arr || arr.length <= 0) {
        return arr;
    }

    arr.sort(firstBy(function (v1, v2) {
        return v1[field] - v2[field];
    }));
    return arr;
};

const shiftArray = (arr) => {
    arr.shift();
    return arr;
};

exports.sortNumArray = sortNumArray;
exports.sortNestedArray = sortNestedArray;
exports.sortNestedNumberArray = sortNestedNumberArray;
exports.sortByProperty = sortByProperty;
exports.sortNestedByProperty = sortNestedByProperty;
exports.shiftArray = shiftArray;