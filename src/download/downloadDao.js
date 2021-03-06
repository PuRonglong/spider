exports.queryDownloadImage = queryDownloadImage;
exports.markImageDownload = markImageDownload;
exports.markIsNotImage = markIsNotImage;
exports.markDownloadError = markDownloadError;

var dataUtils = require(global.libDir + '/dao/dataUtils.js');

function queryDownloadImage(count, callback) {
    var condition = {
        download_status: 0,
        image_status: 1,
        download_error_status: 0,
        limitCondition: [0, count]
    };

    dataUtils.query('image_url', condition, ['id', 'image_url'], function (err, result) {
        if (err) {
            callback(err);
            return;
        }

        if (_.isEmpty(result)) {
            callback(null, []);
            return;
        }

        callback(null, result);
    });
}

function markImageDownload(imageUrl, callback) {
    var updateModel = {
        image_url: imageUrl,
        download_status: 1
    };

    dataUtils.updateObj2DB('image_url', updateModel, 'image_url', callback);
}

function markIsNotImage(imageUrl, callback) {
    var updateModel = {
        image_url: imageUrl,
        image_status: 0
    };

    dataUtils.updateObj2DB('image_url', updateModel, 'image_url', callback);
}

function markDownloadError(imageUrl, callback) {
    var updateModel = {
        image_url: imageUrl,
        download_error_status: 1
    };

    dataUtils.updateObj2DB('image_url', updateModel, 'image_url', callback);
}