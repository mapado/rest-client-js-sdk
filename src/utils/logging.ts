// export type Logger = {
//   [key: string]: any;
//   log: (title: string, jsonContent: string) => void;
// };

// eslint-disable-next-line import/prefer-default-export
export function logResponse(logger: Logger, response: Response): void {
  const clonedResponse = response.clone();

  const logContent = {
    status: clonedResponse.status,
    headers: Object.fromEntries(clonedResponse.headers),
  };

  const contentType = clonedResponse.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    clonedResponse.json().then((data) => {
      logger.log(
        'Response',
        JSON.stringify(
          {
            ...logContent,
            content: JSON.parse(data),
          },
          null,
          2
        )
      );
    });
  } else {
    clonedResponse.text().then((text) => {
      let content = text;
      try {
        content = JSON.parse(text);
      } catch (e) {
        // ignore
      }
      logger.log(
        'Response',
        JSON.stringify(
          {
            ...logContent,
            content,
          },
          null,
          2
        )
      );
    });
  }
}

export function logRequest(
  logger: Logger,
  params: { [key: string]: any }
): void {
  logger.log('Request', JSON.stringify(params, undefined, 2));
}

export class Logger {
  log(title: string, jsonContent: string): void {
    // eslint-disable-next-line no-console
    console.log(`${title}\n${jsonContent}`);
  }
}
