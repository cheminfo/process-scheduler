import * as path from 'path';

import { testSchedule } from '../../testUtil/helper';

describe('success', () => {
  test('non-concurrent', () => {
    const config = {
      threads: 2
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    const expect = {
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

    return testSchedule({ config, schedule, expect, groupById: true });
  });

  test('non-concurrent thread-limited', () => {
    const config = {
      threads: 1
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    const expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2' },
        { status: 'queued', id: 'p2', reason: 'threads' },
        { status: 'success', id: 'p1' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' }
      ]
    };

    return testSchedule({ config, schedule, expect });
  });

  test('thread-limited by type', () => {
    return testSchedule({
      config: {
        threads: {
          a: 1,
          b: 4
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
          { id: 'p2', status: 'queued', reason: 'too many threads of type a' },
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
    const config = {
      threads: 2
    };

    const schedule = [
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

    const expect = {
      change: [
        { status: 'queued', id: 'p1', reason: 'from trigger' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2', reason: 'from trigger' },
        { status: 'queued', id: 'p2', reason: 'concurrent process running' },
        { status: 'success', id: 'p1' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' }
      ]
    };

    return testSchedule({ config, schedule, expect });
  });

  test('concurrent reversed order', () => {
    const config = {
      threads: 2
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p2',
        worker: path.join(__dirname, '../../testUtil/workers/success.js'),
        noConcurrency: ['p1']
      }
    ];

    const expect = {
      change: [
        { status: 'queued', id: 'p1', reason: 'from trigger' },
        { status: 'running', id: 'p1' },
        { status: 'queued', id: 'p2', reason: 'from trigger' },
        { status: 'queued', id: 'p2', reason: 'concurrent process running' },
        { status: 'success', id: 'p1' },
        { status: 'running', id: 'p2' },
        { status: 'success', id: 'p2' }
      ]
    };

    return testSchedule({ config, schedule, expect });
  });

  test('same task', () => {
    const config = {
      threads: 2
    };

    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      },
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    const expect = {
      change: [
        { status: 'queued', id: 'p1' },
        { status: 'running', id: 'p1' },
        { status: 'success', id: 'p1' }
      ]
    };

    return testSchedule({ config, schedule, expect });
  });
});
