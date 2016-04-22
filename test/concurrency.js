'use strict';

const path = require('path');
const helper = require('./helper');

describe('success', () => {
    it('non-concurrent', () => {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js')
            },
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js')
            }
        ];

        var expect = {
            p1: [
                {status: 'queued', id: 'p1'},
                {status: 'running', id: 'p1'},
                {status: 'success', id: 'p1'},
            ],
            p2: [
                {status: 'queued', id: 'p2'},
                {status: 'running', id: 'p2'},
                {status: 'success', id: 'p2'}
            ]
        };


        return helper.testSchedule(config, schedule, expect, true);
    });

    it('non-concurrent thread-limited', function () {
        var config = {
            threads: 1
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js')
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

    it('concurrent', function () {
        var config = {
            threads: 2
        };

        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js'),
                noConcurrency: ['p2']
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
    })

});
