'use strict';

const expect = global.expect;

const ProcessScheduler = require('../src');

var helper = (module.exports = {});

const defaultOptions = {
  keepProperties: {
    change: ['status', 'id'],
    message: ['data']
  }
};

helper.testSchedule = function testSchedule(options) {
  options = Object.assign({}, defaultOptions, options);
  return new Promise((resolve, reject) => {
    let processScheduler = new ProcessScheduler(options.config);

    var prom = spyEvents({
      resolve,
      reject,
      expect: options.expect,
      groupById: options.groupById,
      scheduler: processScheduler,
      keepProperties: options.keepProperties
    });

    processScheduler.schedule(options.schedule);
    if (options.trigger) {
      for (var i = 0; i < options.trigger.length; i++) {
        processScheduler.trigger(options.trigger[i]);
      }
    }
    return prom;
  });
};

function spyEvents(options) {
  var result = {};
  options.scheduler.on('change', onEvent('change'));

  options.scheduler.on('message', onEvent('message'));

  function keepNeeded(eventName, msg) {
    var props = options.keepProperties[eventName];
    var shortMessage = {};
    if (props) {
      for (let i = 0; i < props.length; i++) {
        if (msg[props[i]] !== undefined) {
          shortMessage[props[i]] = msg[props[i]];
        }
      }
    }
    return shortMessage;
  }

  function onEvent(eventName) {
    return function (msg) {
      if (!result[eventName]) {
        result[eventName] = options.groupById ? {} : [];
      }

      let change = {
        id: msg.id,
        status: msg.status
      };
      if (msg.message) change.message = msg.message;
      let toPush = keepNeeded(eventName, msg);
      if (options.groupById) {
        result[eventName][change.id] = result[eventName][change.id] || [];
        result[eventName][change.id].push(toPush);
      } else {
        result[eventName].push(toPush);
      }

      if (
        eventName === 'change' &&
        computeLength(result) === computeLength(options.expect)
      ) {
        // In case new (unexpected) event arrive meanwhile
        setTimeout(function () {
          expect(options.scheduler.getQueued()).toHaveLength(0);
          expect(options.scheduler.getRunning()).toHaveLength(0);
          expect(result).toEqual(options.expect);
          options.resolve();
        }, 1000);
      }
    };
  }
}

function computeLength(data) {
  if (data instanceof Array) {
    return data.length;
  } else {
    var len = 0;
    var keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      len += computeLength(data[key]);
    }
    return len;
  }
}
