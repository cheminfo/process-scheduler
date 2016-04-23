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

        var expect = [
            {id: 'p1', status: 'queued'},
            {id: 'p1', status: 'running'},
            {id: 'p1', status: 'success'}
        ];

        return helper.testSchedule(config, schedule, expect);
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

        var expect = [
            {id: 'p1', status: 'queued'},
            {id: 'p1', status: 'running'},
            {id: 'p1', status: 'success'}
        ];

        return helper.testSchedule(config, schedule, expect);
    });
});