'use strict';

const circular = require('../src/util/circular');

describe('circular dependencies', function () {
    it('has a simple circular dependencies', function () {
        var m = objToMap({
            a: {
                id: 'a',
                deps:['b']
            },
            b: {
                id: 'b',
                deps: ['a']
            }
        });

        circular(m).should.equal(true);

        m = objToMap({
            a: {
                id: 'a',
                deps:['c']
            },
            b: {
                id: 'b',
                deps: ['a']
            },
            c: {
                id: 'c',
                deps: ['b']
            }
        });

        circular(m).should.equal(true);
    });

    it('has no circular dependencies', function () {
        var m = objToMap({
            a: {
                id: 'a',
                deps:['b']
            },
            b: {
                id: 'b',
                deps: ['c']
            },
            c: {
                id: 'c',
                deps: []
            }
        });

        circular(m).should.equal(false);
    });
});

function objToMap(obj) {
    let map = new Map();
    let keys = Object.keys(obj);
    for(let i=0; i<keys.length; i++) {
        map.set(keys[i], obj[keys[i]]);
    }
    return map;
}