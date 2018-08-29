import { ProcessScheduler } from '../src';

const defaultOptions = {
  keepProperties: {
    change: ['status', 'id'],
    message: ['data']
  }
};

export function testSchedule(options) {
  options = Object.assign({}, defaultOptions, options);
  return new Promise((resolve, reject) => {
    const processScheduler = new ProcessScheduler(options.config);

    const prom = spyEvents({
      resolve,
      reject,
      expect: options.expect,
      groupById: options.groupById,
      scheduler: processScheduler,
      keepProperties: options.keepProperties
    });

    processScheduler.schedule(options.schedule);
    if (options.trigger) {
      for (const trigger of options.trigger) {
        processScheduler.trigger(trigger);
      }
    }
    return prom;
  });
}

function spyEvents(options) {
  const result = {};
  options.scheduler.on('change', onEvent('change'));

  options.scheduler.on('message', onEvent('message'));

  function keepNeeded(eventName, msg) {
    const props = options.keepProperties[eventName];
    const shortMessage = {};
    if (props) {
      for (const prop of props) {
        if (msg[prop] !== undefined) {
          shortMessage[prop] = msg[prop];
        }
      }
    }
    return shortMessage;
  }

  function onEvent(eventName) {
    return (msg) => {
      if (!result[eventName]) {
        result[eventName] = options.groupById ? {} : [];
      }

      const change = {
        id: msg.id,
        status: msg.status,
        message: ''
      };
      if (msg.message) {
        change.message = msg.message;
      }

      const toPush = keepNeeded(eventName, msg);
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
        setTimeout(() => {
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
    let len = 0;
    for (const key of Object.keys(data)) {
      len += computeLength(data[key]);
    }
    return len;
  }
}
