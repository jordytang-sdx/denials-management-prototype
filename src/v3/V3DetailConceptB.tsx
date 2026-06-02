// V3 — Concept B: No-tabs scaffold (lead designer's recommendation).
//
// Layout shape:
//   ┌─────────────────────────────────────────────────────────┐
//   │ Standardized case header                                │
//   ├─────────────────────────────────────────────┬───────────┤
//   │                                             │ Accordions:│
//   │   Workspace (letter editor + AI)            │ Payer      │
//   │   = main pane, hero treatment               │ Reasoning, │
//   │                                             │ Clinical   │
//   │                                             │ Evidence,  │
//   │                                             │ Activity,  │
//   │                                             │ Notes,     │
//   │                                             │ Attachments│
//   └─────────────────────────────────────────────┴───────────┘
//
// Why this concept: power users spend 90%+ of their time in the workspace.
// No tab UI to learn. Reference context (payer reasoning, clinical evidence)
// is one click away in the rail. Scales across denial / ADR / underpayment /
// audit by swapping the workspace component and the rail accordion config.

import { Box, Typography, IconButton, Collapse, Tooltip } from '@mui/material'
import { useState } from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { MOCK_EVIDENCE } from '../case-page/mockData'
import type { DenialRecord } from '../data/denials'
import V3CaseHeader from './V3CaseHeader'
import V3LetterWorkspace from './V3LetterWorkspace'

interface V3DetailConceptBProps {
  caseRecord?: DenialRecord
}

interface AccordionProps {
  label: string
  icon: React.ReactNode
  count?: number | string
  defaultOpen?: boolean
  children: React.ReactNode
}

function RailAccordion({ label, icon, count, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Box sx={{ borderBottom: '1px solid #EEEEEE' }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          px: 1.5, py: 1, cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        }}
      >
        <IconButton size="small" sx={{ width: 20, height: 20, p: 0, color: '#9E9E9E' }}>
          {open ? <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />}
        </IconButton>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', color: '#616161', mr: -0.25 }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>
          {label}
        </Typography>
        {count !== undefined && (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18, px: 0.625, borderRadius: '9px',
            bgcolor: '#EEEEEE', color: '#616161',
            fontSize: '0.6875rem', fontWeight: 600,
          }}>
            {count}
          </Box>
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

function EvidenceCard({ item }: { item: typeof MOCK_EVIDENCE[number] }) {
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #EEEEEE', borderRadius: '6px',
      px: 1.25, py: 0.875, mb: 0.625,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      cursor: 'pointer',
      '&:hover': { borderColor: '#157d9d', bgcolor: 'rgba(21,125,157,0.02)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: '#212121', fontWeight: 500 }}>
          {item.condition}
        </Typography>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 18, height: 18, px: 0.625, borderRadius: '9px',
          bgcolor: '#F5F5F5', color: '#616161',
          fontSize: '0.6875rem', fontWeight: 600,
        }}>
          {item.count}
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: item.strengthColor }}>
        {item.strength}
      </Typography>
    </Box>
  )
}

export default function V3DetailConceptB({ caseRecord }: V3DetailConceptBProps) {
  const denialDescription = caseRecord
    ? `${caseRecord.denialType}${caseRecord.denialSubtype ? ': ' + caseRecord.denialSubtype : ''}`
    : ''

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
      <V3CaseHeader caseRecord={caseRecord} />

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Main pane — workspace (the hero) */}
        <V3LetterWorkspace />

        {/* Right rail — typed accordions of reference context */}
        <Box sx={{
          width: 340, flexShrink: 0,
          borderLeft: '1px solid #E0E0E0',
          bgcolor: '#FAFBFC',
          overflowY: 'auto',
        }}>
          <RailAccordion
            label="Payer Reasoning"
            icon={<ReportProblemOutlinedIcon sx={{ fontSize: 14 }} />}
            defaultOpen
          >
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
              What the payer said
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#424242', lineHeight: 1.55, mb: 1 }}>
              {denialDescription || 'Insufficient clinical documentation to support diagnosis.'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#616161', lineHeight: 1.5 }}>
              The payer asserts that the medical record did not validate the principal diagnosis as billed. They have reassigned the DRG to a lower-paying group.
            </Typography>
          </RailAccordion>

          <RailAccordion
            label="Clinical Evidence"
            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
            count={MOCK_EVIDENCE.length}
            defaultOpen
          >
            <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', mb: 1, lineHeight: 1.45 }}>
              Chart-sourced. Click to cite in the letter.
            </Typography>
            <Box>
              {MOCK_EVIDENCE.map(item => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </Box>
          </RailAccordion>

          <RailAccordion
            label="Activity"
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            count={3}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
              {[
                { event: 'Denial uploaded', date: 'Mar 17, 2026', who: 'Krista Soriano' },
                { event: 'Appeal letter generated', date: 'Mar 17, 2026', who: 'SmarterDx' },
                { event: 'Letter ready for review', date: 'Mar 17, 2026', who: 'SmarterDx' },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#212121' }}>{row.event}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#9E9E9E' }}>{row.date} · {row.who}</Typography>
                </Box>
              ))}
            </Box>
          </RailAccordion>

          <RailAccordion
            label="Notes"
            icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
            count={0}
          >
            <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', lineHeight: 1.5 }}>
              No team notes yet. Add a note to share context with reviewers.
            </Typography>
            <Box
              component="input"
              placeholder="Add a note…"
              sx={{
                mt: 1, width: '100%',
                border: '1px solid #E0E0E0', borderRadius: '6px',
                px: 1, py: 0.75, fontSize: '0.8125rem', outline: 'none',
                fontFamily: 'inherit',
                '&:focus': { borderColor: '#157d9d' },
              }}
            />
          </RailAccordion>

          <RailAccordion
            label="Attachments"
            icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
            count={5}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                'demo-denial-letter.pdf',
                'Inpatient Clinical Notes — Admission.pdf',
                'ABG Results — Serial.pdf',
                'Microbiology Report — Blood Culture.pdf',
                'Physician Attestation.pdf',
              ].map(name => (
                <Tooltip key={name} title="Open attachment">
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    px: 1, py: 0.5, borderRadius: '6px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}>
                    <AttachFileIcon sx={{ fontSize: 14, color: '#9E9E9E' }} />
                    <Typography sx={{ fontSize: '0.8125rem', color: '#212121', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </RailAccordion>
        </Box>
      </Box>
    </Box>
  )
}
