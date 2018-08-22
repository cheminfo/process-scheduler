'use strict';

const path = require('path');

const helper = require('../../testUtil/helper');

describe('success', () => {
  test('non-concurrent', () => {
    var config = {
      threads: 2
    };

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
      change: {
        p1: [
          { status: 'queued', id: 'p1' },
          { status: 'running', id: 'p1' },
          { status: 'success', id: 'p1' }
        ],
        p2: [
          { status: 'queued', id: 'p2' },
          { status: 'running', id: 'p2' },
          { status: 'success', id: 'p2' }
        ]
      }
    };

    return helper.testSchedule({ config, schedule, expect, groupById: true });
  });

  test('non-concurrent thread-limited', () => {
    var config = {
      threads: 1
    };

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

  test('thread-limited by type', () => {
    return helper.testSchedule({
      config: {
        threads: {
          a: 1,
          b: 1
        }
      },
      schedule: [
        {
          id: 'p1',
          worker: path.join(__dirname, '../../testUtil/workers/timeout.js'),
          type: 'a',
          arg: { timeout: 50 }
        },
        {
          id: 'p2',
          worker: path.join(__dirname, '../../testUtil/workers/success.js'),
          type: 'a'
        },
        {
          id: 'p3',
          worker: path.join(__dirname, '../../testUtil/workers/success.js'),
          type: 'b'
        }
      ],
      expect: {
        change: [
          { id: 'p1', status: 'queued' },
          { id: 'p1', status: 'running' },
          { id: 'p2', status: 'queued' },
          { id: 'p3', status: 'queued' },
          { id: 'p3', status: 'running' },
          { id: 'p3', status: 'success' },
          { id: 'p1', status: 'success' },
          { id: 'p2', status: 'running' },
          { id: 'p2', status: 'success' }
        ]
      }
    });
  });

  test('concurrent', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js'),
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

  test('same task', () => {
    var config = {
      threads: 2
    };

    var schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'success', id: 'p1' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });
});
