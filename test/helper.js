'use strict';

const ProcessScheduler = require('../src/index');

var helper = module.exports = {};

helper.testSchedule = function testSchedule(config, schedule, expect) {
    return new Promise((resolve, reject) => {
        let processScheduler = new ProcessScheduler(config);

        var prom = pushChanges({
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
        let change = {
            id: msg.id,
            status: msg.status
        };
        if(msg.message) change.message = msg.message;
        changes.push({
            originalMessage: msg,
            shortMessage: change
        });


        if(changes.length === options.expect.length) {
            changes.map(change => change.shortMessage).should.deepEqual(options.expect);
            options.resolve(changes);
        }
    });
}


