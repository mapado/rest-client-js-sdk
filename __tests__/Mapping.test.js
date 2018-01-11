import Mapping from '../src/Mapping';
import ClassMetadata from '../src/Mapping/ClassMetadata';

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
});
