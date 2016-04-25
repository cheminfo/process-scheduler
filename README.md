# process-scheduler
Manage node workers
Features:
- Schedule processes with crontab rules
- Concurrency rules
- Dependency rules

```js
    const Scheduler = require('process-scheduler');
    
    var scheduler = new ProcessScheduler(config);
    scheduler.on('change', handleChange);
    scheduler.on('message', handleMessage);
    scheduler.schedule(options);
```

`config`: general scheduler configuration:
  - `threads`: the maximum number of threads that should be used. This can be a number or you can assign a number of threads per process `type` (see options). Giving a number is like assigning the number of threads to the default type.

`options` is an array of objects that have the following structure:
  - `id`: identifies the process (mandatory)
  - `worker`: the worker that the scheduler will fork (mandatory)
  - `type`: type of process. Default is `'default'`
  - `noConcurrency`: an array of process ids with which this process should not be run concurrently
  - `deps`: an array of process ids that should be triggered when this process is triggered. If the appropriate `noConcurrency` rule exists, the depenency processes will be executed only after this process has finished. The `deps` array can also nest an object with the `options` structure. `scheduler.schedule` will fail if circular dependencies are detected.
  - `cronRule`: a cron rule for executing the process. If not given the process is triggered once immediatly. See [node-schedule](https://github.com/node-schedule/node-schedule) for accepted input.
  - `immediate`: `true` or `false` weather to execute the process once immediately or not. If `undefined` the process is executed immediately only if no `cronRule` is given
  - `retryTimeout`: timeout in seconds after which the process should be restarted in case of failure

`Events`:
- `change`: notifies a change of status. An object with the follwing structure is passed:
  - `id`: id of the process configuration that launched the process
  - `pid`: the id of the process that updated its status
  - `status`: Possible status are `queued`, `running`, `success`, `error`
  - `message`: the error message if `status` is `error`.
- `message`: notifies that process has sent a message. The message sent by the process is in the `data` property
  - `id`: id of the process configuration that lanuched the process
  - `pid`: id of the process that sent a message
  - `data`: data sent by the process


