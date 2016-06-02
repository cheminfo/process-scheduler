'use strict';

const helper = require('./helper');
const path = require('path');

describe('basic', function () {
    it('triggers a process', function () {
        var config = {threads: 1};
        var schedule = [
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js'),
                immediate: false
            },
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js')
            }
        ];

        var expect = {
            change: [
                {id: 'p1', status: 'queued'},
                {id: 'p1', status: 'running'},
                {id: 'p2', status: 'queued'},
                {id: 'p1', status: 'success'},
                {id: 'p2', status: 'running'},
                {id: 'p2', status: 'success'}
            ]
        };

        return helper.testSchedule({config, schedule, expect, trigger: ['p2']});
    });
    
    it('retrigger a process has no effect', function () {
        var config = {threads: 1};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js'),
            },
            {
                id: 'p2',
                worker: path.join(__dirname, 'workers/success.js')
            }
        ];

        var expect = {
            change: [
                {id: 'p1', status: 'queued'},
                {id: 'p1', status: 'running'},
                {id: 'p2', status: 'queued'},
                {id: 'p1', status: 'success'},
                {id: 'p2', status: 'running'},
                {id: 'p2', status: 'success'}
            ]
        };

        return helper.testSchedule({config, schedule, expect, trigger: ['p2']});
    });

    it('trigger unregistered process has no effect', function () {
        var config = {threads: 1};
        var schedule = [
            {
                id: 'p1',
                worker: path.join(__dirname, 'workers/success.js')
            }
        ];

        var expect = {
            change: [
                {id: 'p1', status: 'queued'},
                {id: 'p1', status: 'running'},
                {id: 'p1', status: 'success'}
            ]
        };

        return helper.testSchedule({config, schedule, expect, trigger: ['p2']});
    });
});