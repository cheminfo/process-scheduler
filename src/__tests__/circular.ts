import circular from '../util/circular';

describe('circular dependencies schema', () => {
  test('has a simple circular dependencies', () => {
    let m = objToMap({
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
    const m = objToMap({
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
  const map = new Map();
  for (const key of Object.keys(obj)) {
    map.set(key, obj[key]);
  }
  return map;
}
