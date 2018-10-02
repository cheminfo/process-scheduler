import { ChildProcess, fork } from 'child_process';
import { EventEmitter } from 'events';

import * as debugLib from 'debug';
import * as nodeSchedule from 'node-schedule';
import StrictEventEmitter from 'strict-event-emitter-types';

import circular from './util/circular';

const debug = debugLib('process-scheduler');

interface IEvents {
  message: IMessageData;
  change: IChangeData;
}

export interface IProcessSchedulerConfig {
  threads: number | IThreadConfig;
}

export type Status = 'error' | 'success' | 'queued' | 'running';

export interface IChangeData {
  id: string;
  pid: string;
  status: Status;
  reason?: string;
  stderr?: string;
  stdout?: string;
  message?: string;
}

export interface IMessageData {
  id: string;
  pid: string;
  data: any;
}

export interface IProcessOptions {
  id: string;
  worker: string;
  type?: string;
  noConcurrency?: string[];
  deps?: string[];
  cronRule?: string;
  immediate?: boolean;
  retryTimeout?: number;
  arg?: any;
}

interface IStatusOptions {
  emitChange?: boolean;
  reason?: string;
}

export interface IThreadConfig {
  [key: string]: number;
}

interface IQueuedProcess extends IProcessOptions {
  seqId: number;
  pid: string;
  type: string;
  status: Status;
  reason?: string; // the reason for the process to be in its status
  stderr: string;
  stdout: string;
  started: number;
  process: ChildProcess;
  message?: string;
  deps?: string[];
}

