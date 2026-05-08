import { useState, useMemo, useRef } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment, Badge,
  Popover, Checkbox, Radio, RadioGroup, FormControlLabel, FormGroup,
  Divider, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Autocomplete, Chip, FormControl, InputLabel, Select,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import PersonIcon from '@mui/icons-material/Person'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import {
  STATUS_OPTIONS, TYPE_OPTIONS, LEVEL_OPTIONS, LOCATION_OPTIONS,
  REVIEWER_OPTIONS, DENIAL_CARDS, CURRENT_USER, type DenialCard,
} from '../data/denialListMockData'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Generating:           { bg: '#E3F2FD', color: '#1565C0' },
  'Ready for Review':   { bg: '#E0F2F1', color: '#009688' },
  'Ready to Submit':    { bg: '#E0F2F1', color: '#009688' },
  Submitted:            { bg: '#EFEBE9', color: '#5D4037' },
  Overturned:           { bg: '#E8F5E9', color: '#2E7D32' },
  'Denial Upheld':      { bg: '#FFEBEE', color: '#C62828' },
  'Needs Information':  { bg: '#FFF3E0', color: '#E65100' },
  Failed:               { bg: '#FFEBEE', color: '#C62828' },
  'Will Not Submit':    { bg: '#F5F5F5', color: '#616161' },
  Archived:             { bg: '#F5F5F5', color: '#616161' },
}

const statusColorMap: Record<string, string> = {
  'Generating':             '#1976D2',
  'Ready for Review':       '#2E7D32',
  'Ready to Submit':        '#2E7D32',
  'Submitted':              '#6D4C41',
  'Overturned':             '#6D4C41',
  'Denial Upheld':          '#6D4C41',
  'Needs Information':      '#ED6C02',
  'Failed':                 '#D32F2F',
  'Unsupported File Type':  '#D32F2F',
  'Upload Failed':          '#D32F2F',
  'Extraction Failed':      '#D32F2F',
  'Letter Writing Failed':  '#D32F2F',
  'Will Not Submit':        '#757575',
  'Archived':               '#757575',
  'Data Not Available':     '#757575',
  'Unsupported Date':       '#757575',
}

const TABS = ['All', 'Assigned To Me', 'My Uploads']

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimpleDrgCode {
  type: 'added' | 'removed'
  code: string
  description: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDenialReason(denial: DenialCard): string {
  if (denial.type === 'DRG Downgrade' && denial.drgChangeData) {
    return denial.drgChangeData.drgTooltip
      .filter(l => l !== '')
      .map(l => l.replace(/^•\s*/, ''))
      .join('. ')
  }
  if (denial.medicalNecessityData) {
    const parts: string[] = []
    const scope = denial.medicalNecessityData.denialScope
    const rationale = denial.medicalNecessityData.payerRationale
    if (scope) parts.push(scope.tooltip.map(l => l.trim().replace(/^•\s*/, '')).filter(Boolean).join('. '))
    if (rationale) parts.push(rationale.tooltip.map(l => l.trim().replace(/^•?\s*/, '')).filter(Boolean).join(' '))
    return parts.filter(Boolean).join('. ')
  }
  return '—'
}

function getDrgCodes(denial: DenialCard): SimpleDrgCode[] | null {
  if (!denial.drgChangeData) return null
  const codes: SimpleDrgCode[] = []

  const extractDesc = (tooltip: string[], id: string): string => {
    const line = tooltip.find(l => l.includes('  • '))
    if (!line) return id
    return line.replace(/^\s*•\s*/, '').replace(new RegExp(`^${id}\\s*`), '').trim()
  }

  for (const change of denial.drgChangeData.diagnosisChanges) {
    if (change.kind === 'principal_changed') {
      const payerLine = change.tooltip.find(l => l.includes('Payer'))
      const desc = payerLine
        ? payerLine.replace(/^\s*•\s*Payer principal diagnosis:\s*/, '').replace(new RegExp(`^${change.id}\\s*`), '').trim()
        : change.id
      codes.push({ type: 'added', code: change.id, description: desc })
    } else {
      codes.push({
        type: change.kind === 'added' ? 'added' : 'removed',
        code: change.id,
        description: extractDesc(change.tooltip, change.id),
      })
    }
  }

  for (const change of denial.drgChangeData.procedureChanges) {
    codes.push({
      type: change.kind === 'added' ? 'added' : 'removed',
      code: change.id,
      description: extractDesc(change.tooltip, change.id),
    })
  }

  return codes.length > 0 ? codes : null
}

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
          borderRadius: '6px',
          borderColor: isActive ? 'primary.main' : 'rgba(0,0,0,0.23)',
          bgcolor: isActive ? 'rgba(25,118,210,0.08)' : '#fff',
          color: isActive ? 'primary.main' : 'text.secondary',
          fontWeight: 500,
          fontSize: '0.8125rem',
          px: 1.5,
          py: 0.5,
          '&:hover': {
            borderColor: isActive ? 'primary.main' : 'rgba(0,0,0,0.5)',
            bgcolor: isActive ? 'rgba(25,118,210,0.12)' : 'rgba(0,0,0,0.04)',
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

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      <Typography sx={{ color: '#616161', fontSize: '0.75rem', lineHeight: '17px', flexShrink: 0, width: 131 }}>
        {label}:
      </Typography>
      <Typography sx={{ color: '#616161', fontSize: '0.75rem', lineHeight: '17px' }}>
        {value || '–'}
      </Typography>
    </Box>
  )
}

