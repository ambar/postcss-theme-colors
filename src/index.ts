import {PluginCreator, Rule, Root, Helpers} from 'postcss'

export type Options = {
  /** color groups */
  colors: Record<string, string | string[]>
  /**
   * boolean flags
   * @default ['--flag-light', '--flag-dark']
   */
  flags?: [string, string]
  /**
   * Whether to inject boolean flags, could also be defined in global CSS files
   * @default false
   */
  shouldInjectFlags?: boolean
  flagSelectors?: [string, string]
}
const defaults: Required<Options> = {
  colors: {},
  flags: ['--flag-light', '--flag-dark'],
  shouldInjectFlags: false,
  flagSelectors: ['html', 'html[data-theme="dark"]'],
}
const reRelativeColor = /\(\s*?from/i
const reMixColor = /\bcolor-mix\(/i

const themeColors: PluginCreator<Options> = (options) => {
  const opts = {...defaults, ...options}
  const {
    colors,
    shouldInjectFlags,
    flags: [lightFlag, darkFlag],
  } = opts
  const groups = Object.entries(colors)
    .filter(([, v]) => Array.isArray(v))
    .map(([k]) => k)
  const reGroup = new RegExp(`\\b${'var'}\\((${groups.join('|')})\\)`, 'g')
  const resolveColor = (theme: 'dark' | 'light', group: string, fallback: string) => {
    const [lightKey, darkKey] = colors[group] || []
    const colorKey = theme === 'light' ? lightKey : darkKey
    if (!colorKey) {
      return fallback
    }
    return colorKey in colors ? (colors[colorKey] as string) : colorKey
  }
  let processed = false
  let injected: Rule[] = []
  return {
    postcssPlugin: 'postcss-theme-colors',
    DeclarationExit(decl) {
      const value = decl.value
      if (!reRelativeColor.test(value) && !reMixColor.test(value)) {
        return
      }
      if (!reGroup.test(value)) {
        return
      }
      const lightValue = value.replace(reGroup, (match, group) => resolveColor('light', group, match))
      const darkValue = value.replace(reGroup, (match, group) => resolveColor('dark', group, match))
      const name = '--v' + hash(value)
      decl.cloneBefore({prop: name, value: `var(${lightFlag}, ${lightValue}) var(${darkFlag}, ${darkValue})`})
      decl.cloneBefore({prop: decl.prop, value: `var(${name})`})
      processed = true
    },
    Once(doc, helper) {
      if (shouldInjectFlags) {
        injected = injectFlags(doc, helper, opts)
      }
    },
    OnceExit() {
      if (shouldInjectFlags) {
        if (!processed) {
          injected.forEach((r) => r.remove())
        }
        injected = []
        processed = false
      }
    },
  }
}

function injectFlags(root: Root, helper: Helpers, {flags, flagSelectors}: Required<Options>) {
  const r2 = helper.rule({selector: flagSelectors[1]})
  r2.append(helper.decl({prop: flags[0], value: ' '}), helper.decl({prop: flags[1], value: 'initial'}))
  root.prepend(r2)
  const r1 = helper.rule({selector: flagSelectors[0]})
  r1.append(helper.decl({prop: flags[0], value: 'initial'}), helper.decl({prop: flags[1], value: ' '}))
  root.prepend(r1)
  return [r1, r2]
}

// djb2 hash function: http://www.cse.yorku.ca/~oz/hash.html
function hash(v: string) {
  let hash = 5381
  for (let i = 0; i < v.length; i++) {
    hash = ((hash << 5) + hash + v.charCodeAt(i)) >>> 0
  }
  return hash
}

themeColors.postcss = true

export default themeColors
