import {PluginCreator} from 'postcss'

export type Options = {
  /** color groups */
  colors: Record<string, string | string[]>
  /**
   * var flags
   * @default ['--flag-light', '--flag-dark']
   */
  flags?: string[]
}
const defaults: Required<Options> = {
  colors: {},
  flags: ['--flag-light', '--flag-dark'],
}
const reRelativeColor = /\(\s*?from/i
const reMixColor = /\bcolor-mix\(/i

const themeColors: PluginCreator<Options> = (options) => {
  const {
    colors,
    flags: [lightFlag, darkFlag],
  } = {...defaults, ...options}
  const reGroup = new RegExp(`\\b${'var'}\\((${Object.keys(colors).join('|')})\\)`, 'g')
  const resolveColor = (theme: 'dark' | 'light', group: string, fallback: string) => {
    const [lightKey, darkKey] = colors[group] || []
    const colorKey = theme === 'light' ? lightKey : darkKey
    if (!colorKey) {
      return fallback
    }
    return colorKey in colors ? (colors[colorKey] as string) : colorKey
  }
  return {
    postcssPlugin: 'postcss-theme-colors',
    Declaration(decl) {
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
    },
  }
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
