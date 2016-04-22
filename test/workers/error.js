'use strict';

process.on('message', function (data) {
    process.send({
        status: 'error'
    });
    process.exit(0);
});