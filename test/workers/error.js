'use strict';

process.on('message', function (data) {
    process.send({
        type: 'done',
        status: 'error'
    });
    process.exit(0);
});