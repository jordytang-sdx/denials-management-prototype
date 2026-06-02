// V3 — AI Editor chat. Conversation panel that lives in the Appeal-tab right
// rail alongside Supporting Evidence (segmented switcher). Surfaces:
//   - Welcome state with suggested actions
//   - Conversation thread: user prompts + AI replies + applied-edit chips
//   - Composer pinned to the bottom with attach + send
//
// All visuals use SmarterDx design tokens. AI accent = DS ocean (no purple).

import { Box, Typography, IconButton, ButtonBase, Tooltip } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
// Icons: lucide-react matches the SmarterDx DS.
import { Sparkles, ArrowUp, Paperclip, CheckCircle2, RotateCcw } from 'lucide-react'

interface Suggestion {
  id: string
  label: string
  prompt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  body: string
  applied?: { label: string; count?: number }[]
  timestamp: string
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { id: 's1', label: 'Strengthen clinical argument',  prompt: 'Strengthen the clinical argument with the evidence available.' },
  { id: 's2', label: 'Tighten the tone',              prompt: 'Tighten the tone — more direct, less hedging.' },
  { id: 's3', label: 'Add citations from chart',      prompt: 'Cite the strongest chart evidence inline.' },
  { id: 's4', label: 'Shorten letter',                prompt: 'Shorten the letter while preserving the key arguments.' },
]

export default function V3AiEditorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, pending])

  const send = (prompt: string) => {
    const text = prompt.trim()
    if (!text) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      body: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setDraft('')
    setPending(true)
    window.setTimeout(() => {
      setMessages(prev => [...prev, mockReply(text)])
      setPending(false)
    }, 900)
  }

  const handleReset = () => {
    setMessages([])
    setPending(false)
  }

  const empty = messages.length === 0 && !pending

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'var(--colors-grey-1)' }}>
      {/* Header strip — Reset action */}
      {!empty && (
        <Box sx={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 'var(--spacing-3)', py: 'var(--spacing-2)',
          borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--colors-ocean-4)' }} />
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              fontWeight: 'var(--font-weights-medium)',
              color: 'var(--colors-text-secondary)',
            }}>
              AI Editor
            </Typography>
          </Box>
          <Tooltip title="New conversation">
            <IconButton
              size="small"
              onClick={handleReset}
              sx={{
                width: 24, height: 24,
                borderRadius: 'var(--radii-sm)',
                color: 'var(--colors-interactive-ghost-text)',
                '&:hover': {
                  bgcolor: 'var(--colors-interactive-hover-ghost-background)',
                  color: 'var(--colors-interactive-hover-ghost-text)',
                },
                '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
              }}
            >
              <RotateCcw size={16} strokeWidth={2} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Conversation / welcome */}
      <Box
        ref={scrollRef}
        sx={{ flex: 1, overflowY: 'auto', px: 'var(--spacing-3)', py: 'var(--spacing-4)' }}
      >
        {empty ? (
          <WelcomeState onPick={send} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {messages.map(m => (m.role === 'user' ? <UserBubble key={m.id} message={m} /> : <AssistantBubble key={m.id} message={m} />))}
            {pending && <ThinkingBubble />}
          </Box>
        )}
      </Box>

      {/* Composer */}
      <Box sx={{
        flexShrink: 0,
        px: 'var(--spacing-3)', pb: 'var(--spacing-3)', pt: 'var(--spacing-1)',
        bgcolor: 'var(--colors-grey-1)',
      }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-1)',
          border: 'var(--border-widths-thin) solid var(--colors-interactive-input-border)',
          borderRadius: 'var(--radii-md)',
          bgcolor: 'var(--colors-interactive-input-background)',
          px: 'var(--spacing-2)', py: 'var(--spacing-1)',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '&:focus-within': {
            borderColor: 'var(--colors-ocean-4)',
            boxShadow: 'var(--shadows-interactive-focus-focus-ring)',
          },
        }}>
          <Box component="span" sx={{
            display: 'inline-flex',
            color: 'var(--colors-ocean-4)',
            mb: 'var(--spacing-2)', ml: 'var(--spacing-1)',
            flexShrink: 0,
          }}>
            <Sparkles size={14} strokeWidth={2} />
          </Box>
          <Box
            component="textarea"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                send(draft)
              }
            }}
            placeholder="Ask AI to edit the letter…"
            rows={2}
            sx={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'inherit',
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-interactive-input-text)',
              lineHeight: 1.5, bgcolor: 'transparent',
              px: 'var(--spacing-1)', py: 'var(--spacing-1)',
              '&::placeholder': { color: 'var(--colors-interactive-input-placeholder)' },
            }}
          />
          <Tooltip title="Attach context">
            <IconButton
              size="small"
              sx={{
                width: 26, height: 26,
                borderRadius: 'var(--radii-sm)',
                color: 'var(--colors-interactive-ghost-text)',
                '&:hover': {
                  bgcolor: 'var(--colors-interactive-hover-ghost-background)',
                  color: 'var(--colors-interactive-hover-ghost-text)',
                },
              }}
            >
              <Paperclip size={14} strokeWidth={2} />
            </IconButton>
          </Tooltip>
          <Tooltip title={draft.trim() ? 'Send (⌘↵)' : 'Type a prompt first'}>
            <span>
              <IconButton
                size="small"
                disabled={!draft.trim() || pending}
                onClick={() => send(draft)}
                sx={{
                  width: 26, height: 26,
                  borderRadius: 'var(--radii-sm)',
                  bgcolor: draft.trim() && !pending
                    ? 'var(--colors-interactive-action-background)'
                    : 'var(--colors-interactive-disabled-action-background)',
                  color: 'var(--colors-interactive-action-text)',
                  '&:hover': {
                    bgcolor: draft.trim() && !pending
                      ? 'var(--colors-ocean-5)'
                      : 'var(--colors-interactive-disabled-action-background)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'var(--colors-interactive-disabled-action-background)',
                    color: 'var(--colors-interactive-disabled-action-text)',
                  },
                }}
              >
                <ArrowUp size={14} strokeWidth={2} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography sx={{
          fontSize: 'var(--font-sizes-10)',
          color: 'var(--colors-text-tertiary)',
          mt: 'var(--spacing-2)',
        }}>
          AI edits are previewed in the letter — accept or revert in the editor toolbar.
        </Typography>
      </Box>
    </Box>
  )
}

