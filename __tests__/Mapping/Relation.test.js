import Relation, { ONE_TO_MANY, MANY_TO_ONE } from '../../src/Mapping/Relation';

describe('Test Attribute', () => {
  test('test constructor', () => {
    const cartItemList = new Relation(ONE_TO_MANY, 'cartItemList');
    const category = new Relation(MANY_TO_ONE, 'category');

    expect(cartItemList.serializedKey).toBe('cartItemList');
    expect(cartItemList.isManyToOne()).toBe(false);
    expect(cartItemList.isOneToMany()).toBe(true);

    expect(category.serializedKey).toBe('category');
    expect(category.isManyToOne()).toBe(true);
    expect(category.isOneToMany()).toBe(false);
  });
});
