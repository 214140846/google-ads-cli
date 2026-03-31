export interface GoogleAdsProfile {
  apiVersion: string;
  developerToken: string;
  defaultCustomerId?: string;
  linkedCustomerId?: string;
  loginCustomerId?: string;
}

export * from './invoke.js';
