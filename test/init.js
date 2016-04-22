'use strict';

const ProcessScheduler = require('..');
const path = require('path');

describe.only('init', function () {
    it('should throw if id not defined', function () {
        var config = {threads: 2};
        var schedule = [
            {
                worker: path.join(__dirname, 'workers/success.js')
            }
        ];

        var scheduler = new ProcessScheduler(config);
        (function() {
            scheduler.schedule(schedule).should.throw();
        }).should.throw();
    });

    it('should throw if worker not defined', function () {
        var config = {threads: 2};
        var schedule = [
            {
                id: 'p1'
            }
        ];

        var scheduler = new ProcessScheduler(config);
        (function() {
            scheduler.schedule(schedule).should.throw();
        }).should.throw();
    });

    it('should throw if circular dependency', function () {
        var config = {threads: 2};
        var schedule = [
            {
                worker: path.join(__dirname, 'workers/success.js'),
                id: 'p1',
                deps: ['p2']
            },
            {
                worker: path.join(__dirname, 'workers/success.js'),
                id: 'p2',
                deps: ['p1']
            }
        ];

        var scheduler = new ProcessScheduler(config);
        (function() {
            scheduler.schedule(schedule).should.throw();
        }).should.throw();
    });
});