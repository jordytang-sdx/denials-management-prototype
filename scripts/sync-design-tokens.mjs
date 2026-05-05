#!/usr/bin/env node
/**
 * Syncs the SmarterDX design system token CSS from the live Storybook.
 *
 * - Fetches the current Storybook iframe.html to find the hashed CSS bundle URL
 * - Downloads the bundle and extracts the @layer tokens block (CSS custom properties)
 * - Writes the result to src/design-system-tokens.css
 *
 * Run: npm run sync-ds
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STORYBOOK_BASE = 'https://frontend.dev.smarterdx.net/storybook'
const OUT_PATH = join(ROOT, 'src', 'design-system-tokens.css')

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

function extractTokensLayer(css) {
  // Find @layer tokens{ and extract everything inside via brace counting
  const marker = '@layer tokens{'
  const start = css.indexOf(marker)
  if (start === -1) throw new Error('Could not find @layer tokens in CSS bundle')

  let depth = 0
  let layerStart = -1
  let layerEnd = -1

  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) layerStart = i + 1
      depth++
    } else if (css[i] === '}') {
      depth--
      if (depth === 0) {
        layerEnd = i
        break
      }
    }
  }

  if (layerStart === -1 || layerEnd === -1) throw new Error('Malformed @layer tokens block')
  return css.slice(layerStart, layerEnd)
}

async function main() {
  console.log('Fetching Storybook iframe.html...')
  const html = await fetchText(`${STORYBOOK_BASE}/iframe.html`)

  const cssMatch = html.match(/href="([^"]*\.css)"/)
  if (!cssMatch) throw new Error('Could not find CSS href in iframe.html')

  const cssPath = cssMatch[1].startsWith('/')
    ? cssMatch[1]
    : `/storybook/${cssMatch[1].replace(/^\.\//, '')}`
  const cssUrl = `https://frontend.dev.smarterdx.net${cssPath}`

  console.log(`Downloading CSS: ${cssUrl}`)
  const css = await fetchText(cssUrl)

  const tokensBlock = extractTokensLayer(css)

  const output = [
    `/* SmarterDX Design System Tokens`,
    ` * Auto-generated — do not edit by hand.`,
    ` * Synced from: ${cssUrl}`,
    ` * Last synced: ${new Date().toISOString()}`,
    ` * Run \`npm run sync-ds\` to update.`,
    ` */`,
    '',
    tokensBlock,
    '',
  ].join('\n')

  mkdirSync(join(ROOT, 'src'), { recursive: true })
  writeFileSync(OUT_PATH, output)
  console.log(`✓ Tokens written to src/design-system-tokens.css`)
}

main().catch(err => {
  console.warn(`⚠ Design token sync failed: ${err.message}`)
  console.warn('  Prototype will use existing tokens. Run npm run sync-ds to retry.')
  process.exit(0)
})
