import React, { useState } from 'react'
import { Box, Chip, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material'
import type { TimelineEvent, TimelineEventCategory } from '../data/caseTimeline'
import { getEventMeta } from '../data/caseTimeline'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function caseBadgeColor(type: 'denial' | 'underpayment' | 'audit' | undefined): string {
  if (type === 'denial')      return '#D97706'
  if (type === 'underpayment') return '#2D7D9A'
  if (type === 'audit')       return '#7C3AED'
  return '#6B7280'
}

function caseBadgeLabel(type: 'denial' | 'underpayment' | 'audit' | undefined): string {
  if (type === 'denial')       return 'D'
  if (type === 'underpayment') return 'U'
  if (type === 'audit')        return 'A'
  return '?'
}

type FilterCategory = 'all' | TimelineEventCategory

// ── EventRow ──────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: TimelineEvent
  isLast: boolean
  systemExpanded: boolean
  onNavigateToCase?: (caseId: string, caseType: 'denial' | 'underpayment' | 'audit') => void
}

function EventRow({ event, isLast, systemExpanded, onNavigateToCase }: EventRowProps) {
  const meta = getEventMeta(event.type)
  const isSystem = meta.category === 'system'
  const isCrossCase = event.type === 'system_cross_case'
  const deEmphasize = isSystem && !systemExpanded

  const badgeColor = isCrossCase ? caseBadgeColor(event.relatedCaseType) : meta.borderColor

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        position: 'relative',
        opacity: deEmphasize ? 0.65 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Connector line */}
      {!isLast && (
        <Box sx={{
          position: 'absolute',
          left: 11,
          top: 26,
          bottom: 0,
          width: 2,
          bgcolor: 'divider',
          zIndex: 0,
        }} />
      )}

      {/* Dot */}
      <Box sx={{ flexShrink: 0, zIndex: 1, pt: 0.25 }}>
        {isCrossCase ? (
          <Box sx={{
            width: 24, height: 24,
            borderRadius: '4px',
            bgcolor: badgeColor + '18',
            border: '2px dashed',
            borderColor: badgeColor + '66',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.625rem', fontWeight: 700, color: badgeColor,
          }}>
            {caseBadgeLabel(event.relatedCaseType)}
          </Box>
        ) : (
          <Box sx={{
            width: 24, height: 24,
            borderRadius: meta.dotVariant === 'hollow' ? '50%' : '50%',
            bgcolor: meta.dotVariant === 'hollow' ? 'transparent' : meta.dotColor + '18',
            border: '2px solid',
            borderColor: meta.dotColor + (meta.dotVariant === 'hollow' ? '55' : '44'),
            boxSizing: 'border-box',
          }} />
        )}
      </Box>

      {/* Content */}
      <Box sx={{
        flex: 1,
        pb: isLast ? 0 : 2.5,
        borderLeft: isCrossCase ? `2px dashed ${badgeColor}33` : `2px solid ${meta.borderColor}33`,
        pl: 1.5,
        ml: -0.5,
      }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={meta.label}
            size="small"
            sx={{
              height: 18,
              fontSize: deEmphasize ? '0.625rem' : '0.6875rem',
              fontWeight: 600,
              bgcolor: meta.borderColor + '14',
              color: meta.borderColor,
              border: 'none',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: deEmphasize ? '0.6rem' : undefined }}>
            {formatDateTime(event.timestamp)}
          </Typography>
          {event.actor && !isSystem && (
            <>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>·</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {event.actor}
              </Typography>
            </>
          )}
        </Box>

        {/* Summary */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: deEmphasize ? 400 : 500,
            mt: 0.5,
            lineHeight: 1.4,
            fontSize: deEmphasize ? '0.75rem' : undefined,
            color: deEmphasize ? 'text.secondary' : 'text.primary',
          }}
        >
          {event.summary}
        </Typography>

        {/* Detail */}
        {event.detail && !deEmphasize && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
            {event.detail}
          </Typography>
        )}

        {/* Cross-case link */}
        {isCrossCase && event.relatedCaseId && onNavigateToCase && event.relatedCaseType && (
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5,
              cursor: 'pointer', color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
              fontSize: '0.75rem',
            }}
            onClick={() => onNavigateToCase(event.relatedCaseId!, event.relatedCaseType!)}
          >
            Open {event.relatedCaseId} →
          </Box>
        )}

        {/* Financials + document */}
        {!deEmphasize && (
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {event.amount !== undefined && (
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(event.amount)}
              </Typography>
            )}
            {event.document && (
              <Typography variant="caption" sx={{ color: 'secondary.main', fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                {event.document}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ── ActivityTimeline ──────────────────────────────────────────────────────────

interface ActivityTimelineProps {
  events: TimelineEvent[]
  onNavigateToCase?: (caseId: string, caseType: 'denial' | 'underpayment' | 'audit') => void
}

export function ActivityTimeline({ events, onNavigateToCase }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<FilterCategory>('all')

  const systemExpanded = filter === 'system'

  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filtered = sorted.filter(e => {
    if (filter === 'all') return true
    return getEventMeta(e.type).category === filter
  })

  if (events.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No timeline events recorded.</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Filter chips */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => { if (v) setFilter(v) }}
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '20px !important',
              px: 1.5,
              py: 0.25,
              fontSize: '0.6875rem',
              textTransform: 'none',
              lineHeight: 1.4,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="financial">Financial</ToggleButton>
          <ToggleButton value="payer">Payer</ToggleButton>
          <ToggleButton value="action">Actions</ToggleButton>
          <ToggleButton value="system">System</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Events */}
      <Box sx={{ px: 2, pb: 2 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No events in this category.
          </Typography>
        ) : (
          filtered.map((event, idx) => (
            <EventRow
              key={event.id}
              event={event}
              isLast={idx === filtered.length - 1}
              systemExpanded={systemExpanded}
              onNavigateToCase={onNavigateToCase}
            />
          ))
        )}
      </Box>
    </Box>
  )
}
