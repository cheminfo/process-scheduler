'use strict';

process.on('message', function (data) {
    throw new Error('error');
});

