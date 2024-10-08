import Mapping from './Mapping';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdkInterface from './RestClientSdkInterface';
// eslint-disable-next-line import/no-duplicates
import type { Config } from './RestClientSdkInterface';
import { Token } from './TokenGenerator/types';
import TokenStorageInterface from './TokenStorageInterface';
import UnitOfWork from './UnitOfWork';
import AbstractClient from './client/AbstractClient';
import JsSerializer from './serializer/JsSerializer';
import SerializerInterface from './serializer/SerializerInterface';
import { findClosestWord } from './utils/levenshtein';
import { Logger } from './utils/logging';
import { generateRepository } from './utils/repositoryGenerator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Entity = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export type SdkMetadata = Record<string, [any, Iterable<any>, undefined | any]>;
export type MetadataDefinition = {
  entity: Entity;
  list: Iterable<Entity>;
  // repository?: typeof AbstractClient;
};

export type SdkMetadata = Record<string, MetadataDefinition>;

class RestClientSdk<M extends SdkMetadata>
  implements RestClientSdkInterface<M> {
  config: Config;

  public tokenStorage: TokenStorageInterface<Token>;

  public serializer: SerializerInterface;

  public mapping: Mapping;

  public unitOfWork: UnitOfWork;

  #repositoryList: Partial<Record<keyof M, AbstractClient<M[keyof M]>>>;

  public readonly logger?: Logger;

  constructor(
    tokenStorage: TokenStorageInterface<Token>,
    config: Config,
    mapping: Mapping,
    serializer: SerializerInterface = new JsSerializer()
  ) {
    this.checkConfigValidity(config);

    if (!(mapping instanceof Mapping)) {
      throw new TypeError('mapping should be an instance of `Mapping`');
    }

    this.config = this._mergeWithBaseConfig(config);
    this.tokenStorage = tokenStorage;
    this.serializer = serializer;
    this.mapping = mapping;

    this.unitOfWork = new UnitOfWork(
      this.mapping,
      this.config.unitOfWorkEnabled
    );

    if (config.loggerEnabled) {
      this.logger = new Logger();
    }

    this.#repositoryList = {};
  }

  /**
   * get a repository by it's metadata "key" attribute
   *
   * @param {string} key the repository "key" (the first argument of `new ClassMetadata`)
   */
  getRepository<K extends keyof M & string>(key: K): AbstractClient<M[K]> {
    if (!this.#repositoryList[key]) {
      const metadata = this.mapping.getClassMetadataByKey(key);

      if (!metadata) {
        const closeKey = findClosestWord(key, this.mapping.getMappingKeys(), 5);

        const suggestions = closeKey ? ` Did you mean "${closeKey}"?` : '';

        throw new Error(
          `Unable to get metadata for repository "${key}".${suggestions}`
        );
      }

      // eslint-disable-next-line new-cap
      this.#repositoryList[key] = generateRepository<M[K]>(
        this,
        metadata,
        this.config.unitOfWorkEnabled
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (this.#repositoryList[key]! as unknown) as AbstractClient<M[K]>;
  }

  private _mergeWithBaseConfig(config: Config): Config {
    const newConfig = config;
    newConfig.useDefaultParameters =
      config.useDefaultParameters === undefined
        ? true
        : config.useDefaultParameters;

    newConfig.authorizationType = config.authorizationType || 'Bearer';

    return newConfig;
  }

  private checkConfigValidity(config: Config): void {
    if (!(config && config.path && config.scheme)) {
      throw new RangeError(
        `SDK config is not valid, it should contain a "path", a "scheme" parameter,
        and may contain a "port" and a "useDefaultParameters" parameter`
      );
    }
  }
}

export default RestClientSdk;
