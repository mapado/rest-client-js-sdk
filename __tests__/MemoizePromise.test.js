import { memoizePromise } from '../src/decorator';

let count;
function someFunctionReturningAPromise() {
  return new Promise(resolve => {
    count++; // eslint-disable-line no-plusplus
    return resolve(count);
  });
}

describe('Test 2 simultaneous calls return promises', () => {
  test('2 simultaneous calls with same params return different promise results', () => {
    count = 0;
    const promise1 = someFunctionReturningAPromise({ foo: 'bar' });
    const promise2 = someFunctionReturningAPromise({ foo: 'bar' });

    expect(promise1).toBeInstanceOf(Promise);
    expect(promise2).toBeInstanceOf(Promise);

    return Promise.all([
      expect(promise1).resolves.toEqual(1),
      expect(promise2).resolves.toEqual(2),
    ]);
  });

  test('2 simultaneous decorated calls with different params return different promise results', () => {
    const decoratedFunction = memoizePromise(someFunctionReturningAPromise);

    count = 0;
    const promise1 = decoratedFunction({ foo: 'bar' });
    const promise2 = decoratedFunction({ bar: 'foo' });

    expect(promise1).toBeInstanceOf(Promise);
    expect(promise2).toBeInstanceOf(Promise);

    expect(promise1).not.toBe(promise2);

    return Promise.all([
      expect(promise1).resolves.toEqual(1),
      expect(promise2).resolves.toEqual(2),
    ]);
  });

  test('2 simultaneous decorated calls with same params return same promise result', () => {
    const decoratedFunction = memoizePromise(someFunctionReturningAPromise);

    count = 0;
    const promise1 = decoratedFunction({ foo: 'bar' });
    const promise2 = decoratedFunction({ foo: 'bar' });

    expect(promise1).toBeInstanceOf(Promise);
    expect(promise2).toBeInstanceOf(Promise);

    return Promise.all([
      expect(promise1).resolves.toEqual(1),
      expect(promise2).resolves.toEqual(1),
    ]);
  });
});
