import { describe, it, expect } from 'vitest'
import en from '@locales/en.json'
import zh from '@locales/zh.json'
import ja from '@locales/ja.json'

type Tree = Record<string, unknown>

function flatten(obj: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Tree, path)) out.set(k, v)
    } else if (typeof value === 'string') {
      out.set(path, value)
    }
  }
  return out
}

/**
 * en.json is the single source of truth for content. zh.json and ja.json must
 * translate every en key (with `_label` exempt — it's the language's own display name).
 * The renderer falls back to en for any gap, but a missing key here means
 * untranslated UI, so the gap is a hard failure, not a warning.
 */
describe('locale coverage', () => {
  const enKeys = flatten(en as Tree)
  const zhKeys = flatten(zh as Tree)
  const jaKeys = flatten(ja as Tree)

  const placeholders = (s: string): string[] => (s.match(/\{(\w+)\}/g) ?? []).sort()

  describe('zh', () => {
    it('zh translates every en key', () => {
      const missing = [...enKeys.keys()].filter((k) => k !== '_label' && !zhKeys.has(k))
      expect(missing, `zh.json is missing ${missing.length} keys:\n${missing.join('\n')}`).toEqual(
        []
      )
    })

    it('zh has no keys absent from en (no orphans)', () => {
      const orphans = [...zhKeys.keys()].filter((k) => k !== '_label' && !enKeys.has(k))
      expect(orphans, `zh.json has orphan keys not in en:\n${orphans.join('\n')}`).toEqual([])
    })

    it('zh preserves every {placeholder} from the en string', () => {
      const mismatches: string[] = []
      for (const [key, enVal] of enKeys) {
        const zhVal = zhKeys.get(key)
        if (zhVal === undefined) continue
        const a = placeholders(enVal).join(',')
        const b = placeholders(zhVal).join(',')
        if (a !== b) mismatches.push(`${key}: en[${a}] vs zh[${b}]`)
      }
      expect(mismatches, `placeholder mismatch:\n${mismatches.join('\n')}`).toEqual([])
    })
  })

  describe('ja', () => {
    it('ja translates every en key', () => {
      const missing = [...enKeys.keys()].filter((k) => k !== '_label' && !jaKeys.has(k))
      expect(missing, `ja.json is missing ${missing.length} keys:\n${missing.join('\n')}`).toEqual(
        []
      )
    })

    it('ja has no keys absent from en (no orphans)', () => {
      const orphans = [...jaKeys.keys()].filter((k) => k !== '_label' && !enKeys.has(k))
      expect(orphans, `ja.json has orphan keys not in en:\n${orphans.join('\n')}`).toEqual([])
    })

    it('ja preserves every {placeholder} from the en string', () => {
      const mismatches: string[] = []
      for (const [key, enVal] of enKeys) {
        const jaVal = jaKeys.get(key)
        if (jaVal === undefined) continue
        const a = placeholders(enVal).join(',')
        const b = placeholders(jaVal).join(',')
        if (a !== b) mismatches.push(`${key}: en[${a}] vs ja[${b}]`)
      }
      expect(mismatches, `placeholder mismatch:\n${mismatches.join('\n')}`).toEqual([])
    })
  })
})
