'use strict';

const path = require('path');

const helper = require('../../testUtil/helper');

describe('success', () => {
  test('error status', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/error.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'error', id: 'p1' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });

  test('script error', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/workerError.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'error', id: 'p1', message: 'worker error' }
      ]
    };

    var keepProperties = {
      change: ['id', 'status', 'message']
    };

    return helper.testSchedule({ config, schedule, expect, keepProperties });
  });

  test('worker missing file', () => {
    var config = { threads: 2 };
    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, 'does/not/exist.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'error', id: 'p1', message: 'worker error' }
      ]
    };

    var keepProperties = {
      change: ['id', 'status', 'message']
    };
    return helper.testSchedule({ config, schedule, expect, keepProperties });
  });

  test('retry with a timeout', () => {
    return helper.testSchedule({
      config: { threads: 2 },
      schedule: [
        {
          id: 'p1',
          worker: path.join(__dirname, '../../testUtil/workers/retry.js'),
          retryTimeout: 0
        }
      ],
      expect: {
        change: [
          { status: 'queued', id: 'p1' },
          { status: 'running', id: 'p1' },
          { status: 'error', id: 'p1' },
          { status: 'queued', id: 'p1' },
          { status: 'running', id: 'p1' },
          { status: 'success', id: 'p1' }
        ]
      }
    });
  });
});
