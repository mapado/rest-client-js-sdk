import type ClassMetadata from '../Mapping/ClassMetadata';

import type RestClientSdk from '../RestClientSdk';

import type { MetadataDefinition, SdkMetadata } from '../RestClientSdk';
import type AbstractClient from '../client/AbstractClient';

export function generateRepository<D extends MetadataDefinition>(
  sdk: RestClientSdk<SdkMetadata>,
  metadata: ClassMetadata,
  isUnitOfWorkEnabled = true
): AbstractClient<D> {
  // eslint-disable-next-line new-cap
  return new metadata.repositoryClass(sdk, metadata, isUnitOfWorkEnabled);
}
