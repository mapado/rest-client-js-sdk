import { AbstractClient, ClassMetadata, Attribute } from '../../src/index';
import Relation, { MANY_TO_ONE, ONE_TO_MANY } from '../../src/Mapping/Relation';

class ProductRepository extends AbstractClient {}

describe('Test ClassMetadata', () => {
  test('test basic ClassMetadata', () => {
    const categoryMetadata = new ClassMetadata('categories');
    categoryMetadata.setAttributeList([
      new Attribute('id', 'id', 'string', true),
      new Attribute('name'),
    ]);

    const tagMetadata = new ClassMetadata('tags');
    tagMetadata.setAttributeList([
      new Attribute('id', 'id', 'string', true),
      new Attribute('name'),
    ]);

    const productMetadata = new ClassMetadata(
      'products',
      'my_products',
      ProductRepository
    );
    productMetadata.setAttributeList([
      new Attribute('@id', '@id', 'string', true),
      new Attribute('product_value', 'value'),
      new Attribute('currency'),
      new Attribute('amount', 'amount', 'integer'),
    ]);

    productMetadata.setRelationList([
      new Relation(MANY_TO_ONE, 'category'),
      new Relation(ONE_TO_MANY, 'tagList'),
    ]);

    // Product metadata
    expect(productMetadata.getIdentifierAttribute().serializedKey).toEqual(
      '@id'
    );

    expect(productMetadata.getRelation('inexistant_relation')).toBeUndefined();
    expect(productMetadata.getRelation('category').serializedKey).toEqual(
      'category'
    );
    expect(productMetadata.getRelation('tagList').serializedKey).toEqual(
      'tagList'
    );
    expect(productMetadata.getDefaultSerializedModel()).toEqual({
      '@id': null,
      product_value: null,
      currency: null,
      amount: null,
      category: null,
      tagList: [],
    });

    expect(productMetadata.key).toEqual('products');
    expect(productMetadata.pathRoot).toEqual('my_products');
    expect(productMetadata.repositoryClass).toEqual(ProductRepository);

    // Category metadata
    expect(categoryMetadata.key).toEqual('categories');
    expect(categoryMetadata.pathRoot).toEqual('categories');
    expect(categoryMetadata.repositoryClass).toEqual(AbstractClient);

    // Tag metadata
    expect(tagMetadata.getIdentifierAttribute().serializedKey).toEqual('id');
  });
});
