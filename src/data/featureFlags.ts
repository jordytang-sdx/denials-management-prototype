export interface FeatureFlags {
  denials: boolean
  underpayments: boolean
  audits: boolean
}

export const DEFAULT_FLAGS: FeatureFlags = {
  denials: true,
  underpayments: true,
  audits: true,
}

export type PackageId = 'denials' | 'underpayments' | 'audits'
