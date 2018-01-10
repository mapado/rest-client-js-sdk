import { Map, Record } from 'immutable';
import unitOfWorkMapping, {
  cartMetadata,
  orderMetadata,
} from '../__mocks__/unitOfWorkMapping';
import UnitOfWork from '../src/UnitOfWork';

let unitOfWork = null;
beforeEach(() => {
  unitOfWork = new UnitOfWork(unitOfWorkMapping);
});
describe('UnitOfWork', () => {
  test('register unit of work', () => {
    const entity = { foo: 'bar' };
    unitOfWork.registerClean(1, entity);

    expect(unitOfWork.getDirtyEntity(1).foo).toBe('bar');
  });

  test('immutability of objects', () => {
    const entity = { foo: 'bar' };
    expect(unitOfWork.getDirtyEntity(1)).toBeUndefined();
    unitOfWork.registerClean(1, entity);

    entity.foo = 'baz';
    expect(unitOfWork.getDirtyEntity(1).foo).toBe('bar');
  });

  test('immutability of immutable maps', () => {
    let entity = new Map({ foo: 'bar' });
    unitOfWork.registerClean(1, entity);
    expect(unitOfWork.getDirtyEntity(1).get('foo')).toBe('bar');
    entity = entity.set('foo', 'baz');
    expect(entity.get('foo')).toBe('baz');
    expect(unitOfWork.getDirtyEntity(1).get('foo')).toBe('bar');
  });

  test('immutability of immutable records', () => {
    class Entity extends Record({ foo: null }) {}
    let entity = new Entity({ foo: 'bar' });
    unitOfWork.registerClean(1, entity);
    expect(unitOfWork.getDirtyEntity(1).foo).toBe('bar');
    entity = entity.set('foo', 'baz');
    expect(entity.foo).toBe('baz');
    expect(unitOfWork.getDirtyEntity(1).foo).toBe('bar');
  });

  test('clear', () => {
    unitOfWork.registerClean(1, { foo: 'bar' });

    expect(unitOfWork.getDirtyEntity(1).foo).toBe('bar');
    unitOfWork.clear(1);
    expect(unitOfWork.getDirtyEntity(1)).toBeUndefined();
  });

  test('get dirty data simple entity', () => {
    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1' },
        { '@id': '/v12/carts/1' },
        cartMetadata
      )
    ).toEqual({});

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          order: '/v1/orders/1',
          data: null,
        },
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          order: '/v1/orders/1',
          data: null,
        },
        cartMetadata
      )
    ).toEqual({});

    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1', status: 'payed' },
        { '@id': '/v12/carts/1', status: 'waiting' },
        cartMetadata
      )
    ).toEqual({ status: 'payed' });

    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1', status: null },
        { '@id': '/v12/carts/1', status: 'waiting' },
        cartMetadata
      )
    ).toEqual({ status: null });

    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1', status: null },
        { '@id': '/v12/carts/1', data: { foo: 'bar' } },
        cartMetadata
      )
    ).toEqual({ status: null });

    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/2', status: 'payed' },
        { '@id': '/v12/carts/1', status: 'waiting' },
        cartMetadata
      )
    ).toEqual({ '@id': '/v12/carts/2', status: 'payed' });

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          data: {
            foo: 'bar',
            loo: 'baz',
          },
        },
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          data: {
            foo: 'bar',
          },
        },
        cartMetadata
      )
    ).toEqual({ data: { foo: 'bar', loo: 'baz' } });

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          data: {
            foo: 'bar',
            bad: 'baz',
          },
        },
        {
          '@id': '/v12/carts/1',
          status: 'payed',
          data: {
            foo: 'bar',
            bad: 'baz',
          },
        },
        cartMetadata
      )
    ).toEqual({});
  });

  test('get dirty data with more data', () => {
    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1' },
        { '@id': '/v12/carts/1', status: 'ok' },
        cartMetadata
      )
    ).toEqual({});
  });

  test('get dirty data many to one relation', () => {
    // string relation ids
    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1', order: '/v12/orders/2' },
        { '@id': '/v12/carts/1', order: { '@id': '/v12/orders/1' } },
        cartMetadata
      )
    ).toEqual({ order: '/v12/orders/2' });

    // only order id changed
    expect(
      unitOfWork.getDirtyData(
        { '@id': '/v12/carts/1', order: { '@id': '/v12/orders/2' } },
        { '@id': '/v12/carts/1', order: '/v12/orders/1' },
        cartMetadata
      )
    ).toEqual({ order: { '@id': '/v12/orders/2' } });

    // only order id changed
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          order: { '@id': '/v12/orders/2', status: 'payed' },
        },
        {
          '@id': '/v12/carts/1',
          order: { '@id': '/v12/orders/1', status: 'payed' },
        },
        cartMetadata
      )
    ).toEqual({ order: { '@id': '/v12/orders/2' } });

    // with data alteration in order status
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          order: { '@id': '/v12/orders/2', status: 'payed' },
        },
        {
          '@id': '/v12/carts/1',
          order: { '@id': '/v12/orders/1', status: 'waiting' },
        },
        cartMetadata
      )
    ).toEqual({ order: { '@id': '/v12/orders/2', status: 'payed' } });
  });

  test('get dirty data many to one no changes', () => {
    // only with id
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            '/v12/cart_items/1',
            '/v12/cart_items/2',
            '/v12/cart_items/3',
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            '/v12/cart_items/1',
            '/v12/cart_items/2',
            '/v12/cart_items/3',
          ],
        },
        cartMetadata
      )
    ).toEqual({});

    // id and quantity
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            { '@id': '/v12/cart_items/1', quantity: 1 },
            { '@id': '/v12/cart_items/2', quantity: 1 },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            { '@id': '/v12/cart_items/1', quantity: 1 },
            { '@id': '/v12/cart_items/2', quantity: 1 },
          ],
        },
        cartMetadata
      )
    ).toEqual({});
  });

  test('get dirty data many to one remove item', () => {
    // only with id
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: ['/v12/cart_items/1', '/v12/cart_items/2'],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            '/v12/cart_items/1',
            '/v12/cart_items/2',
            '/v12/cart_items/3',
          ],
        },
        cartMetadata
      )
    ).toEqual({ cartItemList: ['/v12/cart_items/1', '/v12/cart_items/2'] });

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: ['/v12/cart_items/1', '/v12/cart_items/3'],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            '/v12/cart_items/1',
            '/v12/cart_items/2',
            '/v12/cart_items/3',
          ],
        },
        cartMetadata
      )
    ).toEqual({ cartItemList: ['/v12/cart_items/1', '/v12/cart_items/3'] });

    // with object changes
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 2,
            },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 2,
            },
            {
              '@id': '/v12/cart_items/2',
              quantity: 1,
            },
          ],
        },
        cartMetadata
      )
    ).toEqual({ cartItemList: [{ '@id': '/v12/cart_items/1' }] });

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/2',
              quantity: 1,
            },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 2,
            },
            {
              '@id': '/v12/cart_items/2',
              quantity: 1,
            },
          ],
        },
        cartMetadata
      )
    ).toEqual({ cartItemList: [{ '@id': '/v12/cart_items/2' }] });

    // with quantity changes
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/2',
              quantity: 2,
            },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 2,
            },
            {
              '@id': '/v12/cart_items/2',
              quantity: 1,
            },
          ],
        },
        cartMetadata
      )
    ).toEqual({ cartItemList: [{ '@id': '/v12/cart_items/2', quantity: 2 }] });
  });

  test('get dirty data many to one add item', () => {
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            '/v12/cart_items/1',
            '/v12/cart_items/2',
            '/v12/cart_items/3',
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: ['/v12/cart_items/1', '/v12/cart_items/2'],
        },
        cartMetadata
      )
    ).toEqual({
      cartItemList: [
        '/v12/cart_items/1',
        '/v12/cart_items/2',
        '/v12/cart_items/3',
      ],
    });

    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            { '@id': '/v12/cart_items/1', quantity: 1 },
            { '@id': '/v12/cart_items/2', quantity: 1 },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [{ '@id': '/v12/cart_items/1', quantity: 1 }],
        },
        cartMetadata
      )
    ).toEqual({
      cartItemList: [
        { '@id': '/v12/cart_items/1' },
        { '@id': '/v12/cart_items/2', quantity: 1 },
      ],
    });
  });

  test('get dirty data many to one update item', () => {
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            { '@id': '/v12/cart_items/1', quantity: 2 },
            { '@id': '/v12/cart_items/2', quantity: 1 },
          ],
        },
        {
          '@id': '/v12/carts/1',
          cartItemList: [
            { '@id': '/v12/cart_items/1', quantity: 1 },
            { '@id': '/v12/cart_items/2', quantity: 1 },
          ],
        },
        cartMetadata
      )
    ).toEqual({
      cartItemList: [
        { '@id': '/v12/cart_items/1', quantity: 2 },
        { '@id': '/v12/cart_items/2' },
      ],
    });
  });

  test('get dirty data many to one recursive item', () => {
    expect(
      unitOfWork.getDirtyData(
        {
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 1,
              cartItemDetailList: [
                { '@id': '/v12/cart_item_details/1', name: '' },
              ],
            },
            { '@id': '/v12/cart_items/2', quantity: 1 },
            {
              '@id': '/v12/cart_items/3',
              quantity: 1,
              cartItemDetailList: [
                { '@id': '/v12/cart_item_details/2', name: '' },
              ],
            },
          ],
        },
        {
          cartItemList: [
            {
              '@id': '/v12/cart_items/1',
              quantity: 2,
              cartItemDetailList: [
                { '@id': '/v12/cart_item_details/1', name: 'foo' },
              ],
            },
            { '@id': '/v12/cart_items/3', quantity: 1 },
          ],
        },
        cartMetadata
      )
    ).toEqual({
      cartItemList: [
        {
          '@id': '/v12/cart_items/1',
          quantity: 1,
          cartItemDetailList: [{ '@id': '/v12/cart_item_details/1', name: '' }],
        },
        { '@id': '/v12/cart_items/2', quantity: 1 },
        {
          '@id': '/v12/cart_items/3',
          cartItemDetailList: [{ '@id': '/v12/cart_item_details/2', name: '' }],
        },
      ],
    });
  });

  test('get dirty data one to many update data', () => {
    expect(
      unitOfWork.getDirtyData(
        {
          '@id': '/v12/carts/1',
          order: {
            '@id': '/v12/orders/1',
            customerPaidAmount: 1500,
            status: 'awaiting_payment',
          },
        },
        {
          '@id': '/v12/carts/1',
          order: {
            '@id': '/v12/orders/1',
            customerPaidAmount: 1000,
            status: 'awaiting_payment',
          },
        },
        cartMetadata
      )
    ).toEqual({
      order: {
        '@id': '/v12/orders/1',
        customerPaidAmount: 1500,
      },
    });
  });
});