export class ProcessScheduler extends (EventEmitter as {
  new (): StrictEventEmitter<EventEmitter, IEvents>;
}) {
  private totalThreads: number;
  private threads: IThreadConfig;
  private schedulers: Map<string, nodeSchedule.Job>;
  private _registered: Map<string, IProcessOptions>;
  private _concurrencyRules: Map<string, Set<string>>;
  private _queued: Map<string, IQueuedProcess>;
  private _seqId: number;

  constructor(config: IProcessSchedulerConfig) {
    super();

    if (typeof config !== 'object' || config === null) {
      throw new TypeError('options object is mandatory');
    }

    const { threads } = config;
    if (typeof threads === 'number') {
      this.threads = { default: threads };
    } else if (typeof threads === 'object' && threads !== null) {
      // todo validate structure?
      this.threads = threads;
    } else {
      throw new TypeError(
        'threads must be a number or a threads config object'
      );
    }
    if (!this.threads.default) {
      this.threads.default = 0;
    }

    this.totalThreads = 0;
    for (const key in this.threads) {
      this.totalThreads += this.threads[key];
    }

    this._registered = new Map();
    this._concurrencyRules = new Map();
    this.schedulers = new Map();
    this._queued = new Map();
    this._seqId = 0;
  }

  public schedule(options: IProcessOptions | IProcessOptions[]) {
    if (Array.isArray(options)) {
      for (const option of options) {
        this._register(option);
      }
      for (const option of options) {
        this._schedule(option.id);
      }
    } else {
      this._register(options);
      this._schedule(options.id);
    }
  }

  public trigger(id: string | IProcessOptions) {
    debug(`trigger ${id}`);
    let options;
    if (typeof id === 'string') {
      options = this._registered.get(id);
    } else {
      options = id;
    }
    if (!options) {
      debug('trigger had no effect (tried to trigger unregistered process)');
      return 1;
    }
    options = Object.assign({}, options, {
      immediate: true,
      cronRule: undefined
    });
    this.schedule(options);
    return 0;
  }

  public getQueued() {
    return getByStatus(this._queued, 'queued');
  }

  public getRunning() {
    return getByStatus(this._queued, 'running');
  }

  private _schedule(id: string) {
    debug(`schedule ${id}`);
    const options = this._registered.get(id);
    if (!options) {
      debug('schedule had no effect (tried to schedule unregistered process)');
      return;
    }
    if (options.cronRule) {
      const scheduler = this.schedulers.get(options.id);
      if (scheduler) {
        scheduler.cancel();
      }
      this.schedulers.set(
        options.id,
        nodeSchedule.scheduleJob(options.cronRule, () => {
          debug('queue from cronRule');
          this._queueProcess(options, 'from cronRule');
        })
      );
    }
    if (
      options.immediate ||
      (!options.cronRule && options.immediate === undefined)
    ) {
      debug('queue from immediate');
      this._queueProcess(options, 'from trigger');
    }
  }

  private _register(options: IProcessOptions) {
    debug(`register ${options.id}`);
    if (!options.id) {
      throw new Error('id is mandatory');
    }
    if (!options.worker) {
      throw new Error('worker is mandatory');
    }

    options.arg = options.arg || {};

    if (!options.type) {
      options.type = 'default';
    }

    if (!this.threads[options.type]) {
      debug(
        'A task will never run because it has not associated number of threads'
      );
    }

    this._registered.set(options.id, options);
    if (circular(this._registered)) {
      this._registered.delete(options.id);
      throw new Error('Found circular dependency');
    }

    if (options.noConcurrency) {
      if (!this._concurrencyRules.get(options.id)) {
        this._concurrencyRules.set(options.id, new Set());
      }
      for (const id of options.noConcurrency) {
        let concurrencyRules = this._concurrencyRules.get(id);
        if (!concurrencyRules) {
          concurrencyRules = new Set();
          this._concurrencyRules.set(id, concurrencyRules);
        }
        concurrencyRules.add(options.id);
        concurrencyRules.add(id);
      }
    }
  }

  private _queueProcess(options: IProcessOptions, reason: string) {
    debug(`queue process ${options.id}`);
    // Don't queue if already queued
    const id = options.id;
    if (this._queued.has(id)) {
      debug(`not queuing ${id}, already in queue`);
      return;
    }

    const queueOptions: IQueuedProcess = Object.assign(
      {},
      options
    ) as IQueuedProcess;
    queueOptions.seqId = this._seqId++;
    queueOptions.pid = `${queueOptions.seqId}-${Date.now()}`;
    setStatus(this, queueOptions, 'queued', {
      emitChange: true,
      reason
    });
    this._queued.set(id, queueOptions);
    debug(`${id} added to queue`);
    this._runNext();
  }

  private _runNext() {
    debug('run next');
    const running = getByStatus(this._queued, 'running');
    const runningIds = running.map((r) => r.id);
    const queued = getByStatus(this._queued, 'queued');

    if (running.length >= this.totalThreads) {
      debug(
        `not running next, running threads (${running.length}) reached maximum`
      );
      for (const queuedElement of queued) {
        setStatus(this, queuedElement, 'queued', {
          emitChange: true,
          reason: 'threads'
        });
      }
      return;
    }

    let nextProcess: IQueuedProcess | undefined;
    let hasConcurrent: boolean;
    for (const queuedElement of queued) {
      const runningByType = running.filter((r) => {
        return r.type === queuedElement.type;
      });
      if (runningByType.length >= this.threads[queuedElement.type]) {
        setStatus(this, queuedElement, 'queued', {
          emitChange: true,
          reason: `too many threads of type ${queuedElement.type}`
        });
        continue;
      }
      const noConcurrency = this._concurrencyRules.get(queuedElement.id);
      if (!noConcurrency) {
        hasConcurrent = false;
      } else {
        hasConcurrent = runningIds.some((runningId) => {
          return noConcurrency.has(runningId);
        });
      }
      if (!hasConcurrent) {
        nextProcess = queuedElement;
        break;
      } else {
        setStatus(this, queuedElement, 'queued', {
          emitChange: true,
          reason: 'concurrent process running'
        });
      }
    }

    if (!nextProcess) {
      debug(
        `not running next (nothing eligible). Queue length is ${queued.length}.`
      );
      return;
    }

    const next = nextProcess;

    next.stderr = '';
    next.stdout = '';

    setStatus(this, next, 'running', {
      emitChange: true
    });
    next.started = Date.now();
    debug(`starting a process: ${next.id}`);

    const childProcess = fork(next.worker, [], { silent: true });
    next.process = childProcess;
    childProcess.on('message', (msg) => {
      handleMessage(this, next, msg);
    });

    childProcess.on('exit', (msg) => {
      debug(`process exited with message ${msg}`);
      let status: Status;
      let message;
      if (msg > 0) {
        status = 'error';
        message = 'worker error';
        if (typeof next.retryTimeout === 'number') {
          setTimeout(() => {
            this.trigger(next.id);
          }, next.retryTimeout * 1000);
        }
      } else {
        status = 'success';
      }
      next.message = message;
      this._queued.delete(next.id);
      setStatus(this, next, status, {
        emitChange: true
      });
      this._runNext();
    });

    childProcess.on('error', (msg) => {
      debug(`child process error: ${msg}`);
      // handleMessage(this, next, {
      //    status: 'error',
      //    message: 'worker error'
      // });
    });

    childProcess.stdout.setEncoding('utf8');
    childProcess.stdout.on('data', (data) => {
      next.stdout += data;
    });

    childProcess.stderr.setEncoding('utf8');
    childProcess.stderr.on('data', (data) => {
      next.stderr += data;
    });

    childProcess.send(next.arg);

    if (next.deps) {
      for (const nextDep of next.deps) {
        this.trigger(nextDep);
      }
    }

    this._runNext();
  }
}

function getByStatus(m: Map<string, IQueuedProcess>, status: Status) {
  const arr: IQueuedProcess[] = [];
  m.forEach((val) => {
    if (val.status === status) {
      arr.push(val);
    }
  });
  arr.sort((a, b) => b.seqId - a.seqId);
  return arr;
}

function setStatus(
  scheduler: ProcessScheduler,
  obj: IQueuedProcess,
  status: Status,
  options: IStatusOptions = {}
) {
  if (obj.status !== status || obj.reason !== options.reason) {
    obj.status = status;
    obj.reason = options.reason;
    if (options.emitChange) {
      scheduler.emit('change', {
        id: obj.id,
        pid: obj.pid,
        status: obj.status,
        reason: obj.reason,
        message: obj.message,
        stdout: obj.stdout,
        stderr: obj.stderr
      });
    }
  }
}

function handleMessage(
  scheduler: ProcessScheduler,
  queued: IQueuedProcess,
  message: any
) {
  scheduler.emit('message', { id: queued.id, pid: queued.pid, data: message });
}
