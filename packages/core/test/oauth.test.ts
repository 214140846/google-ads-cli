import { describe, expect, it } from 'vitest';

import {
  buildGoogleAdsAuthUrl,
  exchangeAuthCode,
  refreshGoogleAdsAccessToken
} from '../src/oauth.js';

describe('buildGoogleAdsAuthUrl', () => {
  it('creates an installed-app OAuth URL for the adwords scope', () => {
    const authUrl = buildGoogleAdsAuthUrl({
      clientId: 'client-id',
      redirectUri: 'http://127.0.0.1:8085/callback',
      state: 'state-123'
    });

    expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(authUrl).toContain('client_id=client-id');
    expect(authUrl).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fadwords');
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
    expect(authUrl).toContain('state=state-123');
  });
});

describe('oauth token exchanges', () => {
  it('exchanges an auth code for tokens', async () => {
    const result = await exchangeAuthCode(
      {
        authCode: 'code-123',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://127.0.0.1:8085/callback'
      },
      async (url, init) => {
        expect(url).toBe('https://oauth2.googleapis.com/token');
        expect(init?.method).toBe('POST');
        expect(String(init?.body)).toContain('grant_type=authorization_code');

        return new Response(
          JSON.stringify({
            access_token: 'access-123',
            expires_in: 3600,
            refresh_token: 'refresh-456',
            scope: 'https://www.googleapis.com/auth/adwords',
            token_type: 'Bearer'
          }),
          { status: 200 }
        );
      }
    );

    expect(result.refresh_token).toBe('refresh-456');
    expect(result.access_token).toBe('access-123');
  });

  it('refreshes an access token from a refresh token', async () => {
    const result = await refreshGoogleAdsAccessToken(
      {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-456'
      },
      async (_url, init) => {
        expect(String(init?.body)).toContain('grant_type=refresh_token');
        expect(String(init?.body)).toContain('refresh_token=refresh-456');

        return new Response(
          JSON.stringify({
            access_token: 'access-789',
            expires_in: 3600,
            scope: 'https://www.googleapis.com/auth/adwords',
            token_type: 'Bearer'
          }),
          { status: 200 }
        );
      }
    );

    expect(result.access_token).toBe('access-789');
  });
});
