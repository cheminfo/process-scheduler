'use strict';

const path = require('path');
const helper = require('./helper');

describe('success', () => {
    it('error status', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/error.js')
            }
        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'error', id: 'p1'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });

    it('invalid status', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/invalidStatus.js')
            }
        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'error', id: 'p1', message: 'Process sent invalid message'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });

    it('script error', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/workerError.js')
            }
        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'error', id: 'p1', message: 'worker error'}
        ];


        return helper.testSchedule(config, schedule, expect).then(data => {
            data[2].originalMessage.stderr.should.not.be.empty();
        });
    });

    it('worker missing file', function () {
        var config = {threads: 2};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'does/not/exist.js')
            }
        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'error', id: 'p1', message: 'worker error'}
        ];
        
        return helper.testSchedule(config, schedule, expect);
    })

});
