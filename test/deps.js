'use strict';

const path = require('path');
const helper = require('./helper');

describe('success', () => {
    it('deps non-concurrent', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                arg: {timeout: 500},
                worker: path.join(__dirname, 'workers/timeout.js'),
                deps: [
                    {
                        id: 'p2',
                        worker: path.join(__dirname, 'workers/success.js')
                    }
                ]
            }

        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'queued', id: 'p2'},
            {status: 'running', id: 'p2'},
            {status: 'success', id: 'p2'},
            {status: 'success', id: 'p1'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });

    it('deps non-concurrent using id', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                arg: {timeout: 500},
                worker: path.join(__dirname, 'workers/timeout.js'),
                deps: ['p2']
            },
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js')
            }

        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'queued', id: 'p2'},
            {status: 'running', id: 'p2'},
            {status: 'success', id: 'p2'},
            {status: 'queued', id: 'p2'},
            {status: 'running', id: 'p2'},
            {status: 'success', id: 'p2'},
            {status: 'success', id: 'p1'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });

    it('deps concurrent', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                arg: {timeout: 500},
                worker: path.join(__dirname, 'workers/timeout.js'),
                noConcurrency: ['p2'],
                deps: [
                    {
                        id: 'p2',
                        worker: path.join(__dirname, 'workers/success.js')
                    }
                ]
            }

        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'queued', id: 'p2'},
            {status: 'success', id: 'p1'},
            {status: 'running', id: 'p2'},
            {status: 'success', id: 'p2'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });

    it('deps concurrent using id', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                arg: {timeout: 500},
                worker: path.join(__dirname, 'workers/timeout.js'),
                deps: ['p2'],
                noConcurrency:['p2']
            },
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js')
            }

        ];

        var expect = [
            {status: 'queued', id: 'p1'},
            {status: 'running', id: 'p1'},
            {status: 'queued', id: 'p2'},
            {status: 'success', id: 'p1'},
            {status: 'running', id: 'p2'},
            {status: 'success', id: 'p2'}
        ];


        return helper.testSchedule(config, schedule, expect);
    });
});