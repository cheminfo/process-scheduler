'use strict';

const ProcessScheduler = require('../src/index');

var helper = module.exports = {};

helper.testSchedule = function testSchedule(config, schedule, expect) {
    return new Promise((resolve, reject) => {
        let processScheduler = new ProcessScheduler(config);

        pushChanges({
            resolve,
            reject,
            expect,
            scheduler: processScheduler
        });

        processScheduler.schedule(schedule);
    });
};

function pushChanges(options) {
    var changes = [];
    options.scheduler.on('change', msg => {
        changes = changes || [];
        changes.push({
            id: msg.id,
            status: msg.status
        });

        if(changes.length === options.expect.length) {
            changes.should.deepEqual(options.expect);
            options.resolve();
        }
    });
}


