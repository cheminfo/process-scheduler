'use strict';

const path = require('path');

const helper = require('../../testUtil/helper');

describe('basic', () => {
  test('forward messages', () => {
    return helper.testSchedule({
      config: { threads: 2 },
      schedule: [
        {
          id: 'p1',
          worker: path.join(__dirname, '../../testUtil/workers/progress.js')
        }
      ],
      expect: {
        change: [
          { id: 'p1', status: 'queued' },
          { id: 'p1', status: 'running' },
          { id: 'p1', status: 'success' }
        ],
        message: [
          { data: { type: 'progress', message: 'timeout 1' } },
          { data: { type: 'progress', message: 'timeout 2' } }
        ]
      }
    });
  });

  test('handle immediate option', () => {
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
        { id: 'p1', status: 'success' }
      ]
    };

    return helper.testSchedule({ config, schedule, expect });
  });
});
