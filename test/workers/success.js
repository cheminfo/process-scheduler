'use strict';

process.on('message', function (data) {
    process.send({
        status: 'success',
        message: 'none'
    });
});