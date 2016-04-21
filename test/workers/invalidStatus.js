'use strict';

process.on('message', function (data) {
    process.send({
        status: 'something invalid',
        message: 'none'
    });
});