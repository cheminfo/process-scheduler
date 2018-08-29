import * as path from 'path';

import { testSchedule } from '../../testUtil/helper';

describe('basic', () => {
  test('triggers a process', () => {
    const config = { threads: 1 };
    const schedule = [
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

    const expect = {
      change: [
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p2', status: 'queued' },
        { id: 'p1', status: 'success' },
        { id: 'p2', status: 'running' },
        { id: 'p2', status: 'success' }
      ]
    };

    return testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });

  test('retrigger a process has no effect', () => {
    const config = { threads: 1 };
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
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p2', status: 'queued' },
        { id: 'p1', status: 'success' },
        { id: 'p2', status: 'running' },
        { id: 'p2', status: 'success' }
      ]
    };

    return testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });

  test('trigger unregistered process has no effect', () => {
    const config = { threads: 1 };
    const schedule = [
      {
        id: 'p1',
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    const expect = {
      change: [
        { id: 'p1', status: 'queued' },
        { id: 'p1', status: 'running' },
        { id: 'p1', status: 'success' }
      ]
    };

    return testSchedule({ config, schedule, expect, trigger: ['p2'] });
  });
});
