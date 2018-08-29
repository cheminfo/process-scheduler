import * as path from 'path';

import ProcessScheduler from '..';

describe('init', () => {
  test('should throw if id not defined', () => {
    const config = { threads: 2 };
    const schedule = [
      {
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    const scheduler = new ProcessScheduler(config);
    expect(() => {
      scheduler.schedule(schedule);
    }).toThrowError(/id is mandatory/);
  });

  test('should throw if worker not defined', () => {
    const config = { threads: 2 };
    const schedule = [
      {
        id: 'p1'
      }
    ];

    const scheduler = new ProcessScheduler(config);
    expect(() => {
      scheduler.schedule(schedule);
    }).toThrowError(/worker is mandatory/);
  });

  test('should throw if circular dependency', () => {
    const config = { threads: 2 };
    const schedule = [
      {
        worker: path.join(__dirname, '../../testUtil/workers/success.js'),
        id: 'p1',
        deps: ['p2']
      },
      {
        worker: path.join(__dirname, '../../testUtil/workers/success.js'),
        id: 'p2',
        deps: ['p1']
      }
    ];

    const scheduler = new ProcessScheduler(config);
    expect(() => {
      scheduler.schedule(schedule);
    }).toThrowError(/circular/);
  });

  test('should throw if number of threads is not defined', () => {
    expect(() => {
      // tslint:disable-next-line no-unused-expression
      new ProcessScheduler({});
    }).toThrowError(/threads must be a number or a threads config object/);
  });

  test('should throw if no option is passed', () => {
    expect(() => {
      // tslint:disable-next-line no-unused-expression
      new ProcessScheduler();
    }).toThrowError(/options object is mandatory/);
  });
});
