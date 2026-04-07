import {
  LocalHospitalOutlined,
  CompareArrowsOutlined,
  LockOutlined,
  CodeOutlined,
  DescriptionOutlined,
  AccountBalanceOutlined,
  PersonSearchOutlined,
  TrendingDownOutlined,
  FindInPageOutlined,
  ErrorOutlineOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'

export interface DenialTypeConfig {
  color: string
  bg: string
  Icon: SvgIconComponent
}

export const DENIAL_TYPE_CONFIG: Record<string, DenialTypeConfig> = {
  'Medical Necessity': { color: '#7C3AED', bg: '#F5F3FF', Icon: LocalHospitalOutlined },
  'DRG Downgrade':     { color: '#0D9488', bg: '#F0FDFA', Icon: CompareArrowsOutlined },
  'Authorization':     { color: '#EA580C', bg: '#FFF7ED', Icon: LockOutlined },
  'Coding Error':      { color: '#2563EB', bg: '#EFF6FF', Icon: CodeOutlined },
  'Administrative':    { color: '#64748B', bg: '#F8FAFC', Icon: DescriptionOutlined },
  'Timely Filing':     { color: '#DC2626', bg: '#FEF2F2', Icon: AccessTimeOutlined },
  'Recoupment':        { color: '#B45309', bg: '#FFFBEB', Icon: AccountBalanceOutlined },
  'Eligibility':       { color: '#4F46E5', bg: '#EEF2FF', Icon: PersonSearchOutlined },
  'Underpayment':      { color: '#059669', bg: '#ECFDF5', Icon: TrendingDownOutlined },
  'ADR':               { color: '#0369A1', bg: '#F0F9FF', Icon: FindInPageOutlined },
}

export const DEFAULT_TYPE_CONFIG: DenialTypeConfig = {
  color: '#6B7280', bg: '#F9FAFB', Icon: ErrorOutlineOutlined,
}

export function getDenialTypeConfig(denialType: string): DenialTypeConfig {
  return DENIAL_TYPE_CONFIG[denialType] ?? DEFAULT_TYPE_CONFIG
}
