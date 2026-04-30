import { useState, useMemo, useRef } from 'react'
import { alpha } from '@mui/material/styles'
import {
  Box, Typography, Button, TextField, InputAdornment, Badge,
  Popover, Checkbox, Radio, RadioGroup, FormControlLabel, FormGroup,
  Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Tooltip, Autocomplete, Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import {
  STATUS_OPTIONS, TYPE_OPTIONS, LEVEL_OPTIONS, LOCATION_OPTIONS,
  PAYER_OPTIONS, REVIEWER_OPTIONS, DENIAL_CARDS, CURRENT_USER, DenialCard,
} from '../data/denialListMockData'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Generating:           { bg: '#e8f2f5', color: '#157d9d' },
  'Ready for Review':   { bg: '#eaf6f4', color: '#2da390' },
  Submitted:            { bg: '#EFEBE9', color: '#5D4037' },
  Overturned:           { bg: '#E8F5E9', color: '#2E7D32' },
  'Denial Upheld':      { bg: '#fbedee', color: '#d44a52' },
  Failed:               { bg: '#fbedee', color: '#d44a52' },
  'Will Not Submit':    { bg: '#F5F5F5', color: '#616161' },
  Archived:             { bg: '#F5F5F5', color: '#616161' },
}

const statusColorMap: Record<string, string> = {
  'Generating':               '#157d9d',
  'Ready for Review':         '#2da390',
  'Submitted':                '#6D4C41',
  'Overturned':               '#2E7D32',
  'Denial Upheld':            '#d44a52',
  'Failed':                   '#d44a52',
  'Unsupported File Type':    '#d44a52',
  'Upload Failed':            '#d44a52',
  'Extraction Failed':        '#d44a52',
  'Letter Writing Failed':    '#d44a52',
  'Will Not Submit':          '#757575',
  'Archived':                 '#757575',
  'Data Not Available':       '#757575',
  'Unsupported Date':         '#757575',
}

const STATUS_SORT_ORDER: Record<string, number> = {
  'Generating':        0,
  'Ready for Review':  1,
  'Submitted':         2,
  'Overturned':        3,
  'Denial Upheld':     4,
  'Failed':            5,
  'Will Not Submit':   6,
  'Archived':          7,
}

const TABS = ['All', 'Assigned To Me', 'My Uploads']

// ─── FilterDropdown ──────────────────────────────────────────────────────────

type FilterType = 'status' | 'checkbox' | 'radio' | 'autocomplete'

interface FilterDropdownProps {
  label: string
  type: FilterType
  options: (string | { label: string; color?: string; children?: string[] })[]
  selected: string | string[]
  onSelectionChange: (v: string | string[]) => void
}

