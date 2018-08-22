'use strict';

const circular = require('../../src/util/circular');

describe('circular dependencies schema', () => {
  test('has a simple circular dependencies', () => {
    var m = objToMap({
      a: {
        id: 'a',
        deps: ['b']
      },
      b: {
        id: 'b',
        deps: ['a']
      }
    });

    expect(circular(m)).toBe(true);

    m = objToMap({
      a: {
        id: 'a',
        deps: ['c']
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

    expect(circular(m)).toBe(true);
  });

  test('has no circular dependencies', () => {
    var m = objToMap({
      a: {
        id: 'a',
        deps: ['b']
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

    expect(circular(m)).toBe(false);
  });
});

function objToMap(obj) {
  let map = new Map();
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    map.set(keys[i], obj[keys[i]]);
  }
  return map;
}
