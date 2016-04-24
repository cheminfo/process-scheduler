'use strict';

process.on('message', function (data) {
    setTimeout(function () {
        process.exit(0);
    }, data.timeout);
});