import Relation from '../../src/Mapping/Relation';

describe('Test Attribute', () => {
  test('test constructor', () => {
    const cartItemList = new Relation(
      Relation.ONE_TO_MANY,
      'cart_items',
      'cartItemList'
    );
    const category = new Relation(
      Relation.MANY_TO_ONE,
      'categories',
      'category',
      'categoryList'
    );

    expect(cartItemList.targetMetadataKey).toBe('cart_items');
    expect(cartItemList.serializedKey).toBe('cartItemList');
    expect(cartItemList.attributeName).toBe('cartItemList');
    expect(cartItemList.isManyToOne()).toBe(false);
    expect(cartItemList.isOneToMany()).toBe(true);

    expect(category.targetMetadataKey).toBe('categories');
    expect(category.serializedKey).toBe('category');
    expect(category.attributeName).toBe('categoryList');
    expect(category.isManyToOne()).toBe(true);
    expect(category.isOneToMany()).toBe(false);
  });
});
