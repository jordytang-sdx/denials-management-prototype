import { useState, useRef, useEffect, useId } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  /** 'inline' — borderless, parent provides the visual border */
  variant?: 'default' | 'inline'
  autoFocus?: boolean
}

export default function SmarterComboBox({
  value, onChange, options, placeholder, variant = 'default', autoFocus,
}: Props) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  // Show all options when no input; filter when user has typed something
  const filtered = value.trim()
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options

  // Recalculate dropdown position whenever it opens or the window scrolls/resizes
  function updateDropdownPos() {
    const rect = inputRef.current?.getBoundingClientRect()
    if (rect) {
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
  }

  useEffect(() => {
    if (!open) return
    updateDropdownPos()
    window.addEventListener('scroll', updateDropdownPos, true)
    window.addEventListener('resize', updateDropdownPos)
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true)
      window.removeEventListener('resize', updateDropdownPos)
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node
      const isInsideContainer = containerRef.current?.contains(target)
      const isInsideList = listRef.current?.contains(target)
      if (!isInsideContainer && !isInsideList) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      setActiveIndex(0)
      e.preventDefault()
      return
    }
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        e.preventDefault()
        break
      case 'ArrowUp':
        setActiveIndex(i => Math.max(i - 1, 0))
        e.preventDefault()
        break
      case 'Enter':
        if (activeIndex >= 0 && filtered[activeIndex]) {
          onChange(filtered[activeIndex]!)
          setOpen(false)
          setActiveIndex(-1)
        }
        e.preventDefault()
        break
      case 'Escape':
        setOpen(false)
        setActiveIndex(-1)
        break
      case 'Tab':
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const isInline = variant === 'inline'

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: isInline ? '36px' : '32px',
          padding: '0 10px',
          border: isInline ? 'none' : '1px solid var(--colors-interactive-input-border)',
          borderRadius: isInline ? '0' : 'var(--radii-select-trigger-radius)',
          background: 'transparent',
          color: 'var(--colors-interactive-input-text)',
          fontSize: 'var(--font-sizes-14)',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
        onFocus={() => { setOpen(true); updateDropdownPos() }}
        onChange={e => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        onFocusCapture={e => {
          if (!isInline) {
            e.currentTarget.style.borderColor = 'var(--colors-select-trigger-focus-border)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--colors-select-trigger-focus-ring-color)'
          }
        }}
        onBlurCapture={e => {
          if (!isInline) {
            e.currentTarget.style.borderColor = 'var(--colors-interactive-input-border)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      />

      {open && filtered.length > 0 && dropdownRect && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          style={{
            // fixed position escapes any overflow:hidden ancestors
            position: 'fixed',
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            background: 'var(--colors-select-content-background)',
            border: '1px solid var(--colors-select-content-border-color)',
            borderRadius: 'var(--radii-select-content-radius)',
            boxShadow: 'var(--shadows-low)',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onChange(opt)
                setOpen(false)
                setActiveIndex(-1)
                inputRef.current?.focus()
              }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '7px 12px',
                fontSize: 'var(--font-sizes-14)',
                color: 'var(--colors-select-item-text)',
                cursor: 'pointer',
                background: i === activeIndex ? 'var(--colors-grey-2)' : 'transparent',
                fontWeight: i === activeIndex ? 'var(--font-weights-medium)' : 'var(--font-weights-regular)',
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
