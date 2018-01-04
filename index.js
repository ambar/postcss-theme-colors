const postcss = require('postcss')

const defaults = {
  function: 'cc',
  groups: {},
  colors: {},
  useCustomProperties: false,
}

const resolveColor = (options, theme, group, defaultValue) => {
  const [lightColor, darkColor] = options.groups[group] || []
  const color = theme === 'dark' ? darkColor : lightColor
  if (!color) {
    return defaultValue
  }

  if (options.useCustomProperties) {
    return color.startsWith('--') ? `var(${color})` : `var(--${color})`
  }

  return options.colors[color] || defaultValue
}

module.exports = postcss.plugin('postcss-theme-colors', options => {
  options = Object.assign({}, defaults, options)
  const reGroup = new RegExp(`\\b${options.function}\\(([^)]+)\\)`, 'g')

  return (style, result) => {
    style.walkDecls(decl => {
      const value = decl.value
      if (!value || !reGroup.test(value)) {
        return
      }

      const lightValue = value.replace(reGroup, (match, group) => {
        return resolveColor(options, 'light', group, match)
      })

      if (lightValue === value) {
        decl.warn(result, `Group not found: \`${value}\``)
        return
      }

      const darkValue = value.replace(reGroup, (match, group) => {
        return resolveColor(options, 'dark', group, match)
      })
      const darkDecl = decl.clone({value: darkValue})
      const darkRule = postcss.rule({
        // TODO: support postcss-nesting?
        selector: `html[data-theme="dark"] &`,
      })
      darkRule.append(darkDecl)
      decl.parent.append(darkRule)

      const lightDecl = decl.clone({value: lightValue})
      decl.replaceWith(lightDecl)
    })
  }
})
