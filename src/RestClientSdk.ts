import JsSerializer from './serializer/JsSerializer';
import UnitOfWork from './UnitOfWork';
import Mapping from './Mapping';
import TokenStorage from './TokenStorage';
import SerializerInterface from './serializer/SerializerInterface';
import AbstractClient from './client/AbstractClient';
import { Token } from './TokenGenerator/types';

type Config = {
  path: string;
  scheme: string;
  port?: number;
  segment?: string;
  authorizationType: string; // default to "Bearer", but can be "Basic" or anything
  useDefaultParameters?: boolean;
};

class RestClientSdk<
  Metadata extends Record<string, [any, Iterable<any>]>,
  T extends Token
> {
  config: Config;

  public tokenStorage: TokenStorage<T>;

  public serializer: SerializerInterface;

  public mapping: Mapping;

  public unitOfWork: UnitOfWork;

  #repositoryList: Partial<
    Record<keyof Metadata, AbstractClient<Metadata, any, any, any>>
  >;

  constructor(
    tokenStorage: TokenStorage<T>,
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

    this.unitOfWork = new UnitOfWork(this.mapping);

    this.#repositoryList = {};
  }

  getRepository<
    K extends keyof Metadata & string,
    E extends Metadata[K][0],
    L extends Metadata[K][1] & Iterable<E>
  >(key: K): AbstractClient<Metadata, E, L, T> {
    if (!this.#repositoryList[key]) {
      const metadata = this.mapping.getClassMetadataByKey(key);

      if (!metadata) {
        throw new Error(`Unable to get metadata for repository ${key}`);
      }

      // eslint-disable-next-line new-cap
      this.#repositoryList[key] = new metadata.repositoryClass(this, metadata);
    }

    return this.#repositoryList[key] as AbstractClient<Metadata, E, L, T>;
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
