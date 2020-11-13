/* eslint-disable import/prefer-default-export */
import type AbstractClient from '../client/AbstractClient';
import type ClassMetadata from '../Mapping/ClassMetadata';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdk from '../RestClientSdk';
// eslint-disable-next-line import/no-duplicates
import type { MetadataDefinition, SdkMetadata } from '../RestClientSdk';

export function generateRepository<D extends MetadataDefinition>(
  sdk: RestClientSdk<SdkMetadata>,
  metadata: ClassMetadata,
  isUnitOfWorkEnabled = true
): AbstractClient<D> {
  // eslint-disable-next-line new-cap
  return new metadata.repositoryClass(sdk, metadata, isUnitOfWorkEnabled);
}
