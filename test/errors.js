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

        var expect = {
            change: [
                {status: 'queued', id: 'p1'},
                {status: 'running', id: 'p1'},
                {status: 'error', id: 'p1'}
            ]
        };


        return helper.testSchedule({config, schedule, expect});
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

        var expect = {
            change: [
                {status: 'queued', id: 'p1'},
                {status: 'running', id: 'p1'},
                {status: 'error', id: 'p1', message: 'Process sent invalid message'}
            ]
        };

        var keepProperties = {
            change: ['id', 'status', 'message']
        };


        return helper.testSchedule({config, schedule, expect, keepProperties});
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

        var expect = {
            change: [
                {status: 'queued', id: 'p1'},
                {status: 'running', id: 'p1'},
                {status: 'error', id: 'p1', message: 'worker error'}
            ]
        };

        var keepProperties = {
            change: ['id', 'status', 'message']
        };


        return helper.testSchedule({config, schedule, expect, keepProperties});
    });

    it('worker missing file', function () {
        var config = {threads: 2};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'does/not/exist.js')
            }
        ];

        var expect = {
            change: [
                {status: 'queued', id: 'p1'},
                {status: 'running', id: 'p1'},
                {status: 'error', id: 'p1', message: 'worker error'}
            ]
        };

        var keepProperties = {
            change: ['id', 'status', 'message']
        };
        return helper.testSchedule({config, schedule, expect, keepProperties});
    });

    it.only('retry with a timeout', function () {
        return helper.testSchedule({
            config: {threads: 2},
            schedule: [
                {
                    id: 'p1',
                    worker: path.join(__dirname, 'workers/retry.js'),
                    retryTimeout: 10
                }
            ],
            expect: {
                change: [
                    {status: 'queued', id: 'p1'},
                    {status: 'running', id: 'p1'},
                    {status: 'error', id: 'p1'},
                    {status: 'queued', id: 'p1'},
                    {status: 'running', id: 'p1'},
                    {status: 'error', id: 'p1'}
                ]
            }
        })
    });

});
