'use strict';

process.on('message', function (data) {
    process.send({
        type: 'done',
        status: 'something invalid',
        message: 'none'
    });
    process.exit(0);
});