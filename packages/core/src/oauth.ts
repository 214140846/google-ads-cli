const GOOGLE_OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

export interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleAuthUrlOptions {
  clientId: string;
  redirectUri: string;
  state?: string;
}

export interface ExchangeAuthCodeOptions {
  clientId: string;
  clientSecret: string;
  authCode: string;
  redirectUri: string;
}

export interface RefreshAccessTokenOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export type OAuthFetch = typeof fetch;

function buildTokenRequest(body: URLSearchParams): RequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  };
}

async function parseTokenResponse(response: Response): Promise<GoogleOAuthTokenResponse> {
  const json = (await response.json()) as Partial<GoogleOAuthTokenResponse> & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? `OAuth request failed: ${response.status}`);
  }

  return {
    access_token: json.access_token,
    expires_in: json.expires_in ?? 0,
    refresh_token: json.refresh_token,
    scope: json.scope ?? GOOGLE_ADS_SCOPE,
    token_type: json.token_type ?? 'Bearer'
  };
}

export function buildGoogleAdsAuthUrl(options: GoogleAuthUrlOptions): string {
  const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);

  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_ADS_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  if (options.state) {
    url.searchParams.set('state', options.state);
  }

  return url.toString();
}

export async function exchangeAuthCode(
  options: ExchangeAuthCodeOptions,
  fetchImpl: OAuthFetch = fetch
): Promise<GoogleOAuthTokenResponse> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    code: options.authCode,
    grant_type: 'authorization_code',
    redirect_uri: options.redirectUri
  });

  return parseTokenResponse(
    await fetchImpl(GOOGLE_OAUTH_TOKEN_URL, buildTokenRequest(body))
  );
}

export async function refreshGoogleAdsAccessToken(
  options: RefreshAccessTokenOptions,
  fetchImpl: OAuthFetch = fetch
): Promise<GoogleOAuthTokenResponse> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    refresh_token: options.refreshToken,
    grant_type: 'refresh_token'
  });

  return parseTokenResponse(
    await fetchImpl(GOOGLE_OAUTH_TOKEN_URL, buildTokenRequest(body))
  );
}
