'use strict';

const helper = require('./helper');
const path = require('path');

describe('basic', function () {
    it('worker implicit success', function () {
        var config = {threads: 2};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/implicitSuccess.js')
            }
        ];

        var expect = {
            change: [
                {id: 'p1', status: 'queued'},
                {id: 'p1', status: 'running'},
                {id: 'p1', status: 'success'}
            ]
        };

        return helper.testSchedule({config, schedule, expect});
    });

    it('forward messages', function () {
        return helper.testSchedule({
            config: {threads: 2},
            schedule: [
                {
                    id: 'p1',
                    worker: path.join(__dirname, 'workers/progress.js')
                }
            ],
            expect: {
                change: [
                    {id: 'p1', status: 'queued'},
                    {id: 'p1', status: 'running'},
                    {id: 'p1', status: 'success'}
                ],
                message: [
                    {data: {type: 'progress', message: 'timeout 1'}},
                    {data: {type: 'progress', message: 'timeout 2'}}
                ]
            }
        });
    });

    it('handle immediate option', function () {
        var config = {threads: 2};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js')
            },
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js'),
                immediate: false
            }
        ];

        var expect = {
            change: [
                {id: 'p1', status: 'queued'},
                {id: 'p1', status: 'running'},
                {id: 'p1', status: 'success'}
            ]
        };

        return helper.testSchedule({config, schedule, expect});
    });
});