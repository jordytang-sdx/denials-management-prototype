// V3 — Letter workspace primitive. Renders the appeal letter editor + (optional)
// floating AI prompt bar. Used inside Concept B (main pane) and Concept C
// (Appeal tab). Concept C hides the floating bar — its AI editor lives in the
// rail. All visuals via SmarterDx design tokens.

import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material'
import { useRef, useState, useEffect } from 'react'
// Icons: lucide-react matches the SmarterDx DS.
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter,
  Undo2, Copy, RotateCw, History, File, Check,
  Paperclip, ArrowUp, Sparkles,
} from 'lucide-react'
import { MOCK_APPEAL_LETTER } from '../case-page/mockData'

interface V3LetterWorkspaceProps {
  showDenialReasonCallout?: boolean
  denialDescription?: string
  // Concept C moves the AI editor into the right rail, so the floating prompt
  // bar would be redundant. Default keeps the floating bar (Concept B).
  hideAiPromptBar?: boolean
}

export default function V3LetterWorkspace({ showDenialReasonCallout = false, denialDescription, hideAiPromptBar = false }: V3LetterWorkspaceProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [prompt, setPrompt] = useState('')
  const [, setSavedAt] = useState<Date>(new Date())

  // Bump "Saved X ago" every 30s so the relative time refreshes during demos
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const exec = (cmd: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, undefined)
  }

  const handleCopy = async () => {
    const text = editorRef.current?.innerText || ''
    try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
  }

  const ghostActionSx = {
    fontSize: 'var(--font-sizes-12)',
    fontWeight: 'var(--font-weights-medium)',
    textTransform: 'none' as const,
    px: 'var(--spacing-2)', height: 30, minWidth: 0,
    borderRadius: 'var(--radii-sm)',
    color: 'var(--colors-interactive-ghost-text)',
    border: 'none', boxShadow: 'none',
    '&:hover': {
      bgcolor: 'var(--colors-interactive-hover-ghost-background)',
      color: 'var(--colors-interactive-hover-ghost-text)',
      border: 'none', boxShadow: 'none',
    },
    '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
  }

  const formatBtnSx = {
    width: 30, height: 30,
    borderRadius: 'var(--radii-sm)',
    color: 'var(--colors-interactive-ghost-text)',
    '&:hover': {
      bgcolor: 'var(--colors-interactive-hover-ghost-background)',
      color: 'var(--colors-interactive-hover-ghost-text)',
    },
    '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
  }

  const vDivider = (
    <Box sx={{
      width: 'var(--border-widths-thin)', height: 18,
      bgcolor: 'var(--colors-grey-3)',
      mx: 'var(--spacing-1)', alignSelf: 'center',
    }} />
  )

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      bgcolor: 'var(--colors-grey-1)', position: 'relative',
    }}>
      {/* Optional denial-reason callout */}
      {showDenialReasonCallout && denialDescription && (
        <Box sx={{
          px: 'var(--spacing-6)', py: 'var(--spacing-3)',
          borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          bgcolor: 'var(--colors-grey-1)', flexShrink: 0,
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-10)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            mb: 'var(--spacing-0-5)',
          }}>
            Denial Reason
          </Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-primary)', lineHeight: 1.5 }}>
            {denialDescription}
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Toolbar — sticky atop the letter */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 5,
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-0-5)',
          px: 'var(--spacing-4)', py: 'var(--spacing-1)',
          bgcolor: 'var(--colors-grey-1)',
          borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
        }}>
          <Tooltip title="Bold"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('bold') }} sx={formatBtnSx}><Bold size={18} strokeWidth={2} /></IconButton></Tooltip>
          <Tooltip title="Italic"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('italic') }} sx={formatBtnSx}><Italic size={18} strokeWidth={2} /></IconButton></Tooltip>
          <Tooltip title="Underline"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('underline') }} sx={formatBtnSx}><Underline size={18} strokeWidth={2} /></IconButton></Tooltip>
          {vDivider}
          <Tooltip title="Align left"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft') }} sx={formatBtnSx}><AlignLeft size={18} strokeWidth={2} /></IconButton></Tooltip>
          <Tooltip title="Align center"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter') }} sx={formatBtnSx}><AlignCenter size={18} strokeWidth={2} /></IconButton></Tooltip>
          {vDivider}
          <Tooltip title="Undo"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); exec('undo') }} sx={formatBtnSx}><Undo2 size={18} strokeWidth={2} /></IconButton></Tooltip>

          <Box sx={{ flex: 1 }} />

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)',
            color: 'var(--colors-text-tertiary)',
            minWidth: 110, justifyContent: 'flex-end',
          }}>
            <Check size={14} strokeWidth={2} />
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-text-tertiary)',
              userSelect: 'none',
            }}>
              Saved just now
            </Typography>
          </Box>
          {vDivider}

          <Button size="small" startIcon={<Copy size={16} strokeWidth={2} />} onClick={handleCopy} variant="text" sx={ghostActionSx}>Copy</Button>
          <Button size="small" startIcon={<RotateCw size={16} strokeWidth={2} />} variant="text" sx={ghostActionSx}>New Version</Button>
          <Button size="small" startIcon={<History size={16} strokeWidth={2} />} variant="text" sx={ghostActionSx}>History</Button>
          <Button size="small" startIcon={<File size={16} strokeWidth={2} />} variant="text" sx={ghostActionSx}>Export</Button>
        </Box>

        {/* The letter — contentEditable canvas */}
        <Box sx={{
          flex: 1, overflowY: 'auto',
          px: 'var(--spacing-6)', py: 'var(--spacing-5)',
          bgcolor: 'var(--colors-grey-2)',
        }}>
          <Box
            sx={{
              bgcolor: 'var(--colors-grey-1)',
              border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
              borderRadius: 'var(--radii-card-radius)',
              px: 'var(--spacing-6)', py: 'var(--spacing-5)',
              maxWidth: 820, mx: 'auto',
              boxShadow: 'var(--shadows-low)',
              minHeight: 600,
            }}
          >
            <Box
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => setSavedAt(new Date())}
              dangerouslySetInnerHTML={{ __html: MOCK_APPEAL_LETTER }}
              sx={{
                fontFamily: 'inherit',
                fontSize: 'var(--font-sizes-14)',
                lineHeight: 1.55,
                color: 'var(--colors-text-primary)',
                outline: 'none',
                '& p': { mb: 'var(--spacing-3)' },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ height: 100 }} />
      </Box>

      {/* AI prompt bar — floating, anchored to the bottom of the canvas (Concept B only) */}
      {!hideAiPromptBar && (
        <Box sx={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          width: 'min(680px, calc(100% - 48px))',
          bgcolor: 'var(--colors-grey-1)',
          border: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          borderRadius: 'var(--radii-lg)',
          boxShadow: 'var(--shadows-medium)',
          px: 'var(--spacing-2)', py: 'var(--spacing-1)',
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)',
        }}>
          <Box component="span" sx={{ display: 'inline-flex', color: 'var(--colors-ocean-4)', ml: 'var(--spacing-1)' }}>
            <Sparkles size={14} strokeWidth={2} />
          </Box>
          <Box
            component="input"
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
            placeholder="Ask AI to make an edit…"
            sx={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'inherit',
              fontSize: 'var(--font-sizes-14)',
              color: 'var(--colors-interactive-input-text)',
              px: 'var(--spacing-2)', height: 32,
              bgcolor: 'transparent',
              '&::placeholder': { color: 'var(--colors-interactive-input-placeholder)' },
            }}
          />
          <Tooltip title="Attach context">
            <IconButton
              size="small"
              sx={{
                width: 28, height: 28,
                borderRadius: 'var(--radii-sm)',
                color: 'var(--colors-interactive-ghost-text)',
                '&:hover': {
                  bgcolor: 'var(--colors-interactive-hover-ghost-background)',
                  color: 'var(--colors-interactive-hover-ghost-text)',
                },
              }}
            >
              <Paperclip size={16} strokeWidth={2} />
            </IconButton>
          </Tooltip>
          <Tooltip title={prompt.trim() ? 'Send prompt' : 'Type a prompt first'}>
            <span>
              <IconButton
                size="small"
                disabled={!prompt.trim()}
                sx={{
                  width: 28, height: 28,
                  borderRadius: 'var(--radii-sm)',
                  bgcolor: prompt.trim()
                    ? 'var(--colors-interactive-action-background)'
                    : 'var(--colors-interactive-disabled-action-background)',
                  color: 'var(--colors-interactive-action-text)',
                  '&:hover': {
                    bgcolor: prompt.trim()
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
      )}
    </Box>
  )
}
