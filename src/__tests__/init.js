'use strict';

const ProcessScheduler = require('..');

const path = require('path');

describe('init', () => {
  test('should throw if id not defined', () => {
    var config = { threads: 2 };
    var schedule = [
      {
        worker: path.join(__dirname, '../../testUtil/workers/success.js')
      }
    ];

    var scheduler = new ProcessScheduler(config);
    (expect(function () {
      scheduler.schedule(schedule);
    }).toThrowError(/id is mandatory/));
  });

  test('should throw if worker not defined', () => {
    var config = { threads: 2 };
    var schedule = [
      {
        id: 'p1'
      }
    ];

    var scheduler = new ProcessScheduler(config);
    (expect(function () {
      scheduler.schedule(schedule);
    }).toThrowError(/worker is mandatory/));
  });

  test('should throw if circular dependency', () => {
    var config = { threads: 2 };
    var schedule = [
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

    var scheduler = new ProcessScheduler(config);
    (expect(function () {
      scheduler.schedule(schedule);
    }).toThrowError(/circular/));
  });

  test('should throw if number of threads is not defined', () => {
    (expect(function () {
      // eslint-disable-next-line no-unused-vars
      var scheduler = new ProcessScheduler();
    }).toThrowError(/threads/));
  });
});
