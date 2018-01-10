import {
  Mapping,
  ClassMetadata,
  Attribute,
  Relation,
  ONE_TO_MANY,
  MANY_TO_ONE,
} from '../src';

// const mapping = new Mapping('/v2');
//
// const productMetadata = new ClassMetadata(
//   'products', // key: mandatory, will be passed in your serializer
//   'my_products' // pathRoot: optional, the endpoint of your API: will be added to the mapping prefix ('/v1' here)
//   // SomeRepositoryClass // repositoryClass: optional, See "Overriding repository" for more detail
// );
//
// const idAttr = new Attribute(
//   '@id', // serializedKey: mandatory, the key returned from your API
//   'id', // attributeName: optional, the name in your entity, default to the `serializedKey` attribute
//   'string', // type: optional, default to `string`
//   true // isIdentifier: optional, default to `false`
// );
// const name = new Attribute('name');
// productMetadata.setAttributeList([idAttr, name]);
// productMetadata.setRelationList([new Relation('categoryList', ONE_TO_MANY)]);
//
// const categoryMetadata = new ClassMetadata('categories');
// categoryMetadata.setAttributeList([
//   new Attribute('id', 'id', 'string', true),
//   new Attribute('name'),
// ]);
// categoryMetadata.setRelationList([new Relation('product', MANY_TO_ONE)]);
//
// mapping.setMapping([productMetadata, categoryMetadata]);
//
// export default mapping;

const cartMetadata = new ClassMetadata('carts');
cartMetadata.setAttributeList([
  new Attribute('@id', '@id', 'string', true),
  new Attribute('status'),
  new Attribute('clientPhoneNumber', 'clientPhoneNumber', 'phone_number'),
  new Attribute('createdAt', 'createdAt', 'datetime'),
  new Attribute('data', 'data', 'object'),
]);
cartMetadata.setRelationList([
  new Relation(ONE_TO_MANY, 'cart_items', 'cartItemList'),
  new Relation(MANY_TO_ONE, 'orders', 'order'),
]);

const orderMetadata = new ClassMetadata('orders');
orderMetadata.setAttributeList([
  new Attribute('@id', '@id', 'string', true),
  new Attribute('customerPaidAmount', 'customerPaidAmount', 'integer'),
  new Attribute('status'),
]);

const cartItemMetadata = new ClassMetadata('cart_items');
cartItemMetadata.setAttributeList([
  new Attribute('@id', '@id', 'string', true),
  new Attribute('quantity', 'quantity', 'integer'),
]);
cartItemMetadata.setRelationList([
  new Relation(MANY_TO_ONE, 'carts', 'cart'),
  new Relation(ONE_TO_MANY, 'cart_item_details', 'cartItemDetailList'),
]);

const cartItemDetailMetadata = new ClassMetadata('cart_item_details');
cartItemDetailMetadata.setAttributeList([
  new Attribute('@id', '@id', 'string', true),
  new Attribute('name'),
]);

const mapping = new Mapping('/v12');

mapping.setMapping([
  cartMetadata,
  orderMetadata,
  cartItemMetadata,
  cartItemDetailMetadata,
]);

export { cartMetadata, orderMetadata };
export default mapping;
