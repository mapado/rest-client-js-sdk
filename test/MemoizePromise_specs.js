/* global describe, it, afterEach */
import { expect } from 'chai';
import { memoizePromise } from '../src/decorator';

let count;
function someFunctionReturningAPromise(params) {
  return new Promise(resolve => {
    count++;
    return resolve(count);
  });
}

describe('Test 2 simultaneous calls return promises', () => {
  it('2 simultaneous calls with same params return different promise results', () => {
    count = 0;
    const promise1 = someFunctionReturningAPromise({ foo: 'bar' });
    const promise2 = someFunctionReturningAPromise({ foo: 'bar' });

    expect(promise1).to.be.an.instanceOf(Promise);
    expect(promise2).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(promise1).to.eventually.be.equals(1),
      expect(promise2).to.eventually.be.equals(2),
    ]);
  });

  it('2 simultaneous decorated calls with different params return different promise results', () => {
    const decoratedFunction = memoizePromise(someFunctionReturningAPromise);

    count = 0;
    const promise1 = decoratedFunction({ foo: 'bar' });
    const promise2 = decoratedFunction({ bar: 'foo' });

    expect(promise1).to.be.an.instanceOf(Promise);
    expect(promise2).to.be.an.instanceOf(Promise);

    expect(promise1).to.not.equals(promise2);

    return Promise.all([
      expect(promise1).to.eventually.be.equals(1),
      expect(promise2).to.eventually.be.equals(2),
    ]);
  });

  it('2 simultaneous decorated calls with same params return same promise result', () => {
    const decoratedFunction = memoizePromise(someFunctionReturningAPromise);

    count = 0;
    const promise1 = decoratedFunction({ foo: 'bar' });
    const promise2 = decoratedFunction({ foo: 'bar' });

    expect(promise1).to.be.an.instanceOf(Promise);
    expect(promise2).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(promise1).to.eventually.be.equals(1),
      expect(promise2).to.eventually.be.equals(1),
    ]);
  });
});

