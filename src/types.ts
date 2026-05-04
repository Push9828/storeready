export interface CheckResult {
  id: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message: string;
  detail?: string;
  file?: string;
}

export interface StoreReadyConfig {
  demoAccount: {
    email: string;
    password: string;
  };
  appReviewNotes: string;
  privacyPolicyUrl: string;
  supportUrl: string;
  screenshotsPath: string;
}

export interface ExpoConfig {
  name?: string;
  version?: string;
  ios?: {
    bundleIdentifier?: string;
    buildNumber?: string;
    supportsTablet?: boolean;
    infoPlist?: Record<string, string>;
    minimumOsVersion?: string;
  };
  orientation?: string;
  extra?: Record<string, unknown>;
}
