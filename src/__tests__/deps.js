'use strict';

const path = require('path');

const helper = require('../../testUtil/helper');

describe('dependencies', () => {
  test('deps non-concurrent', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        arg: { timeout: 500 },
        worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
        deps: [
          {
            id: 'p2',
            worker: path.join(__dirname, '../../testUtil/workers/success.js')
          }
        ]
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' },
        { status: 'success', id: 'p1' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });

  test('deps non-concurrent using id', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        arg: { timeout: 500 },
        worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
        deps: ['p2']
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' },
        { status: 'success', id: 'p1' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });

  test('deps concurrent', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        arg: { timeout: 500 },
        worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
        noConcurrency: ['p2'],
        deps: [
          {
            id: 'p2',
            worker: path.join(__dirname, '../../testUtil/workers/success.js')
          }
        ]
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2' },
        { status: 'success', id: 'p1' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });

  test('deps concurrent using id', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        arg: { timeout: 500 },
        worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
        deps: ['p2'],
        noConcurrency: ['p2']
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2' },
        { status: 'success', id: 'p1' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });

  test('dependencies scheduled when process running', () => {
    return helper.testSchedule({
      config: { threads: 1 },
      schedule: [
        {
          id: 'p1',
          worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
          arg: { timeout: 100 }
        },
        {
          id: 'p2',
          worker: path.join(__dirname, '../../testUtil/workers/success.js'),
          deps: ['p1']
        }
      ],
      expect: {
        change: [
          { id: 'p1', status: 'queued' },
          { id: 'p1', status: 'running' },
          { id: 'p2', status: 'queued' },
          { id: 'p1', status: 'success' },
          { id: 'p2', status: 'running' },
          { id: 'p1', status: 'queued' },
          { id: 'p2', status: 'success' },
          { id: 'p1', status: 'running' },
          { id: 'p1', status: 'success' }
        ]
      }
    });
  });
});
