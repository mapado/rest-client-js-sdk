import Mapping from '../src/Mapping';
import { Attribute, ClassMetadata, Relation } from '../src';

describe('test mapping', () => {
  test('default config', () => {
    let mapping = new Mapping();
    expect(mapping.idPrefix).toBe('');
    expect(mapping.getConfig()).toEqual({ collectionKey: 'hydra:member' });

    mapping = new Mapping('/v1', { collectionKey: 'coll', foo: 'bar' });
    expect(mapping.idPrefix).toBe('/v1');
    expect(mapping.getConfig()).toEqual({ collectionKey: 'coll', foo: 'bar' });

    expect(mapping.getMappingKeys()).toEqual([]);

    mapping.setMapping([new ClassMetadata('foo'), new ClassMetadata('bar')]);

    expect(mapping.getMappingKeys()).toEqual(['foo', 'bar']);

    expect(mapping.getClassMetadataByKey('unknown')).toBeNull();
    expect(mapping.getClassMetadataByKey('foo')).toBeInstanceOf(ClassMetadata);
  });

  test('mapping checker', () => {
    const mapping = new Mapping();

    const customerMetadata = new ClassMetadata('customer', 'customers');
    customerMetadata.setAttributeList([
      new Attribute('@id', '@id', 'string', true),
      new Attribute('name'),
    ]);
    customerMetadata.setRelationList([
      new Relation(Relation.ONE_TO_MANY, 'cart', 'cartList'),
    ]);

    const cartMetadata = new ClassMetadata('cart', 'carts');
    cartMetadata.setAttributeList([
      new Attribute('@id', '@id', 'string', true),
      new Attribute('status'),
    ]);
    cartMetadata.setRelationList([
      new Relation(Relation.MANY_TO_ONE, 'customer', 'myCustomer'),
    ]);

    mapping.setMapping([customerMetadata, cartMetadata]);

    expect(mapping.isMappingValid()).toBe(true);

    cartMetadata.setRelationList([
      new Relation(Relation.MANY_TO_ONE, 'customerrrr', 'myCustomer'),
    ]);

    expect(mapping.isMappingValid()).toBe(false);
    cartMetadata.setRelationList([
      new Relation(Relation.MANY_TO_ONE, 'customer', 'myCustomer'),
    ]);

    try {
      cartMetadata.setAttributeList([]);
    } catch (e) {
      expect(e.message).toMatch(/no identifier/);
    }

    expect(mapping.isMappingValid()).toBe(false);
  });
});
