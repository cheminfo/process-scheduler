'use strict';

process.on('message', function (data) {
    setTimeout(function () {
        process.send({
            type: 'done',
            status: 'success'
        });
        process.exit(0);
    }, data.timeout);
});