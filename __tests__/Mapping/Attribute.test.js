import Attribute from '../../src/Mapping/Attribute';

describe('Test Attribute', () => {
  test('test constructor', () => {
    const id = new Attribute('id', 'id', 'string', true);
    const value = new Attribute('product_value', 'value');
    const currency = new Attribute('currency');
    const amount = new Attribute('amount', 'amount', 'integer');

    expect(id.serializedKey).toEqual('id');
    expect(id.attributeName).toEqual('id');
    expect(id.type).toEqual('string');
    expect(id.isIdentifier).toEqual(true);

    expect(value.serializedKey).toEqual('product_value');
    expect(value.attributeName).toEqual('value');
    expect(value.type).toEqual('string');
    expect(value.isIdentifier).toEqual(false);

    expect(currency.serializedKey).toEqual('currency');
    expect(currency.attributeName).toEqual('currency');
    expect(currency.type).toEqual('string');
    expect(currency.isIdentifier).toEqual(false);

    expect(amount.serializedKey).toEqual('amount');
    expect(amount.attributeName).toEqual('amount');
    expect(amount.type).toEqual('integer');
    expect(amount.isIdentifier).toEqual(false);
  });
});