function FilterDropdown({ label, type, options, selected, onSelectionChange }: FilterDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const selectedArr = Array.isArray(selected) ? selected : []

  const badgeCount = type === 'radio'
    ? (selected && selected !== 'All' ? 1 : 0)
    : selectedArr.length

  const isActive = badgeCount > 0

  const getAllFlatOptions = () => {
    const flat: string[] = []
    options.forEach((opt) => {
      const optLabel = typeof opt === 'string' ? opt : opt.label
      flat.push(optLabel)
      if (typeof opt !== 'string' && opt.children) flat.push(...opt.children)
    })
    return flat
  }

  const handleCheckboxToggle = (value: string) => {
    const next = selectedArr.includes(value)
      ? selectedArr.filter((v) => v !== value)
      : [...selectedArr, value]
    onSelectionChange(next)
  }

  const handleSelectAll = () => {
    if (selectedArr.length === getAllFlatOptions().length) {
      onSelectionChange([])
    } else {
      onSelectionChange(getAllFlatOptions())
    }
  }

  const renderDisplayValue = () => {
    if (type === 'radio' && selected && selected !== 'All') return `${label}: ${selected}`
    return label
  }

  const renderStatusCheckboxes = () => {
    const allFlat = getAllFlatOptions()
    const allSelected = allFlat.every((o) => selectedArr.includes(o))
    return (
      <Box sx={{ p: 1, minWidth: 220, maxHeight: 400, overflowY: 'auto' }}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={allSelected} indeterminate={selectedArr.length > 0 && !allSelected} onChange={handleSelectAll} size="small" />}
            label={<Typography variant="body2">Select All</Typography>}
          />
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="overline" sx={{ px: 1, pt: 1, color: 'text.secondary', fontSize: '0.65rem' }}>STATUS</Typography>
          {options.map((opt) => {
            const optLabel = typeof opt === 'string' ? opt : opt.label
            const color = statusColorMap[optLabel] || '#757575'
            const hasChildren = typeof opt !== 'string' && opt.children && opt.children.length > 0
            return (
              <Box key={optLabel}>
                <FormControlLabel
                  control={<Checkbox checked={selectedArr.includes(optLabel)} onChange={() => handleCheckboxToggle(optLabel)} size="small" />}
                  label={<Typography variant="body2" sx={{ color, fontWeight: 500 }}>{optLabel}</Typography>}
                />
                {hasChildren && typeof opt !== 'string' && (
                  <Box sx={{ pl: 3, display: 'flex', flexDirection: 'column' }}>
                    {opt.children!.map((child) => (
                      <FormControlLabel
                        key={child}
                        control={<Checkbox checked={selectedArr.includes(child)} onChange={() => handleCheckboxToggle(child)} size="small" />}
                        label={<Typography variant="body2" sx={{ color: statusColorMap[child] || color, fontWeight: 500 }}>{child}</Typography>}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )
          })}
        </FormGroup>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1 }}>
          <Button size="small" onClick={() => onSelectionChange([])}>Reset</Button>
          <Button size="small" variant="contained" onClick={handleClose}>Apply</Button>
        </Box>
      </Box>
    )
  }

  const renderCheckboxList = () => (
    <Box sx={{ p: 1, minWidth: 220 }}>
      <FormGroup>
        {options
          .filter((o) => (typeof o === 'string' ? o : o.label) !== 'All')
          .map((opt) => {
            const optLabel = typeof opt === 'string' ? opt : opt.label
            return (
              <FormControlLabel
                key={optLabel}
                control={<Checkbox checked={selectedArr.includes(optLabel)} onChange={() => handleCheckboxToggle(optLabel)} size="small" />}
                label={<Typography variant="body2">{optLabel}</Typography>}
              />
            )
          })}
      </FormGroup>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1 }}>
        <Button size="small" onClick={() => onSelectionChange([])}>Reset</Button>
        <Button size="small" variant="contained" onClick={handleClose}>Apply</Button>
      </Box>
    </Box>
  )

  const renderRadioList = () => (
    <Box sx={{ p: 1, minWidth: 200 }}>
      <RadioGroup value={selected || 'All'} onChange={(e) => onSelectionChange(e.target.value)}>
        {options.map((opt) => {
          const optLabel = typeof opt === 'string' ? opt : opt.label
          return (
            <FormControlLabel key={optLabel} value={optLabel} control={<Radio size="small" />} label={<Typography variant="body2">{optLabel}</Typography>} />
          )
        })}
      </RadioGroup>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1 }}>
        <Button size="small" onClick={() => onSelectionChange('All')}>Reset</Button>
        <Button size="small" variant="contained" onClick={handleClose}>Apply</Button>
      </Box>
    </Box>
  )

  const renderAutocomplete = () => (
    <Box sx={{ p: 2, minWidth: 300 }}>
      <Autocomplete
        multiple
        options={options.map(o => typeof o === 'string' ? o : o.label)}
        value={selectedArr}
        onChange={(_, newValue) => onSelectionChange(newValue)}
        renderInput={(params) => (
          <TextField {...params} variant="outlined" size="small" placeholder="Search reviewers..." autoFocus />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...rest } = getTagProps({ index })
            return <Chip key={key} label={option} size="small" {...rest} />
          })
        }
        disableCloseOnSelect
        sx={{ minWidth: 280 }}
      />
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button size="small" onClick={() => onSelectionChange([])}>Reset</Button>
        <Button size="small" variant="contained" onClick={handleClose}>Apply</Button>
      </Box>
    </Box>
  )

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleClick}
        variant="outlined"
        size="small"
        endIcon={<ArrowDropDownIcon />}
        sx={{
          borderRadius: '4px',
          borderColor: isActive ? '#157d9d' : 'rgba(0,0,0,0.23)',
          bgcolor: isActive ? 'rgba(21,125,157,0.08)' : '#fff',
          color: isActive ? '#157d9d' : 'text.secondary',
          fontWeight: 500,
          fontSize: '0.8125rem',
          px: 1.5,
          py: 0.5,
          '&:hover': {
            borderColor: isActive ? '#157d9d' : 'rgba(0,0,0,0.5)',
            bgcolor: isActive ? 'rgba(21,125,157,0.12)' : 'rgba(0,0,0,0.04)',
          },
        }}
      >
        {renderDisplayValue()}
        {type !== 'radio' && badgeCount > 0 && (
          <Badge
            badgeContent={badgeCount}
            color="primary"
            sx={{ ml: 1.5, '& .MuiBadge-badge': { position: 'relative', transform: 'none', fontSize: '0.7rem', height: 20, minWidth: 20, borderRadius: '100px' } }}
          />
        )}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } } }}
      >
        {type === 'status' && renderStatusCheckboxes()}
        {type === 'checkbox' && renderCheckboxList()}
        {type === 'radio' && renderRadioList()}
        {type === 'autocomplete' && renderAutocomplete()}
      </Popover>
    </>
  )
}

