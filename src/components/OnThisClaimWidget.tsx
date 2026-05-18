import React, { useState } from 'react'
import { Box, Typography, Chip, Divider } from '@mui/material'
import { OpenInNewOutlined } from '@mui/icons-material'

export interface CaseOnClaim {
  caseId: string
  caseType: 'denial' | 'underpayment' | 'audit'
  state: string
  status: string
  amount: number       // denied$ / variance$ / atRisk$
  assignee?: string
  isCurrent: boolean
}

function typeBadgeColors(type: 'denial' | 'underpayment' | 'audit') {
  if (type === 'denial')       return { bg: '#fef3ea', color: '#b86823', label: 'D' }
  if (type === 'underpayment') return { bg: '#e8f2f5', color: '#157d9d', label: 'U' }
  return                              { bg: '#ebf5fb', color: '#2776a1', label: 'A' }
}

function currency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

interface OnThisClaimWidgetProps {
  claimId: string
  cases: CaseOnClaim[]
  onNavigateToCase: (caseId: string, caseType: 'denial' | 'underpayment' | 'audit') => void
}

const MAX_VISIBLE = 4

export function OnThisClaimWidget({ claimId, cases, onNavigateToCase }: OnThisClaimWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  // Hide widget entirely if this is the only case
  const otherCases = cases.filter(c => !c.isCurrent)
  if (otherCases.length === 0) return null

  const visible = expanded ? cases : cases.slice(0, MAX_VISIBLE)
  const hiddenCount = cases.length - MAX_VISIBLE

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Cases on {claimId}
        </Typography>
      </Box>

      {/* Case rows */}
      <Box>
        {visible.map((c, idx) => {
          const badge = typeBadgeColors(c.caseType)
          return (
            <Box key={c.caseId}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1,
                  bgcolor: c.isCurrent ? 'primary.50' : 'transparent',
                  cursor: c.isCurrent ? 'default' : 'pointer',
                  '&:hover': c.isCurrent ? {} : { bgcolor: 'grey.50' },
                  transition: 'background 0.1s',
                }}
                onClick={() => {
                  if (!c.isCurrent) onNavigateToCase(c.caseId, c.caseType)
                }}
              >
                {/* Type badge */}
                <Box sx={{
                  width: 22, height: 22, borderRadius: '4px',
                  bgcolor: badge.bg, color: badge.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {badge.label}
                </Box>

                {/* Case ID + state/status */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', color: c.isCurrent ? 'primary.main' : 'text.primary' }}>
                      {c.caseId}
                    </Typography>
                    {c.isCurrent && (
                      <Chip label="current" size="small" sx={{ height: 14, fontSize: '0.5625rem', bgcolor: 'primary.main', color: 'white', '& .MuiChip-label': { px: 0.5 } }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    {c.state} · {c.status}
                  </Typography>
                </Box>

                {/* Amount */}
                <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', flexShrink: 0, color: 'text.primary' }}>
                  {currency(c.amount)}
                </Typography>

                {/* Assignee initials */}
                {c.assignee && (
                  <Box sx={{
                    width: 22, height: 22, borderRadius: '50%',
                    bgcolor: 'grey.200', color: 'text.secondary',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.5rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {c.assignee.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Box>
                )}

                {/* Nav arrow */}
                {!c.isCurrent && (
                  <OpenInNewOutlined sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                )}
              </Box>
            </Box>
          )
        })}

        {/* Show more / less */}
        {hiddenCount > 0 && (
          <>
            <Divider />
            <Box
              sx={{ px: 2, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
              onClick={() => setExpanded(e => !e)}
            >
              <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.75rem' }}>
                {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
