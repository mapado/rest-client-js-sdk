import { convertToRecord } from '../client/headerUtils';

type SdkRequest = RequestInit & { url: string };

// type SdkResponse = Partial<Response>;
type SdkResponse = {
  status: number;
  headers: Record<string, string>;
};

const generateId = () =>
  `rest-client-sdk|${Date.now()}-${
    Math.floor(Math.random() * (9e12 - 1)) + 1e12
  }`;

export type SerializableRequest = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type Log = {
  id: string;
  request?: SerializableRequest;
  response?: SdkResponse;
  logTimes: {
    request?: number;
    response?: number;
  };
};

export type LoggerHistory = Array<Log>;

function serializeRequest(req: SdkRequest): SerializableRequest {
  const request = { ...req }; // Make a clone, useful for doing destructive things
  return {
    method: request.method, // The Request Method, e.g. GET, POST, DELETE
    url: request.url, // The URL
    headers: request.headers ? convertToRecord(request.headers) : undefined,
    body: typeof request.body === 'string' ? request.body : undefined,
  };
}

// eslint-disable-next-line import/prefer-default-export
export class Logger {
  #history: LoggerHistory;

  get history(): LoggerHistory {
    return this.#history;
  }

  constructor() {
    this.#history = [];
  }

  logRequest(params: SdkRequest): string {
    const log: Log = {
      id: generateId(),
      request: serializeRequest(params),
      logTimes: { request: Date.now() },
    };

    this.#history.push(log);

    return log.id;
  }

  logResponse(response: Response, requestId?: undefined | string): string {
    const id = requestId || generateId();

    // console.log('clone');
    // const clonedResponse = response.clone(); // THIS IS THE LINE THAT CAUSES THE PROBLEM
    // console.log('after clone', clonedResponse.status);

    const logContent: SdkResponse = {
      status: response.status, // clonedResponse.status,
      headers: Object.fromEntries(response.headers),
    };

    const foundLogIndex = this.#history.findIndex((log) => log.id === id);

    if (foundLogIndex > -1) {
      this.#history[foundLogIndex].response = logContent;
      this.#history[foundLogIndex].logTimes.response = Date.now();
    } else {
      this.#history.push({
        id,
        response: logContent,
        logTimes: { response: Date.now() },
      });
    }

    return id;
  }
}
