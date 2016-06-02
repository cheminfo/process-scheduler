'use strict';

const nodeSchedule = require('node-schedule');
const fork = require('child_process').fork;
const EventEmitter = require('events');
const constants = require('./constants');
const circular = require('./util/circular');


class ProcessScheduler extends EventEmitter {
    constructor(options) {
        super();
        this._registered = new Map();
        this.threads = options.threads;
        this._concurrencyRules = new Map();
        this.schedulers = new Map();
        this._queued = new Map();
        this._seqId = 0;

        if (typeof this.threads === 'number') {
            this.threads = {
                default: this.threads
            };
        } else if(this.threads === undefined) {
            throw new Error('You must configure the number of threads');
        }

        if (!this.threads.default) {
            this.threads.default = 0;
        }

        this.totalThreads = 0;

        for (let key in this.threads) {
            this.totalThreads += this.threads[key];
        }
    }

    schedule(options) {
        if (options instanceof Array) {
            for (let i = 0; i < options.length; i++) {
                this._register(options[i]);
            }
            for (let i = 0; i < options.length; i++) {
                this._schedule(options[i].id);
            }
        } else {
            this._register(options);
            this._schedule(options.id);
        }
    }

    _schedule(id) {
        var options = this._registered.get(id);
        if (!options) {
            console.warn('schedule had no effect (tried to schedule unregistered process)');
            return;
        }
        if (options.cronRule) {
            var scheduler = this.schedulers.get(options.id);
            if (scheduler) scheduler.cancel();
            this.schedulers.set(options.id, nodeSchedule.scheduleJob(options.cronRule, () => {
                this._queueProcess(options);
            }))
        }
        if (options.immediate || !options.cronRule && options.immediate === undefined) {
            this._queueProcess(options);
        }
    }

    _register(options) {
        if (!options.id) {
            throw new Error('id is mandatory');
        }
        if (!options.worker) {
            throw new Error('worker is mandatory')
        }

        options.arg = options.arg || {};

        if (!options.type) {
            options.type = 'default';
        }

        if(!this.threads[options.type]) {
            console.warn('A task will never run because it has not associated number of threads');
        }

        if (options.noConcurrency) {
            if (!this._concurrencyRules.get(options.id)) {
                this._concurrencyRules.set(options.id, new Set());
            }
            for (let i = 0; i < options.noConcurrency.length; i++) {
                var id = options.noConcurrency[i];
                if (!this._concurrencyRules.has(id)) {
                    this._concurrencyRules.set(id, new Set());
                }
                this._concurrencyRules.get(id).add(options.id);
                this._concurrencyRules.get(options.id).add(id);
            }
        }

        this._registered.set(options.id, options);
        this._checkCircular(options.id);
    }

    trigger(id) {
        if (typeof id === 'string') {
            var options = this._registered.get(id);
        } else {
            options = id;
        }
        options = Object.assign({}, options, {immediate: true, cronRule: undefined});
        if (options) {
            this.schedule(options, true)
        } else {
            console.warn('trigger had no effect (tried to trigger unregistered process)');
        }
    }

    getQueued() {
        return getByStatus(this._queued, 'queued');
    }

    getRunning() {
        return getByStatus(this._queued, 'running');
    }


    _checkCircular(id) {
        if (circular(this._registered)) {
            this._registered.delete(id);
            throw new Error('Found circular dependency');
        }
    }

    _queueProcess(options) {
        // Don't queue if already queued
        var id = options.id;
        if (this._queued.has(id)) {
            return;
        }

        if (!options) {
            console.warn('Unreachable');
            return;
        }

        options = Object.assign({}, options);
        options.seqId = this._seqId++;
        options.pid = '' + options.seqId + '-' + Date.now();
        setStatus.call(this, options, 'queued', true);
        this._queued.set(id, options);
        this._runNext();
    }

    _runNext() {
        var running = getByStatus(this._queued, 'running');
        var runningIds = running.map(r => r.id);


        if (running.length >= this.totalThreads) {
            return;
        }

        var next, hasConcurrent;
        var queued = getByStatus(this._queued, 'queued');
        for (let i = 0; i < queued.length; i++) {
            let runningByType = running.filter(r => {
                return r.type === queued[i].type;
            });
            if (runningByType.length >= this.threads[queued[i].type]) {
                continue;
            }
            let noConcurrency = this._concurrencyRules.get(queued[i].id);
            if (!noConcurrency) {
                hasConcurrent = false;
            } else {
                hasConcurrent = runningIds.some(runningId => {
                    return noConcurrency.has(runningId);
                });
            }
            if (!hasConcurrent) {
                next = queued[i];
                break;
            }
        }
        if (!next) {
            return;
        }

        next.stderr = '';
        next.stdout = '';

        setStatus.call(this, next, 'running', true);
        next.started = Date.now();
        var childProcess = fork(next.worker, {silent: true});
        next.process = childProcess;
        childProcess.on('message', msg => {
            handleMessage.call(this, next, msg);
        });

        childProcess.on('exit', msg => {
            var status, message;
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
            setStatus.call(this, next, status, true);
            this._runNext();
        });

        childProcess.on('error', msg => {
            console.log('child process error', msg);
            //console.log(msg)
            //handleMessage.call(this, next, {
            //    status: 'error',
            //    message: 'worker error'
            //});
        });

        childProcess.stdout.on('data', data => {
            next.stdout += data.toString();
        });

        childProcess.stderr.on('data', data => {
            next.stderr += data.toString()
        });

        childProcess.send(next.arg);

        if (next.deps) {
            for (let i = 0; i < next.deps.length; i++) {
                this.trigger(next.deps[i]);
            }
        }

        this._runNext();
    }
}

function getByStatus(m, status) {
    var arr = [];
    m.forEach(val => {
        if (val.status === status) {
            arr.push(val);
        }
    });
    arr.sort((a, b) => a.seqId > b.seqId);
    return arr;
}

function setStatus(obj, status, emitChange) {
    if (obj.status !== status) {
        obj.status = status;
        if (emitChange) {
            this.emit('change', obj);
        }
    }
}

function handleMessage(queued, message) {
    var msg = Object.assign(queued);
    msg.data = message;
    this.emit('message', msg);
}

module.exports = ProcessScheduler;