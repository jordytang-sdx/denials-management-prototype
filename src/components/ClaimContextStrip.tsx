import React, { useState } from 'react'
import { Box, Typography, Collapse, IconButton } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'

export interface ClaimContext {
  claimId: string
  har: string
  mrn: string
  dos: string           // ISO date
  facility?: string
  billedAmount?: number
  allowedAmount?: number
  paidAmount?: number
}

function fmt(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function currency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

interface ClaimContextStripProps {
  claim: ClaimContext
}

export function ClaimContextStrip({ claim }: ClaimContextStripProps) {
  const [open, setOpen] = useState(false)

  const collapsedLine = [
    claim.claimId,
    claim.har,
    `DOS: ${fmt(claim.dos)}`,
    claim.billedAmount !== undefined ? `Billed: ${currency(claim.billedAmount)}` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <Box sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
      {/* Collapsed bar */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 0.75, cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.100' },
        }}
        onClick={() => setOpen(o => !o)}
      >
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.2 }}>
          {collapsedLine}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            Claim details
          </Typography>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {open ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded table */}
      <Collapse in={open}>
        <Box sx={{ overflowX: 'auto', px: 2, pb: 1.5 }}>
          <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
            <Box component="thead">
              <Box component="tr">
                {['Claim ID', 'HAR', 'MRN', 'DOS', 'Facility', 'Billed', 'Allowed', 'Paid'].map(h => (
                  <Box
                    component="th"
                    key={h}
                    sx={{
                      textAlign: 'left', pb: 0.5, pr: 2,
                      fontSize: '0.6875rem', fontWeight: 600,
                      color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5,
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              <Box component="tr">
                {[
                  claim.claimId,
                  claim.har,
                  claim.mrn,
                  fmt(claim.dos),
                  claim.facility ?? '—',
                  claim.billedAmount !== undefined ? currency(claim.billedAmount) : '—',
                  claim.allowedAmount !== undefined ? currency(claim.allowedAmount) : '—',
                  claim.paidAmount !== undefined ? currency(claim.paidAmount) : '—',
                ].map((val, i) => (
                  <Box
                    component="td"
                    key={i}
                    sx={{
                      pt: 1, pr: 2,
                      fontSize: '0.8125rem',
                      fontFamily: i < 3 ? 'monospace' : undefined,
                      color: 'text.primary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {val}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}
