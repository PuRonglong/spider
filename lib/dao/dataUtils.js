exports.obj2DB = obj2DB;
exports.objIgnore2DB = objIgnore2DB;

exports.updateObj2DB = updateObj2DB;

exports.list2DB = list2DB;
exports.listIgnore2DB = listIgnore2DB;

exports.subListOfList = subListOfList;
exports.query = query;

var mysql = require('./mysql.js');

function obj2DB(table, obj, keys, callback) {
    if (_.isFunction(keys)) {
        callback = keys;
        keys = null;
    }

    var sqlObj = insertSqlOfObj(table, obj, keys);

    mysql.execSql(sqlObj.sql, sqlObj.value, callback);
}

function objIgnore2DB(table, obj, keys, callback) {
    if (_.isFunction(keys)) {
        callback = keys;
        keys = null;
    }

    var sqlObj = insertIgnoreSqlOfObj(table, obj, keys);

    mysql.execSql(sqlObj.sql, sqlObj.value, callback);
}

function updateObj2DB(table, obj, keys, primaryKeys, callback) {
    if (_.isFunction(primaryKeys)) {
        callback = primaryKeys;
        primaryKeys = keys;

        keys = _.filter(_.keys(obj), function (item) {
            return !_.contains(primaryKeys, item)
        });
    }

    var sqlObj = updateSqlOfObj(table, obj, keys, primaryKeys);

    mysql.execSql(sqlObj.sql, sqlObj.value, callback);
}

function list2DB(table, list, keys, callback) {
    if (_.isFunction(keys)) {
        callback = keys;
        keys = null;
    }

    var sqlList = [];

    _.each(list, function (item) {
        sqlList.push(insertSqlOfObj(table, item, keys));
    });

    mysql.batchExecSql(sqlList, callback);
}

function listIgnore2DB(table, list, keys, callback) {
    if (_.isFunction(keys)) {
        callback = keys;
        keys = null;
    }

    var sqlList = [];

    _.each(list, function (item) {
        sqlList.push(insertIgnoreSqlOfObj(table, item, keys));
    });

    mysql.batchExecSql(sqlList, callback);
}

function subListOfList(table, filed, list, callback) {
    var value = {};
    _.each(list, function (item, index) {
        value['c_' + index] = item;
    });

    var sql = 'select ' + filed + ' from ' + table + ' where ' + filed + ' in(:' + _.keys(value).join(', :') + ');';

    mysql.execSql(sql, value, callback);
}

function query(table, condition, fieldList, callback) {
    if (_.isFunction(fieldList)) {
        callback = fieldList;
        fieldList = ['*'];
    }

    var limitStr = '';
    if (!_.isEmpty(condition.limitCondition)) {
        limitStr = ' limit ' + condition.limitCondition.join(', ');
        delete condition.limitCondition;
    }

    var whereKeysList = [];
    _.each(_.keys(condition), function (key) {
        whereKeysList.push(key + ' = :' + key);
    });

    var whereReplace = 'where ' + whereKeysList.join(' and ');

    var sql = 'select ' + fieldList.join(', ') + ' from ' + table + ' ' + whereReplace + limitStr + ';';

    mysql.execSql(sql, condition, callback);
}

function insertSqlOfObj(table, obj, keys) {
    var objCopy = _.clone(obj);

    if (!_.isEmpty(keys)) {
        objCopy = _.pick(objCopy, keys);
    }

    var keysString = '(' + _.keys(objCopy).join(', ') + ')';
    var keysReplace = '(:' + _.keys(objCopy).join(', :') + ')';

    return {
        sql: 'insert into ' + table + keysString + 'values ' + keysReplace,
        value: objCopy
    }
}

function insertIgnoreSqlOfObj(table, obj, keys) {
    var objCopy = _.clone(obj);

    if (!_.isEmpty(keys)) {
        objCopy = _.pick(objCopy, keys);
    }

    var keysString = '(' + _.keys(objCopy).join(', ') + ')';
    var keysReplace = '(:' + _.keys(objCopy).join(', :') + ')';

    return {
        sql: 'insert ignore into ' + table + keysString + 'values ' + keysReplace,
        value: objCopy
    }
}

function updateSqlOfObj(table, obj, keys, primaryKeys) {
    var objCopy = _.clone(obj);
    _correctArgs();

    var setKeysList = [];
    _.each(keys, function (key) {
        setKeysList.push(key + ' = :' + key);
    });

    var whereKeysList = [];
    _.each(primaryKeys, function (key) {
        whereKeysList.push(key + ' = :' + key);
    });

    var keysReplace = 'set ' + setKeysList.join(', ');
    var whereReplace = 'where ' + whereKeysList.join(', ');

    return {
        sql: 'update ' + table + ' ' + keysReplace + ' ' + whereReplace,
        value: objCopy
    };

    function _correctArgs() {
        if (_.isEmpty(primaryKeys)) {
            primaryKeys = 'id';
        }

        if (!_.isArray(primaryKeys)) {
            primaryKeys = [primaryKeys];
        }

        if (!_.isEmpty(keys)) {
            objCopy = _.pick(objCopy, keys.concat(primaryKeys));
        }
    }
}