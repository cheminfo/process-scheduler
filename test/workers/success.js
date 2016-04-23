'use strict';

process.on('message', function (data) {
    process.send({
        type: 'done',
        status: 'success'
    });
    process.exit(0);
});