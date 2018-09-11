import * as path from 'path';

import { testSchedule } from '../../testUtil/helper';

describe('success', () => {
  test('error status', () => {
    const config = {
      threads: 2
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/error.js')
      }
    ];

    const expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'error', id: 'p1' }
      ]
    };

    return testSchedule({ config, schedule, expect });
  });

  test('script error', () => {
    const config = {
      threads: 2
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/workerError.js')
      }
    ];

    const expected = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        {
          status: 'error',
          id: 'p1',
          message: 'worker error',
          stdout: '',
          stderr: expect.stringMatching(/Error: error/)
        }
      ]
    };

    const keepProperties = {
      change: ['id', 'status', 'message', 'stdout', 'stderr']
    };

    return testSchedule({ config, schedule, expect: expected, keepProperties });
  });

  test('worker missing file', () => {
    const config = { threads: 2 };
    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, 'does/not/exist.js')
      }
    ];

    const expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'error', id: 'p1', message: 'worker error' }
      ]
    };

    const keepProperties = {
      change: ['id', 'status', 'message']
    };
    return testSchedule({ config, schedule, expect, keepProperties });
  });

  test('retry with a timeout', () => {
    return testSchedule({
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
