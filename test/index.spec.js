const postcss = require('postcss')
const themeColors = require('..')

const colors = {
  C01: '#eee',
  C02: '#111',
  C03: '#f00',
  C04: '#0f0',
}

const groups = {
  G01: ['C01', 'C02'],
  G02: ['C03', 'C04'],
}

const process = (
  css,
  options,
  customProperties = {},
  nestPlugin = 'postcss-nested'
) => {
  return postcss([
    themeColors(Object.assign({colors, groups}, options)),
    require('postcss-custom-properties')({
      preserve: false,
      importFrom: {customProperties},
    }),
    require('postcss-color-function'),
    require(nestPlugin),
  ]).process(css)
}

describe('postcss-theme-colors', () => {
  it('process single value', async () => {
    const input = `a {
      color: cc(G01);
    }`
    expect((await process(input)).css).toMatchSnapshot()
  })

  it('should not process invalid function name', async () => {
    const input = `a {
      color: dcc(G01);
    }`
    expect((await process(input)).css).toBe(input)
  })

  it('process multiple value', async () => {
    const input = `a {
      box-shadow: 0 0 0 2px cc(G01), 0 0 0 4px cc(G02)
    }`
    expect((await process(input)).css).toMatchSnapshot()
  })

  it('process color function', async () => {
    const input = `a {
      background-color: color(cc(G01) alpha(-8%));
    }`
    expect((await process(input)).css).toMatchSnapshot()
  })

  it('process nested rules', async () => {
    const input = `a {
      span {
        color: cc(G01);
      }
    }`
    expect((await process(input)).css).toMatchSnapshot()
  })

  it('process undefined group', async () => {
    const input = `a {
      color: cc(GXX);
    }`
    const result = await process(input)
    expect(result.css).toBe(input)
    expect(result.messages).toMatchObject([{type: 'warning'}])
  })

  it('process with custom function name', async () => {
    const input = `a {
      border: 1px solid _(G01);
    }`
    expect((await process(input, {function: '_'})).css).toMatchSnapshot()
  })

  it('process with custom properties', async () => {
    expect(
      (await process(`a { color: cc(G01) }`, {useCustomProperties: true})).css
    ).toMatchSnapshot('without `--` prefix')

    expect(
      (await process(`a { color: cc(G01A) }`, {
        groups: {G01A: ['--C01A', '--C01B']},
        useCustomProperties: true,
      })).css
    ).toMatchSnapshot('with `--` prefix')

    expect(
      (await process(
        `a { color: cc(G01A) }`,
        {
          groups: {G01A: ['--C01A', '--C01B']},
          useCustomProperties: true,
        },
        {
          '--C01A': '#eee',
          '--C01B': '#111',
        }
      )).css
    ).toMatchSnapshot('apply `var()` plugin')
  })

  it('process with custom root class of dark theme', async () => {
    expect(
      (await process(
        `a { color: cc(G01) }`,
        {darkThemeSelector: '.theme-dark'},
        null,
        'postcss-nesting'
      )).css
    ).toMatchSnapshot()
  })

  it('expand postcss-nesting rules', async () => {
    expect(
      (await process(`a { color: cc(G01) }`, {}, null, 'postcss-nesting')).css
    ).toMatchSnapshot()
  })

  it('process without nest plugin', async () => {
    const noNestPluginProcess = css =>
      postcss([themeColors({colors, groups})]).process(css)
    const result = await noNestPluginProcess(`a { color: cc(G01) }`)
    expect(result.css).toBe('a { color: #eee }')
    expect(result.messages).toMatchObject([{type: 'warning'}])
  })

  it('use `nestingPlugin` option', async () => {
    const process = (css, nestingPlugin) =>
      postcss([themeColors({colors, groups, nestingPlugin})]).process(css)
    const cases = [
      [
        'nested',
        `a { color: cc(G01) }`,
        'a { color: #eee; html[data-theme="dark"] & { color: #111 } }',
      ],
      [
        'nesting',
        `a { color: cc(G01) }`,
        'a { color: #eee; @nest html[data-theme="dark"] & { color: #111 } }',
      ],
      [null, `a { color: cc(G01) }`, 'a { color: #eee }'],
    ]
    for (const [nestingPlugin, input, output] of cases) {
      const result = await process(input, nestingPlugin)
      expect(result.css).toBe(output)
    }
  })
})
