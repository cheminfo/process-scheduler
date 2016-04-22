'use strict';

const ProcessScheduler = require('../src/index');

var helper = module.exports = {};

helper.testSchedule = function testSchedule(config, schedule, expect, groupById) {
    return new Promise((resolve, reject) => {
        let processScheduler = new ProcessScheduler(config);

        var prom = pushChanges({
            resolve,
            reject,
            expect,
            scheduler: processScheduler
        }, groupById);

        processScheduler.schedule(schedule);
        return prom;
    });
};

function pushChanges(options, groupById) {
    var changes = groupById ? {} : [];
    options.scheduler.on('change', msg => {
        let change = {
            id: msg.id,
            status: msg.status
        };
        if(msg.message) change.message = msg.message;
        let toPush = {
            originalMessage: msg,
            shortMessage: change
        };
        if(groupById) {
            changes[change.id] = changes[change.id] || [];
            changes[change.id].push(toPush);
        } else {
            changes.push(toPush);
        }

        if(computeLength(changes) === computeLength(options.expect)) {
            mapShort(changes).should.deepEqual(options.expect);
            options.resolve(changes);
        }
    });
}


function computeLength(data) {
    if(data instanceof Array) {
        return data.length;
    } else {
        var len = 0;
        var keys = Object.keys(data);
        for(let i=0; i<keys.length; i++) {
            let key = keys[i];
            len += data[key].length;
        }
        return len;
    }
}

function mapShort(data) {
    if(data instanceof Array) {
        return data.map(change => change.shortMessage);
    } else {
        let keys = Object.keys(data);
        for(let i=0; i<keys.length; i++) {
            let key = keys[i];
            data[key] = data[key].map(change => change.shortMessage);
        }
        return data;
    }

}