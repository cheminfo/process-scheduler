'use strict';

const nodeSchedule = require('node-schedule');
const fork = require('child_process').fork;
const EventEmitter = require('events');
const constants = require('./constants');


class ProcessScheduler extends EventEmitter {
    constructor(options) {
        super();
        this.threads = options.threads;
        this._concurrencyRules = new Map();
        this.schedulers = new Map();
        this._queued = new Map();
        this._seqId = 0;

        if (typeof this.threads === 'number') {
            this.threads = {
                default: this.threads
            };
        }

        if (!this.threads.default) {
            this.threads.default = 0;
        }

        this.totalThreads = 0;

        for (let key in this.threads) {
            this.totalThreads += this.threads[key];
        }

        this._addProcess(options.processes || []);
    }

    schedule(options) {
        this._addProcess(options);
    }

    _addProcess(options) {
        if (options instanceof Array) {
            for (let i = 0; i < options.length; i++) {
                this._addProcess(options[i]);
            }
            return;
        }

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

        if (options.cronRule) {
            var scheduler = this.schedulers.get(options.id);
            if (scheduler) scheduler.cancel();
            this.schedulers.set(options.id, nodeSchedule.scheduleJob(options.cronRule, () => {
                this._queueProcess(options);
            }))
        } else {
            this._queueProcess(options);
        }
    }

    _queueProcess(options) {
        // Don't queue if already queued
        var id = options.id;
        if (this._queued.has(id)) {
            return;
        }

        // The setTimeout ensure that if cronjobs execute roughly at the same time
        // The are added to the queue before their dependencies
        if (options.deps) {
            setTimeout(() => {
                for (let i = 0; i < options.deps.length; i++) {
                    this._addProcess(options.deps[i]);
                }
            }, 250);
        }

        if (!options) {
            console.warn('Unreachable');
            return;
        }

        options = Object.assign({}, options);
        options.seqId = this._seqId++;
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
        var childProcess = fork(next.worker, {silent: true});
        childProcess.on('message', msg => {
            handleMessage.call(this, next, msg);
        });

        childProcess.on('exit', msg => {
            if (msg > 0) {
                handleMessage.call(this, next, {
                    status: 'error',
                    message: 'worker error'
                });
            }
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
    if (!messageValid(message)) {
        message = {
            status: 'error',
            message: 'Process sent invalid message'
        }
    }
    if (!message.status) {
        throw new Error('Expected worker to return with a status');
    }
    queued.message = message.message;
    setStatus.call(this, queued, message.status, true);
    this._queued.delete(queued.id);
    this._runNext();
}

function messageValid(message) {
    if (message === null || typeof message !== 'object') {
        return false;
    }
    if (constants.validStatus.indexOf(message.status) === -1) {
        return false;
    }

    return true;
}

module.exports = ProcessScheduler;