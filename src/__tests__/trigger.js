'use strict';

const path = require('path');

const helper = require('../../testUtil/helper');

describe('basic', () => {
  test('triggers a process', () => {
    var config = { threads: 1 };
    var schedule = [
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js'),
        immediate: false
      },
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p2', status: 'queued' },
        { id: 'p1', status: 'success' },
        { id: 'p2', status: 'running' },
        { id: 'p2', status: 'success' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });

  test('retrigger a process has no effect', () => {
    var config = { threads: 1 };
    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p2', status: 'queued' },
        { id: 'p1', status: 'success' },
        { id: 'p2', status: 'running' },
        { id: 'p2', status: 'success' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });

  test('trigger unregistered process has no effect', () => {
    var config = { threads: 1 };
    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p1', status: 'success' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });
});
