'use strict';

process.on('message', function (data) {
    setTimeout(function () {
        process.send({
            status: 'success'
        });
        process.exit(0);
    }, data.timeout);
});