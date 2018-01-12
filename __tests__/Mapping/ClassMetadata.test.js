import { AbstractClient, ClassMetadata, Attribute } from '../../src/index';
import Relation from '../../src/Mapping/Relation';

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
      new Relation(Relation.MANY_TO_ONE, 'categories', 'category'),
      new Relation(Relation.ONE_TO_MANY, 'tags', 'tagList'),
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

  test('test attribute list', () => {
    const categoryMetadata = new ClassMetadata('categories');
    const attributeList = [
      new Attribute('id', 'id', 'string', true),
      new Attribute('name'),
    ];
    categoryMetadata.setAttributeList(attributeList);
    categoryMetadata.setRelationList([
      new Relation(Relation.ONE_TO_MANY, 'products', 'productList'),
      new Relation(Relation.MANY_TO_ONE, 'categories', 'parent'),
    ]);

    expect(categoryMetadata.getAttributeList()).toEqual({
      id: new Attribute('id', 'id', 'string', true),
      name: new Attribute('name'),
      productList: new Attribute('productList', 'productList', 'array'),
      parent: new Attribute('parent', 'parent', 'object'),
    });
  });
});