// ─── Subviews ─────────────────────────────────────────────────────────────────

function AiAvatar({ size = 22 }: { size?: number }) {
  return (
    <Box sx={{
      width: size, height: size,
      borderRadius: 'var(--radii-sm)',
      bgcolor: 'var(--colors-ocean-4)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Sparkles size={12} strokeWidth={2} style={{ color: 'var(--colors-text-inverse)' }} />
    </Box>
  )
}

function WelcomeState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', mb: 'var(--spacing-2)' }}>
        <AiAvatar size={24} />
        <Typography sx={{
          fontSize: 'var(--font-sizes-14)',
          fontWeight: 'var(--font-weights-semibold)',
          color: 'var(--colors-text-primary)',
        }}>
          What should I help with?
        </Typography>
      </Box>
      <Typography sx={{
        fontSize: 'var(--font-sizes-12)',
        color: 'var(--colors-text-secondary)',
        lineHeight: 1.55,
        mb: 'var(--spacing-4)',
      }}>
        Ask me to revise tone, strengthen arguments, add citations from the chart, or anything else about this letter.
      </Typography>

      <Typography sx={{
        fontSize: 'var(--font-sizes-10)',
        fontWeight: 'var(--font-weights-bold)',
        color: 'var(--colors-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        mb: 'var(--spacing-2)',
      }}>
        Suggested
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
        {DEFAULT_SUGGESTIONS.map(s => (
          <ButtonBase
            key={s.id}
            onClick={() => onPick(s.prompt)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
              textAlign: 'left', justifyContent: 'flex-start',
              border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
              borderRadius: 'var(--radii-card-radius)',
              bgcolor: 'var(--colors-grey-1)',
              px: 'var(--spacing-3)', py: 'var(--spacing-2)',
              transition: 'background-color 120ms ease, border-color 120ms ease',
              '&:hover': {
                borderColor: 'var(--colors-ocean-4)',
                bgcolor: 'var(--colors-ocean-1)',
              },
              '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
            }}
          >
            <Sparkles size={12} strokeWidth={2} style={{ color: 'var(--colors-ocean-4)', flexShrink: 0 }} />
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-text-primary)',
              fontWeight: 'var(--font-weights-medium)',
            }}>
              {s.label}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  )
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{
        maxWidth: '85%',
        bgcolor: 'var(--colors-ocean-1)',
        color: 'var(--colors-ocean-9)',
        border: 'var(--border-widths-thin) solid var(--colors-ocean-2)',
        borderRadius: 'var(--radii-md)',
        px: 'var(--spacing-3)', py: 'var(--spacing-2)',
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)',
          color: 'var(--colors-ocean-9)',
          lineHeight: 1.5, whiteSpace: 'pre-wrap',
        }}>
          {message.body}
        </Typography>
      </Box>
    </Box>
  )
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  return (
    <Box sx={{ display: 'flex', gap: 'var(--spacing-2)' }}>
      <AiAvatar />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)',
          color: 'var(--colors-text-primary)',
          lineHeight: 1.55, whiteSpace: 'pre-wrap',
          mb: message.applied?.length ? 'var(--spacing-2)' : 0,
        }}>
          {message.body}
        </Typography>
        {message.applied && message.applied.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', mt: 'var(--spacing-1)' }}>
            {message.applied.map((a, i) => (
              <Box key={i} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
                border: 'var(--border-widths-badge-border-width) solid var(--colors-badge-variant-success-subtle-border)',
                bgcolor: 'var(--colors-badge-variant-success-subtle-background)',
                borderRadius: 'var(--radii-sm)',
                px: 'var(--spacing-2)', py: 'var(--spacing-1)',
              }}>
                <CheckCircle2 size={12} strokeWidth={2} style={{
                  color: 'var(--colors-badge-variant-success-subtle-icon, var(--colors-badge-variant-success-subtle-text))',
                }} />
                <Typography sx={{
                  fontSize: 'var(--font-sizes-12)',
                  color: 'var(--colors-badge-variant-success-subtle-text)',
                  fontWeight: 'var(--font-weights-medium)',
                }}>
                  {a.label}{typeof a.count === 'number' ? ` · ${a.count}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function ThinkingBubble() {
  return (
    <Box sx={{ display: 'flex', gap: 'var(--spacing-2)' }}>
      <AiAvatar />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', mt: 'var(--spacing-1)' }}>
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            width: 5, height: 5,
            borderRadius: 'var(--radii-full)',
            bgcolor: 'var(--colors-ocean-4)',
            animation: 'v3-ai-dot 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
            '@keyframes v3-ai-dot': {
              '0%, 80%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
              '40%': { opacity: 1, transform: 'translateY(-2px)' },
            },
          }} />
        ))}
      </Box>
    </Box>
  )
}

// Prototype mock — fabricates an assistant reply based on the user prompt.
function mockReply(prompt: string): ChatMessage {
  const lower = prompt.toLowerCase()
  let body = ''
  const applied: { label: string; count?: number }[] = []
  if (/strength|argument|clinical/.test(lower)) {
    body = 'I tightened the clinical argument around sepsis and added supporting language for the SIRS criteria documented in the chart.'
    applied.push({ label: 'Reinforced sepsis argument' }, { label: 'Inserted SIRS criteria citations', count: 2 })
  } else if (/tone|tighten|direct/.test(lower)) {
    body = 'I revised the letter for a more direct tone — removed hedging phrases and condensed the introduction.'
    applied.push({ label: 'Removed hedging language', count: 6 }, { label: 'Tightened introduction' })
  } else if (/cite|citation|chart/.test(lower)) {
    body = 'Added inline citations to the strongest chart-sourced evidence.'
    applied.push({ label: 'Added evidence citations', count: 4 })
  } else if (/short|condense|brief/.test(lower)) {
    body = 'Shortened the letter while preserving the core arguments and required identifiers.'
    applied.push({ label: 'Reduced length' }, { label: 'Preserved required identifiers' })
  } else {
    body = 'Done — applied the requested edit. Review the changes in the letter and accept or revert from the toolbar.'
    applied.push({ label: 'Applied edit' })
  }
  return {
    id: `a-${Date.now()}`,
    role: 'assistant',
    body, applied,
    timestamp: new Date().toISOString(),
  }
}
