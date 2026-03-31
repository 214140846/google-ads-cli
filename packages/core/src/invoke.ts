export interface OperationDescriptor {
  operationId: string;
  httpMethod: string;
  path: string;
}

export interface BuildGoogleAdsRequestOptions {
  operation: OperationDescriptor;
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
  linkedCustomerId?: string;
  pathParams?: Record<string, string>;
  payload?: unknown;
}

export interface BuiltGoogleAdsRequest {
  operationId: string;
  url: string;
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
}

const GOOGLE_ADS_API_BASE_URL = 'https://googleads.googleapis.com';
const PATH_PARAM_PATTERN = /\{[+]?([^}]+)\}/g;

function interpolatePath(path: string, pathParams: Record<string, string>): string {
  return path.replace(PATH_PARAM_PATTERN, (_match, key: string) => {
    const value = pathParams[key];

    if (!value) {
      throw new Error(`Missing required path param: ${key}`);
    }

    return encodeURIComponent(value);
  });
}

export function buildGoogleAdsRequest(
  options: BuildGoogleAdsRequestOptions
): BuiltGoogleAdsRequest {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.accessToken}`,
    'developer-token': options.developerToken
  };

  if (options.loginCustomerId) {
    headers['login-customer-id'] = options.loginCustomerId;
  }

  if (options.linkedCustomerId) {
    headers['linked-customer-id'] = options.linkedCustomerId;
  }

  const resolvedPath = interpolatePath(options.operation.path, options.pathParams ?? {});

  if (options.payload !== undefined) {
    headers['content-type'] = 'application/json';
  }

  return {
    operationId: options.operation.operationId,
    url: `${GOOGLE_ADS_API_BASE_URL}/${resolvedPath}`,
    init: {
      method: options.operation.httpMethod,
      headers,
      ...(options.payload !== undefined
        ? { body: JSON.stringify(options.payload) }
        : {})
    }
  };
}
