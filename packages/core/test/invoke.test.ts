import { describe, expect, it } from 'vitest';

import { buildGoogleAdsRequest } from '../src/invoke.js';

describe('buildGoogleAdsRequest', () => {
  it('interpolates path params and required Google Ads headers', () => {
    const request = buildGoogleAdsRequest({
      accessToken: 'token-123',
      developerToken: 'dev-456',
      linkedCustomerId: '9998887776',
      loginCustomerId: '1234567890',
      operation: {
        httpMethod: 'POST',
        operationId: 'customers.campaigns.mutate',
        path: 'v22/customers/{+customerId}/campaigns:mutate'
      },
      pathParams: {
        customerId: '5554443333'
      },
      payload: {
        mutateOperations: []
      }
    });

    expect(request).toEqual({
      init: {
        body: JSON.stringify({
          mutateOperations: []
        }),
        headers: {
          Authorization: 'Bearer token-123',
          'content-type': 'application/json',
          'developer-token': 'dev-456',
          'linked-customer-id': '9998887776',
          'login-customer-id': '1234567890'
        },
        method: 'POST'
      },
      operationId: 'customers.campaigns.mutate',
      url: 'https://googleads.googleapis.com/v22/customers/5554443333/campaigns:mutate'
    });
  });
});
