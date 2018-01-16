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

  describe('mapping checker', () => {
    const mapping = new Mapping();
    const customerMetadata = new ClassMetadata('customer', 'customers');
    const cartMetadata = new ClassMetadata('cart', 'carts');

    beforeEach(() => {
      customerMetadata.setAttributeList([
        new Attribute('@id', '@id', 'string', true),
        new Attribute('name'),
      ]);
      customerMetadata.setRelationList([
        new Relation(Relation.ONE_TO_MANY, 'cart', 'cartList'),
      ]);

      cartMetadata.setAttributeList([
        new Attribute('@id', '@id', 'string', true),
        new Attribute('status'),
      ]);
      cartMetadata.setRelationList([
        new Relation(Relation.MANY_TO_ONE, 'customer', 'myCustomer'),
      ]);

      mapping.setMapping([customerMetadata, cartMetadata]);
    });

    test('valid mapping', () => {
      expect(mapping.isMappingValid()).toBe(true);
    });

    test('invalid mapping name', () => {
      cartMetadata.setRelationList([
        new Relation(Relation.MANY_TO_ONE, 'customerrrr', 'myCustomer'),
      ]);

      expect(mapping.isMappingValid()).toBe(false);
    });

    test('mapping without id attribute', () => {
      try {
        cartMetadata.setAttributeList([]);
      } catch (e) {
        expect(e.message).toMatch(/no identifier/);
      }

      expect(mapping.isMappingValid()).toBe(false);
    });

    test('many-to-one relation with attribute name ending with `List`', () => {
      customerMetadata.setRelationList([
        new Relation(Relation.MANY_TO_ONE, 'cart', 'cartList'),
      ]);

      expect(mapping.isMappingValid()).toBe(false);
    });

    test('one-to-many relation with attribute name nor plural nor ending with `List`', () => {
      customerMetadata.setRelationList([
        new Relation(Relation.ONE_TO_MANY, 'cart', 'cart'),
      ]);

      expect(mapping.isMappingValid()).toBe(false);

      customerMetadata.setRelationList([
        new Relation(Relation.ONE_TO_MANY, 'cart', 'carts'),
      ]);

      expect(mapping.isMappingValid()).toBe(true);
    });
  });
});