// ─── DenialCardStyleE ─────────────────────────────────────────────────────────

interface DenialCardProps {
  denial: DenialCard
  onOpen?: () => void
}

function DenialCardStyleE({ denial, onOpen }: DenialCardProps) {
  const [assignedTo, setAssignedTo] = useState(denial.assignedTo || '')
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<HTMLElement | null>(null)
  const [kebabMenuAnchor, setKebabMenuAnchor] = useState<HTMLElement | null>(null)
  const [cardHovered, setCardHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const statusChip = STATUS_CONFIG[denial.status] || { bg: '#F5F5F5', color: '#616161' }

  const patientNameParts = denial.patientName
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  const patientNameTitleCase = patientNameParts.length >= 2
    ? `${patientNameParts[patientNameParts.length - 1]}, ${patientNameParts.slice(0, -1).join(' ')}`
    : patientNameParts.join(' ')

  const AVATAR_COLORS = ['#1E88E5', '#039BE5', '#29B6F6', '#00897B', '#00ACC1', '#26C6DA', '#5E35B1', '#5C6BC0', '#AB47BC']
  const getAvatarColor = (name: string) => {
    if (!name) return '#BDBDBD'
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
  }
  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]
  }

  const daysLeft = (() => {
    if (!denial.appealDeadline) return null
    const [m, d, y] = denial.appealDeadline.split('/')
    const dl = new Date(Number(y), Number(m) - 1, Number(d))
    const today = new Date(); today.setHours(0, 0, 0, 0); dl.setHours(0, 0, 0, 0)
    return Math.round((dl.getTime() - today.getTime()) / 86400000)
  })()
  const isUrgent = daysLeft !== null && daysLeft <= 2


  const { drgChangeData, medicalNecessityData } = denial
  const drgParts = drgChangeData?.drgChipText?.split(' → ')
  const drgFrom = drgParts?.[0]?.replace(/^APR-/, '') ?? null
  const drgTo = drgParts?.[1] ?? null

  const buildTooltipContent = (lines: string[]) => {
    const sepIdx = lines.findIndex(l => l === '')
    const hasBoth = lines.some(l => l.startsWith('• Billed')) && lines.some(l => l.startsWith('• Payer'))
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {lines.map((line, i) => {
          const isPayerAdjusted = hasBoth && ((sepIdx !== -1 && i > sepIdx) || line.startsWith('• Payer'))
          const lineColor = isPayerAdjusted ? '#f58a2e' : 'rgba(0,0,0,0.78)'
          const isMediumLabel = line.startsWith('• ') && line.includes(': ')
          const isHeaderOnly = !line.startsWith(' ') && line.endsWith(':') && line.length > 0
          let content: React.ReactNode
          if (isMediumLabel) {
            const colonIdx = line.indexOf(': ')
            content = <><span style={{ fontWeight: 600 }}>{line.slice(0, colonIdx + 1)}</span>{line.slice(colonIdx + 1)}</>
          } else if (isHeaderOnly) {
            content = <span style={{ fontWeight: 600 }}>{line}</span>
          } else {
            content = line
          }
          return (
            <Typography key={i} sx={{ fontSize: '0.8125rem', color: lineColor, lineHeight: 1.7, whiteSpace: 'pre-wrap', ...(line === '' && { mb: 0.5 }) }}>
              {content}
            </Typography>
          )
        })}
      </Box>
    )
  }

  const whiteTipProps = {
    arrow: true as const,
    placement: 'bottom-start' as const,
    slotProps: {
      tooltip: { sx: { bgcolor: '#fff', color: 'rgba(0,0,0,0.87)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: '8px', px: 1.5, py: 1.25, maxWidth: 360 } },
      arrow: { sx: { color: '#fff', '&::before': { border: '1px solid rgba(0,0,0,0.10)' } } },
    },
  }

  const handleCardClick = () => {
    setPressed(true)
    setTimeout(() => { setPressed(false); onOpen?.() }, 120)
  }

  return (
    <Box
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      onClick={handleCardClick}
      sx={{
        bgcolor: pressed ? 'rgba(0,0,0,0.02)' : '#fff',
        borderRadius: '8px',
        borderLeft: '3px solid transparent',
        boxShadow: cardHovered
          ? '0 0 0 1px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.07)'
          : 'none',
        transition: 'box-shadow 0.15s ease, background-color 0.1s',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 72,
      }}
    >
      {/* ── Zone 1: Patient Identity ─────────────────────────────────────────── */}
      <Tooltip
        placement="bottom-start"
        arrow
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)', lineHeight: 1.5 }}>
              {patientNameTitleCase}
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {[
              { label: 'HAR',        value: denial.fin },
              { label: 'MRN',        value: denial.mrn },
              { label: 'Visit',      value: denial.visitId },
              { label: 'Discharged', value: denial.dischargeDate },
              { label: 'Location',   value: denial.location },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.6, width: 68, flexShrink: 0 }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.78)', lineHeight: 1.6 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        }
        slotProps={{
          tooltip: { sx: { bgcolor: '#fff', color: 'rgba(0,0,0,0.87)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: '8px', px: 1.5, py: 1.25, maxWidth: 320 } },
          arrow: { sx: { color: '#fff', '&::before': { border: '1px solid rgba(0,0,0,0.10)' } } },
        }}
      >
        <Box sx={{ width: 232, flexShrink: 0, px: 2.5, py: 2, borderRight: '1px solid rgba(0,0,0,0.055)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem', color: 'rgba(0,0,0,0.87)', lineHeight: 1.35, mb: 0.5 }}>
            {patientNameTitleCase}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.38)', lineHeight: 1.5 }}>
              {denial.fin}
            </Typography>
            <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" sx={{ p: '2px', color: 'rgba(0,0,0,0.25)', '&:hover': { color: 'rgba(0,0,0,0.5)' } }}>
                <ContentCopyIcon sx={{ fontSize: 10 }} />
              </IconButton>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.38)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {denial.location} · {denial.dischargeDate}
          </Typography>
        </Box>
      </Tooltip>

      {/* ── Zone 2a: Payer ───────────────────────────────────────────────────── */}
      <Box sx={{ width: 196, flexShrink: 0, px: 2, py: 2, borderRight: '1px solid rgba(0,0,0,0.055)', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <Tooltip
          title={denial.payer}
          placement="top"
          arrow
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          slotProps={{
            tooltip: { sx: { bgcolor: '#fff', color: 'rgba(0,0,0,0.87)', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: '8px', px: 1.5, py: 1, fontSize: '0.8125rem' } },
            arrow: { sx: { color: '#fff', '&::before': { border: '1px solid rgba(0,0,0,0.10)' } } },
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {denial.payer}
          </Typography>
        </Tooltip>
      </Box>

      {/* ── Zone 2b: Denial Type ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 2, borderRight: '1px solid rgba(0,0,0,0.055)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.42)', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
          {denial.type === 'DRG Downgrade'
            ? `DRG Downgrade${denial.drgTypeLabel ? ` (${denial.drgTypeLabel})` : ''}`
            : 'Medical Necessity'}
        </Typography>
        {denial.type === 'DRG Downgrade' && drgChangeData && drgFrom && (
          <Tooltip {...whiteTipProps} title={buildTooltipContent(drgChangeData.drgTooltip)}>
            <Typography onClick={(e) => e.stopPropagation()} sx={{ fontSize: '0.75rem', color: '#f58a2e', textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#f58a2e', textDecorationSkipInk: 'none', cursor: 'default', whiteSpace: 'nowrap', lineHeight: 1.4, '&:hover': { opacity: 0.8 } }}>
              {drgFrom} → {drgTo}
            </Typography>
          </Tooltip>
        )}
        {denial.type === 'Medical Necessity' && medicalNecessityData?.denialScope && (
          <Tooltip {...whiteTipProps} title={buildTooltipContent(medicalNecessityData.denialScope.tooltip)}>
            <Typography onClick={(e) => e.stopPropagation()} sx={{ fontSize: '0.75rem', color: '#f58a2e', textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#f58a2e', textDecorationSkipInk: 'none', cursor: 'default', whiteSpace: 'nowrap', lineHeight: 1.4, '&:hover': { opacity: 0.8 } }}>
              {medicalNecessityData.denialScope.chipLabel}
            </Typography>
          </Tooltip>
        )}
      </Box>

      {/* ── Zone 3: Priority Signals + Actions ──────────────────────────────── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', px: 2, py: 2 }}>

        {/* Deadline — 96px */}
        <Box sx={{ width: 96, mr: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '0.8125rem', color: isUrgent ? '#d44a52' : 'rgba(0,0,0,0.62)', fontWeight: isUrgent ? 500 : 400, lineHeight: 1.4, whiteSpace: 'nowrap' }}>
            {denial.appealDeadline || '—'}
          </Typography>
        </Box>


        {/* Level pill — 60px */}
        <Box sx={{ width: 60, display: 'flex', justifyContent: 'center', mr: 1.5 }}>
          <Box sx={{ bgcolor: '#F4F4F5', borderRadius: '4px', px: 0.875, py: '3px' }}>
            <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.5)', fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
              {denial.level}
            </Typography>
          </Box>
        </Box>

        {/* Status chip — 152px */}
        <Box sx={{ width: 152, mr: 1.5 }}>
          <Box sx={{ bgcolor: statusChip.bg, height: 28, borderRadius: '14px', display: 'inline-flex', alignItems: 'center', pl: 1.5, pr: denial.status === 'Generating' ? 1.5 : 0.5 }}>
            <Typography sx={{ color: statusChip.color, fontWeight: 500, fontSize: '0.75rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {denial.status}
            </Typography>
            {denial.status !== 'Generating' && (
              <ArrowDropDownIcon sx={{ color: statusChip.color, fontSize: 18 }} />
            )}
          </Box>
        </Box>

        {/* Assignee — 148px */}
        <Box
          onClick={(e) => { e.stopPropagation(); setAvatarMenuAnchor(e.currentTarget) }}
          sx={{ width: 148, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, cursor: 'pointer', borderRadius: '6px', px: 0.75, py: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
        >
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.42)', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {assignedTo || 'Unassigned'}
          </Typography>
          <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: getAvatarColor(assignedTo), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>
              {getInitials(assignedTo)}
            </Typography>
          </Box>
        </Box>
        <Menu
          anchorEl={avatarMenuAnchor}
          open={Boolean(avatarMenuAnchor)}
          onClose={() => setAvatarMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } } }}
        >
          {REVIEWER_OPTIONS.map(name => (
            <MenuItem key={name} selected={assignedTo === name} onClick={() => { setAssignedTo(name); setAvatarMenuAnchor(null) }} sx={{ fontSize: '0.875rem' }}>{name}</MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { setAssignedTo(''); setAvatarMenuAnchor(null) }} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Unassigned</MenuItem>
        </Menu>

        {/* Kebab */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setKebabMenuAnchor(e.currentTarget) }}
          sx={{ color: 'rgba(0,0,0,0.54)', p: '4px', opacity: (cardHovered || Boolean(kebabMenuAnchor)) ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}
        >
          <MoreHorizIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Menu
          anchorEl={kebabMenuAnchor}
          open={Boolean(kebabMenuAnchor)}
          onClose={() => setKebabMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 0.5, minWidth: 180, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } } }}
        >
          <MenuItem onClick={() => { onOpen?.(); setKebabMenuAnchor(null) }} sx={{ fontSize: '0.875rem' }}>Open denial</MenuItem>
          <MenuItem onClick={() => setKebabMenuAnchor(null)} sx={{ fontSize: '0.875rem' }}>Edit denial</MenuItem>
          <MenuItem onClick={() => setKebabMenuAnchor(null)} sx={{ fontSize: '0.875rem', color: 'error.main' }}>Delete denial</MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

// ─── ColumnHeader (sortable — mirrors DenialCardStyleE column widths) ─────────

interface ColumnHeaderProps {
  sortCol: string
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
}

function ColumnHeader({ sortCol, sortDir, onSort }: ColumnHeaderProps) {
  const hdrSx = { fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, lineHeight: 1 }

  const SortableCol = ({ colKey, children, align = 'flex-start' }: { colKey: string; children: React.ReactNode; align?: string }) => {
    const active = sortCol === colKey
    const SortIcon = active ? (sortDir === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon) : UnfoldMoreIcon
    return (
      <Box
        onClick={() => onSort(colKey)}
        sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: align, gap: 0.5, cursor: 'pointer', borderRadius: '4px', px: 0.5, py: '3px', mx: -0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }, userSelect: 'none' }}
      >
        <Typography sx={{ ...hdrSx, color: active ? '#157d9d' : 'rgba(0,0,0,0.38)' }}>{children}</Typography>
        <SortIcon sx={{ fontSize: 12, color: active ? '#157d9d' : 'rgba(0,0,0,0.25)', flexShrink: 0 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', borderLeft: '3px solid transparent', mb: 0.75 }}>
      <Box sx={{ width: 232, flexShrink: 0, px: 2.5 }}><SortableCol colKey="patient">Patient</SortableCol></Box>
      <Box sx={{ width: 196, flexShrink: 0, px: 2 }}><SortableCol colKey="payer">Payer</SortableCol></Box>
      <Box sx={{ flex: 1, minWidth: 0, px: 2 }}><SortableCol colKey="denialType">Denial Type</SortableCol></Box>
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', px: 2 }}>
        <Box sx={{ width: 96, mr: 1.5 }}><SortableCol colKey="deadline">Deadline</SortableCol></Box>
        <Box sx={{ width: 60, mr: 1.5, display: 'flex', justifyContent: 'center' }}><SortableCol colKey="level" align="center">Level</SortableCol></Box>
        <Box sx={{ width: 152, mr: 1.5 }}><SortableCol colKey="status">Status</SortableCol></Box>
        <Box sx={{ width: 148 }}><SortableCol colKey="assignee">Assignee</SortableCol></Box>
        <Box sx={{ width: 26 }} />
      </Box>
    </Box>
  )
}

// ─── DenialListStyleEPage ─────────────────────────────────────────────────────

export default function DenialListStyleEPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [levelFilter, setLevelFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [reviewerFilter, setReviewerFilter] = useState<string[]>([])
  const [payerFilter, setPayerFilter] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCol, setSortCol] = useState('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const parseDateVal = (mmddyyyy: string | null) => {
    if (!mmddyyyy) return 0
    const [m, d, y] = mmddyyyy.split('/')
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
  }
  const parseLevelNum = (s: string) => s ? parseInt(s.replace(/\D/g, '')) || 0 : 0

  const filteredDenials = useMemo(() => {
    const filtered = DENIAL_CARDS.filter((d) => {
      if (activeTab === 'Assigned To Me' && d.reviewer !== CURRENT_USER) return false
      if (activeTab === 'My Uploads' && d.uploadedBy !== CURRENT_USER) return false
      if (statusFilter.length > 0 && !statusFilter.includes(d.status)) return false
      if (typeFilter.length > 0 && !typeFilter.includes(d.type)) return false
      if (levelFilter && levelFilter !== 'All' && d.level !== levelFilter) return false
      if (locationFilter.length > 0 && !locationFilter.includes(d.location)) return false
      if (reviewerFilter.length > 0 && !reviewerFilter.includes(d.reviewer)) return false
      if (payerFilter.length > 0 && !payerFilter.includes(d.payer)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          d.patientName.toLowerCase().includes(q) ||
          d.visitId.includes(q) ||
          d.mrn.includes(q) ||
          d.fin.toLowerCase().includes(q)
        )
      }
      return true
    })

    filtered.sort((a, b) => {
      if (sortCol === 'status') {
        const aOrder = STATUS_SORT_ORDER[a.status] ?? 99
        const bOrder = STATUS_SORT_ORDER[b.status] ?? 99
        if (aOrder !== bOrder) return sortDir === 'asc' ? aOrder - bOrder : bOrder - aOrder
        return 0
      }
      let aVal: string | number, bVal: string | number
      if (sortCol === 'patient')         { aVal = a.patientName || '';              bVal = b.patientName || '' }
      else if (sortCol === 'payer')      { aVal = a.payer || '';                    bVal = b.payer || '' }
      else if (sortCol === 'denialType') { aVal = a.type || '';                     bVal = b.type || '' }
      else if (sortCol === 'deadline')   { aVal = parseDateVal(a.appealDeadline);   bVal = parseDateVal(b.appealDeadline) }
      else if (sortCol === 'level')      { aVal = parseLevelNum(a.level);           bVal = parseLevelNum(b.level) }
      else if (sortCol === 'assignee')   { aVal = a.assignedTo || '';               bVal = b.assignedTo || '' }
      else return 0
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [activeTab, statusFilter, typeFilter, levelFilter, locationFilter, reviewerFilter, payerFilter, searchQuery, sortCol, sortDir])

  const totalCount = DENIAL_CARDS.length
  const tabCounts = {
    All: totalCount,
    'Assigned To Me': DENIAL_CARDS.filter((d) => d.reviewer === CURRENT_USER).length,
    'My Uploads': DENIAL_CARDS.filter((d) => d.uploadedBy === CURRENT_USER).length,
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Cases header + tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Denials</Typography>
        <Box sx={{ display: 'inline-flex', gap: 0.5, bgcolor: '#f1f4f6', borderRadius: '28px', p: 0.5 }}>
          {TABS.map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              sx={{
                borderRadius: '20px',
                px: 2.5,
                py: 0.75,
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 500 : 400,
                bgcolor: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#157d9d' : '#636a6f',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                minWidth: 0,
                '&:hover': { bgcolor: activeTab === tab ? '#fff' : 'rgba(0,0,0,0.04)', boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.10)' : 'none' },
              }}
            >
              {tab} ({tabCounts[tab as keyof typeof tabCounts] ?? 0})
            </Button>
          ))}
        </Box>
      </Box>

      {/* Sticky filter row */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.25, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="Search (Visit ID, Name, MRN, FIN)"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem', bgcolor: '#fff' } }}
        />
        <FilterDropdown label="Status" type="status" options={STATUS_OPTIONS} selected={statusFilter} onSelectionChange={(v) => setStatusFilter(v as string[])} />
        <FilterDropdown label="Type" type="checkbox" options={TYPE_OPTIONS} selected={typeFilter} onSelectionChange={(v) => setTypeFilter(v as string[])} />
        <FilterDropdown label="Payer" type="checkbox" options={PAYER_OPTIONS} selected={payerFilter} onSelectionChange={(v) => setPayerFilter(v as string[])} />
        <FilterDropdown label="Level" type="radio" options={LEVEL_OPTIONS} selected={levelFilter} onSelectionChange={(v) => setLevelFilter(v as string)} />
        <FilterDropdown label="Location" type="checkbox" options={LOCATION_OPTIONS} selected={locationFilter} onSelectionChange={(v) => setLocationFilter(v as string[])} />
        <FilterDropdown label="Reviewer" type="autocomplete" options={REVIEWER_OPTIONS} selected={reviewerFilter} onSelectionChange={(v) => setReviewerFilter(v as string[])} />
      </Box>

      {/* Scrollable card list */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f1f4f6' }}>
        <Box sx={{ maxWidth: 1340, mx: 'auto', px: 3, pt: 2, pb: 3 }}>
          <ColumnHeader sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredDenials.map((denial) => (
              <DenialCardStyleE key={denial.id} denial={denial} />
            ))}
            {filteredDenials.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  No denials match the current filters.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

    </Box>
  )
}