// ─── PillChip ────────────────────────────────────────────────────────────────

function PillChip({ label, bgcolor, color, showArrow = true }: { label: string; bgcolor: string; color: string; showArrow?: boolean }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor, borderRadius: '16px', px: 1.5, height: 32, cursor: showArrow ? 'pointer' : 'default' }}>
      <Typography sx={{ color, fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1 }}>
        {label}
      </Typography>
      {showArrow && <ArrowDropDownIcon sx={{ color, fontSize: 18, ml: 0.25 }} />}
    </Box>
  )
}

// ─── DenialCard ──────────────────────────────────────────────────────────────

function DenialCardV1({ denial }: { denial: DenialCard }) {
  const [reviewer, setReviewer] = useState(denial.reviewer)
  const statusChip = STATUS_CONFIG[denial.status] || { bg: '#F5F5F5', color: '#616161' }

  const isDeadlinePassed = (() => {
    if (!denial.appealDeadline) return null
    const [m, d, y] = denial.appealDeadline.split('/')
    const deadline = new Date(Number(y), Number(m) - 1, Number(d))
    return deadline < new Date()
  })()

  const deadlineLabel = (() => {
    if (!denial.appealDeadline) return 'Deadline missing'
    if (isDeadlinePassed) return `Deadline passed: ${denial.appealDeadline}`
    return `Deadline: ${denial.appealDeadline}`
  })()

  const deadlineColor = isDeadlinePassed === null ? '#BDBDBD' : isDeadlinePassed ? '#C62828' : '#0288D1'
  const denialReason = getDenialReason(denial)
  const drgCodes = getDrgCodes(denial)

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '6px', boxShadow: '0 2px 2px rgba(0,0,0,0.10)', py: 3, px: 5, display: 'flex', gap: 0, alignItems: 'flex-start' }}>

      {/* Left: Patient info */}
      <Box sx={{ width: 315, flexShrink: 0, pr: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ width: 23, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PersonIcon sx={{ color: '#009688', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, color: '#616161', fontSize: '1rem', lineHeight: '24px' }}>
            {denial.patientName.toUpperCase()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <InfoRow label="FIN" value={denial.fin} />
          <InfoRow label="MRN" value={denial.mrn} />
          <InfoRow label="Visit ID" value={denial.visitId} />
          <InfoRow label="Discharged" value={denial.dischargeDate} />
          <InfoRow label="Location" value={denial.location} />
          {denial.atRisk && <InfoRow label="At Risk" value={denial.atRisk} />}
        </Box>
      </Box>

      {/* Middle: Denial details */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ color: '#1976D2', fontWeight: 700, fontSize: '1.125rem', lineHeight: '27px', cursor: 'pointer' }}>
              {denial.type}
            </Typography>
            <Typography sx={{ color: '#616161', fontSize: '0.75rem', lineHeight: '17px' }}>
              Created {denial.createdDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 2 }}>
            <Chip
              label={deadlineLabel}
              size="medium"
              variant="outlined"
              sx={{ borderColor: deadlineColor, color: deadlineColor, fontWeight: 400, fontSize: '0.8125rem', height: 32, borderRadius: '100px' }}
            />
            <PillChip label={denial.level} bgcolor="rgba(0,0,0,0.08)" color="#455A64" />
            <PillChip label={denial.status} bgcolor={statusChip.bg} color={statusChip.color} />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: '#757575', fontSize: '0.75rem', fontWeight: 600, lineHeight: '18px' }}>Payer</Typography>
          <Typography sx={{ color: 'rgba(0,0,0,0.87)', fontSize: '0.875rem', lineHeight: '21px' }}>{denial.payer}</Typography>
        </Box>

        <Box sx={{ mb: drgCodes ? 2 : 0 }}>
          <Typography sx={{ color: '#757575', fontSize: '0.75rem', fontWeight: 600, lineHeight: '18px' }}>Reason for Denial</Typography>
          <Box sx={{ position: 'relative' }}>
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', lineHeight: '21px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {denialReason}
            </Typography>
            <Typography component="span" sx={{ color: '#1976D2', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline', '&:hover': { opacity: 0.8 } }}>
              View More
            </Typography>
          </Box>
        </Box>

        {drgCodes && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {drgCodes.map((drg, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 64, flexShrink: 0 }}>
                  <Chip
                    label={drg.type === 'added' ? 'Added' : 'Removed'}
                    size="small"
                    sx={{ width: '100%', bgcolor: drg.type === 'added' ? '#d0f0c0' : '#f8d7da', color: drg.type === 'added' ? '#006400' : '#721c24', fontSize: '0.7125rem', height: 24, borderRadius: '16px', '& .MuiChip-label': { px: 0, textAlign: 'center', width: '100%' } }}
                  />
                </Box>
                <Box sx={{ width: 45, flexShrink: 0 }}>
                  <Chip
                    label={drg.code}
                    size="small"
                    variant="outlined"
                    sx={{ width: '100%', borderColor: '#bdbdbd', color: '#000', fontSize: '0.7125rem', height: 24, borderRadius: '16px', '& .MuiChip-label': { px: 0, textAlign: 'center', width: '100%' } }}
                  />
                </Box>
                <Typography sx={{ fontSize: '0.77rem', color: '#616161', fontWeight: 500 }}>{drg.description}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right: Actions */}
      <Box sx={{ width: 236, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, pl: 3 }}>
        <Button
          sx={{ bgcolor: '#E7F3FA', color: '#1565C0', fontWeight: 700, fontSize: '0.875rem', borderRadius: '8px', py: 1, width: '100%', '&:hover': { bgcolor: '#D6EAF8' } }}
        >
          Review Appeal
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Typography sx={{ color: '#1976D2', fontSize: '0.7rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
            Edit Denial Details
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.6563rem', color: '#616161' }}>Reviewer</InputLabel>
            <Select
              value={reviewer}
              label="Reviewer"
              onChange={e => setReviewer(e.target.value)}
              sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { py: 1.25 } }}
            >
              {REVIEWER_OPTIONS.map(name => (
                <MenuItem key={name} value={name} sx={{ fontSize: '0.875rem' }}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {denial.commentCount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
            <IconButton size="small" sx={{ color: '#616161' }}>
              <Badge badgeContent={denial.commentCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', height: 16, minWidth: 16 } }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Box>
        )}
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
  const [searchQuery, setSearchQuery] = useState('')
  const [newDenialAnchor, setNewDenialAnchor] = useState<HTMLElement | null>(null)

  const filteredDenials = useMemo(() => {
    return DENIAL_CARDS.filter((d) => {
      if (activeTab === 'Assigned To Me' && d.reviewer !== CURRENT_USER) return false
      if (activeTab === 'My Uploads' && d.uploadedBy !== CURRENT_USER) return false
      if (statusFilter.length > 0 && !statusFilter.includes(d.status)) return false
      if (typeFilter.length > 0 && !typeFilter.includes(d.type)) return false
      if (levelFilter && levelFilter !== 'All' && d.level !== levelFilter) return false
      if (locationFilter.length > 0 && !locationFilter.includes(d.location)) return false
      if (reviewerFilter.length > 0 && !reviewerFilter.includes(d.reviewer)) return false
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
  }, [activeTab, statusFilter, typeFilter, levelFilter, locationFilter, reviewerFilter, searchQuery])

  const totalCount = DENIAL_CARDS.length
  const tabCounts = {
    All: totalCount,
    'Assigned To Me': DENIAL_CARDS.filter(d => d.reviewer === CURRENT_USER).length,
    'My Uploads': DENIAL_CARDS.filter(d => d.uploadedBy === CURRENT_USER).length,
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#F5F5F5' }}>

        {/* Header */}
        <Box sx={{ maxWidth: 1340, mx: 'auto', px: 3, pt: 3 }}>

          {/* Title + Tabs + New Denial */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', flexShrink: 0 }}>
              Denials
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#fff', borderRadius: '28px', p: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              {TABS.map(tab => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    borderRadius: '20px',
                    px: 2.5,
                    py: 1.25,
                    fontSize: '0.875rem',
                    fontWeight: activeTab === tab ? 500 : 400,
                    bgcolor: activeTab === tab ? '#E3F2FD' : 'transparent',
                    color: activeTab === tab ? '#2563EB' : '#757575',
                    boxShadow: 'none',
                    minWidth: 0,
                    '&:hover': { bgcolor: activeTab === tab ? '#E3F2FD' : 'rgba(0,0,0,0.04)' },
                  }}
                >
                  {tab} ({tabCounts[tab as keyof typeof tabCounts] ?? 0})
                </Button>
              ))}
            </Box>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              endIcon={<KeyboardArrowDownIcon />}
              onClick={e => setNewDenialAnchor(e.currentTarget)}
              sx={{ bgcolor: '#1976D2', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 500, px: 2 }}
            >
              New Denial
            </Button>
            <Menu
              anchorEl={newDenialAnchor}
              open={Boolean(newDenialAnchor)}
              onClose={() => setNewDenialAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } } }}
            >
              <MenuItem onClick={() => setNewDenialAnchor(null)}>
                <ListItemIcon><CloudUploadIcon sx={{ color: '#1976D2' }} /></ListItemIcon>
                <ListItemText primary="Upload Denial" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
              </MenuItem>
              <MenuItem onClick={() => setNewDenialAnchor(null)}>
                <ListItemIcon><DriveFileRenameOutlineIcon sx={{ color: '#5C6BC0' }} /></ListItemIcon>
                <ListItemText primary="Start Manually" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: '#616161' }} />
              </MenuItem>
            </Menu>
          </Box>

          {/* Search + Filters + Count + Sort */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2 }}>
            <TextField
              placeholder="Search (Visit ID, Name, MRN, FIN)"
              size="small"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
            <FilterDropdown label="Status" type="status" options={STATUS_OPTIONS} selected={statusFilter} onSelectionChange={v => setStatusFilter(v as string[])} />
            <FilterDropdown label="Type" type="checkbox" options={TYPE_OPTIONS} selected={typeFilter} onSelectionChange={v => setTypeFilter(v as string[])} />
            <FilterDropdown label="Level" type="radio" options={LEVEL_OPTIONS} selected={levelFilter} onSelectionChange={v => setLevelFilter(v as string)} />
            <FilterDropdown label="Location" type="checkbox" options={LOCATION_OPTIONS} selected={locationFilter} onSelectionChange={v => setLocationFilter(v as string[])} />
            <FilterDropdown label="Reviewer" type="autocomplete" options={REVIEWER_OPTIONS} selected={reviewerFilter} onSelectionChange={v => setReviewerFilter(v as string[])} />
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {filteredDenials.length}/{totalCount}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapVertIcon sx={{ fontSize: 16 }} />}
                endIcon={<ArrowDropDownIcon />}
                sx={{ borderRadius: '6px', borderColor: 'rgba(0,0,0,0.23)', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500, fontSize: '0.8125rem' }}
              >
                Sort: Upload Date
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Denial Cards */}
        <Box sx={{ maxWidth: 1340, mx: 'auto', px: 3, pt: 0, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filteredDenials.map(denial => (
            <DenialCardV1 key={denial.id} denial={denial} />
          ))}
          {filteredDenials.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary">No denials match the current filters.</Typography>
            </Box>
          )}
        </Box>

      </Box>
    </Box>
  )
}
