import {
  GavelOutlined,
  ErrorOutlineOutlined,
  DescriptionOutlined,
  PersonSearchOutlined,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import type { UnderpaymentCategory } from './underpayments'

export interface UnderpaymentCategoryConfig {
  color: string
  bg: string
  Icon: SvgIconComponent
}

export const CATEGORY_CONFIG: Record<UnderpaymentCategory, UnderpaymentCategoryConfig> = {
  'Contract Variance':            { color: '#1D4ED8', bg: '#EFF6FF', Icon: GavelOutlined },
  'Payer Processing Error':       { color: '#C2410C', bg: '#FFF7ED', Icon: ErrorOutlineOutlined },
  'Provider Billing Error':       { color: '#7E22CE', bg: '#FDF4FF', Icon: DescriptionOutlined },
  'Administrative & Eligibility': { color: '#15803D', bg: '#F0FDF4', Icon: PersonSearchOutlined },
}

export function getCategoryConfig(category: string): UnderpaymentCategoryConfig {
  return CATEGORY_CONFIG[category as UnderpaymentCategory] ?? {
    color: '#6B7280', bg: '#F9FAFB', Icon: ErrorOutlineOutlined,
  }
}
