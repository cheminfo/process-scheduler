'use strict';

setTimeout(function () {
    process.send({
        type: 'progress',
        message: 'timeout 1'
    })
}, 50);

setTimeout(function () {
    process.send({
        type: 'progress',
        message: 'timeout 2'
    });
}, 100);