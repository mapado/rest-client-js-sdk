import { Mapping, ClassMetadata, Attribute, Relation } from '../src';

const cartMetadata = new ClassMetadata('carts');
cartMetadata.setAttributeList([
  new Attribute('@id', '@id', 'string', true),
  new Attribute('status'),
  new Attribute('clientPhoneNumber', 'clientPhoneNumber', 'phone_number'),
  new Attribute('createdAt', 'createdAt', 'datetime'),
  new Attribute('data', 'data', 'object'),
]);
cartMetadata.setRelationList([
  new Relation(Relation.ONE_TO_MANY, 'cart_items', 'cartItemList'),
  new Relation(Relation.MANY_TO_ONE, 'orders', 'order'),
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
  new Relation(Relation.MANY_TO_ONE, 'carts', 'cart'),
  new Relation(Relation.ONE_TO_MANY, 'cart_item_details', 'cartItemDetailList'),
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
