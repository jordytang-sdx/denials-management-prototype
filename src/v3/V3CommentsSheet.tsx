// V3 — Comments sheet. Right-side overlay drawer surfacing case-level comments.
// Scoped to the case workspace (not the viewport), so the case header stays
// visible above the sheet — the conversation reads as belonging to *this* case.
// All visuals use SmarterDx design tokens.

import { Box, Typography, IconButton, ButtonBase, Tooltip } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
// Icons: lucide-react matches the SmarterDx DS.
import { X, ArrowUp } from 'lucide-react'

export interface CaseComment {
  id: string
  author: string
  authorInitials: string
  // CSS color expression — pass a token like 'var(--colors-ocean-7)'. Required
  // so authors are visually distinguishable. No raw hex.
  authorColorToken: string
  // ISO timestamp — formatter falls back to absolute if relative doesn't make sense.
  createdAt: string
  body: string
  // Optional self flag — controls "own comment" affordances.
  isSelf?: boolean
}

interface V3CommentsSheetProps {
  open: boolean
  onClose: () => void
  comments: CaseComment[]
  onAddComment: (body: string) => void
}

type FilterKey = 'all' | 'mine' | 'mentions'

function relativeTime(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const now = Date.now()
  const diff = Math.max(0, now - t)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const d = new Date(t)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function V3CommentsSheet({ open, onClose, comments, onAddComment }: V3CommentsSheetProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [open, comments.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = comments.filter(c => {
    if (filter === 'mine') return c.isSelf
    if (filter === 'mentions') return /@\w/.test(c.body)
    return true
  })

  const handleSend = () => {
    const body = draft.trim()
    if (!body) return
    onAddComment(body)
    setDraft('')
  }

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: comments.length },
    { key: 'mine',     label: 'Mine',     count: comments.filter(c => c.isSelf).length },
    { key: 'mentions', label: 'Mentions', count: comments.filter(c => /@\w/.test(c.body)).length },
  ]

  return (
    <>
      {/* Scrim — scoped to the case workspace */}
      <Box
        onClick={onClose}
        sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          // DS modal-overlay color at reduced alpha — workspace-scoped scrim is
          // lighter than full-screen modal because the case header above must
          // stay legible.
          bgcolor: 'color-mix(in oklch, var(--colors-modal-overlay-background) 25%, transparent)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease',
        }}
      />

      {/* Sheet */}
      <Box
        role="dialog"
        aria-label="Case comments"
        aria-hidden={!open}
        sx={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 100%)', zIndex: 11,
          bgcolor: 'var(--colors-grey-1)',
          borderLeft: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          boxShadow: 'var(--shadows-medium)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{
          flexShrink: 0,
          px: 'var(--spacing-4)',
          pt: 'var(--spacing-3)',
          pb: 'var(--spacing-2)',
          borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 'var(--spacing-2)' }}>
            <Typography sx={{
              fontSize: 'var(--font-sizes-16)',
              fontWeight: 'var(--font-weights-semibold)',
              color: 'var(--colors-text-primary)',
            }}>
              Comments
            </Typography>
            <Tooltip title="Close (Esc)">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  width: 28, height: 28,
                  borderRadius: 'var(--radii-sm)',
                  color: 'var(--colors-interactive-ghost-text)',
                  '&:hover': {
                    bgcolor: 'var(--colors-interactive-hover-ghost-background)',
                    color: 'var(--colors-interactive-hover-ghost-text)',
                  },
                  '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
                }}
              >
                <X size={18} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* DS pill-tab filter chips */}
          <Box sx={{ display: 'flex', gap: 'var(--spacing-1)' }}>
            {filterChips.map(chip => {
              const active = filter === chip.key
              return (
                <ButtonBase
                  key={chip.key}
                  onClick={() => setFilter(chip.key)}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
                    height: 24,
                    px: 'var(--spacing-2)',
                    borderRadius: 'var(--radii-full)',
                    fontSize: 'var(--font-sizes-12)',
                    fontWeight: active ? 'var(--font-weights-semibold)' : 'var(--font-weights-medium)',
                    color: active ? 'var(--colors-interactive-pill-tab-active-text)' : 'var(--colors-interactive-pill-tab-text)',
                    bgcolor: active ? 'var(--colors-interactive-pill-tab-active-background)' : 'var(--colors-interactive-pill-tab-background)',
                    border: 'var(--border-widths-thin) solid',
                    borderColor: active ? 'var(--colors-grey-3)' : 'var(--colors-grey-3)',
                    transition: 'background-color 120ms ease, color 120ms ease',
                    '&:hover': {
                      bgcolor: active ? 'var(--colors-interactive-hover-pill-tab-active-background)' : 'var(--colors-interactive-hover-pill-tab-background)',
                      color: active ? 'var(--colors-interactive-hover-pill-tab-active-text)' : 'var(--colors-interactive-hover-pill-tab-text)',
                    },
                    '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
                  }}
                >
                  {chip.label}
                  <Typography component="span" sx={{
                    fontSize: 'var(--font-sizes-10)',
                    fontWeight: 'var(--font-weights-semibold)',
                    color: active ? 'var(--colors-interactive-pill-tab-active-text)' : 'var(--colors-text-tertiary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {chip.count}
                  </Typography>
                </ButtonBase>
              )
            })}
          </Box>
        </Box>

        {/* Comments list */}
        <Box
          ref={listRef}
          sx={{
            flex: 1, overflowY: 'auto',
            px: 'var(--spacing-4)', py: 'var(--spacing-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)',
            bgcolor: 'var(--colors-grey-2)',
          }}
        >
          {filtered.length === 0 ? (
            <Box sx={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              py: 'var(--spacing-12)', textAlign: 'center',
            }}>
              <Typography sx={{
                fontSize: 'var(--font-sizes-14)',
                color: 'var(--colors-text-primary)',
                fontWeight: 'var(--font-weights-medium)',
                mb: 'var(--spacing-1)',
              }}>
                {filter === 'all' ? 'No comments yet' : 'Nothing matches this filter'}
              </Typography>
              <Typography sx={{
                fontSize: 'var(--font-sizes-12)',
                color: 'var(--colors-text-tertiary)',
                maxWidth: 240, lineHeight: 1.5,
              }}>
                {filter === 'all'
                  ? 'Leave context for anyone who picks this case up next.'
                  : 'Try a different filter or add a new comment.'}
              </Typography>
            </Box>
          ) : (
            filtered.map(c => <CommentItem key={c.id} comment={c} />)
          )}
        </Box>

        {/* Composer */}
        <Box sx={{
          flexShrink: 0,
          px: 'var(--spacing-4)', py: 'var(--spacing-3)',
          borderTop: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          bgcolor: 'var(--colors-grey-1)',
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-2)',
            border: 'var(--border-widths-thin) solid var(--colors-interactive-input-border)',
            borderRadius: 'var(--radii-md)',
            bgcolor: 'var(--colors-interactive-input-background)',
            px: 'var(--spacing-2)', py: 'var(--spacing-2)',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            '&:focus-within': {
              borderColor: 'var(--colors-ocean-4)',
              boxShadow: 'var(--shadows-interactive-focus-focus-ring)',
            },
          }}>
            <Box
              component="textarea"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Add a comment… ( ⌘↵ to send )"
              rows={2}
              sx={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'inherit',
                fontSize: 'var(--font-sizes-14)',
                color: 'var(--colors-interactive-input-text)',
                lineHeight: 1.5, bgcolor: 'transparent',
                '&::placeholder': { color: 'var(--colors-interactive-input-placeholder)' },
              }}
            />
            <Tooltip title={draft.trim() ? 'Send (⌘↵)' : 'Type a comment first'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!draft.trim()}
                  onClick={handleSend}
                  sx={{
                    width: 30, height: 30,
                    borderRadius: 'var(--radii-sm)',
                    bgcolor: draft.trim()
                      ? 'var(--colors-interactive-action-background)'
                      : 'var(--colors-interactive-disabled-action-background)',
                    color: 'var(--colors-interactive-action-text)',
                    '&:hover': {
                      bgcolor: draft.trim()
                        ? 'var(--colors-ocean-5)'
                        : 'var(--colors-interactive-disabled-action-background)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'var(--colors-interactive-disabled-action-background)',
                      color: 'var(--colors-interactive-disabled-action-text)',
                    },
                  }}
                >
                  <ArrowUp size={16} strokeWidth={2} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </>
  )
}

function CommentItem({ comment }: { comment: CaseComment }) {
  return (
    <Box sx={{ display: 'flex', gap: 'var(--spacing-3)' }}>
      <Box sx={{
        width: 28, height: 28,
        borderRadius: 'var(--radii-full)',
        bgcolor: comment.authorColorToken,
        color: 'var(--colors-text-inverse)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--font-sizes-10)',
        fontWeight: 'var(--font-weights-semibold)',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}>
        {comment.authorInitials}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2)', mb: 'var(--spacing-1)' }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-primary)',
          }}>
            {comment.author}
          </Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'var(--colors-text-tertiary)' }}>
            {relativeTime(comment.createdAt)}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: 'var(--colors-grey-1)',
          border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
          borderRadius: 'var(--radii-card-radius)',
          px: 'var(--spacing-3)', py: 'var(--spacing-2)',
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-primary)',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}>
            {comment.body}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
