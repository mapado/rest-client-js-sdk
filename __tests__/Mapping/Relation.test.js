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

    const tag = new Relation(
      Relation.MANY_TO_MANY,
      'categories',
      'category',
      'categoryList'
    );

    const customer = new Relation(Relation.ONE_TO_ONE, 'customer', 'customer');

    expect(cartItemList.targetMetadataKey).toBe('cart_items');
    expect(cartItemList.serializedKey).toBe('cartItemList');
    expect(cartItemList.attributeName).toBe('cartItemList');
    expect(cartItemList.isOneToOne()).toBe(false);
    expect(cartItemList.isManyToOne()).toBe(false);
    expect(cartItemList.isOneToMany()).toBe(true);
    expect(cartItemList.isManyToMany()).toBe(false);
    expect(cartItemList.isRelationToMany()).toBe(true);
    expect(cartItemList.isRelationToOne()).toBe(false);

    expect(category.targetMetadataKey).toBe('categories');
    expect(category.serializedKey).toBe('category');
    expect(category.attributeName).toBe('categoryList');
    expect(category.isOneToOne()).toBe(false);
    expect(category.isManyToOne()).toBe(true);
    expect(category.isOneToMany()).toBe(false);
    expect(category.isManyToMany()).toBe(false);
    expect(category.isRelationToMany()).toBe(false);
    expect(category.isRelationToOne()).toBe(true);

    expect(tag.targetMetadataKey).toBe('categories');
    expect(tag.serializedKey).toBe('category');
    expect(tag.attributeName).toBe('categoryList');
    expect(tag.isOneToOne()).toBe(false);
    expect(tag.isManyToOne()).toBe(false);
    expect(tag.isOneToMany()).toBe(false);
    expect(tag.isManyToMany()).toBe(true);
    expect(tag.isRelationToMany()).toBe(true);
    expect(tag.isRelationToOne()).toBe(false);

    expect(customer.targetMetadataKey).toBe('customer');
    expect(customer.serializedKey).toBe('customer');
    expect(customer.attributeName).toBe('customer');
    expect(customer.isOneToOne()).toBe(true);
    expect(customer.isManyToOne()).toBe(false);
    expect(customer.isOneToMany()).toBe(false);
    expect(customer.isManyToMany()).toBe(false);
    expect(customer.isRelationToMany()).toBe(false);
    expect(customer.isRelationToOne()).toBe(true);
  });
});
