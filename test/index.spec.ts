import postcss from 'postcss'
import {test, expect} from 'vitest'
import dedent from 'dedent'
import presetEnv from 'postcss-preset-env'
import globalData from '@csstools/postcss-global-data'
import themeColors, {type Options} from '../src'

const colors = {
  '--G01': ['#eee', '#111'],
  '--C02a': '#f00',
  '--C02b': '#0f0',
  '--G02': ['--C02a', '--C02b'],
  '--G03': ['red', 'blue'],
}

const process = async (css: string, options?: Omit<Options, 'colors'> | null) => {
  return postcss([
    globalData({
      files: [
        //
        'flags.css',
      ],
    }),
    themeColors({colors, ...options}),
    presetEnv(),
  ]).process(css, {
    from: undefined,
  })
}

test('use with relative color syntax', async () => {
  const input = dedent`a {
    color: oklch(from var(--G01) l c h / .1);
    border: 1px solid oklch(from var(--G01) .8 c h);
    box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px oklch(from var(--G01) l c h / .1);
  }`
  const result = await process(input)
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
      color: var(--v1868641404);
      --v3579442204: var(--flag-light, 1px solid rgb(190, 190, 190)) var(--flag-dark, 1px solid rgb(190, 190, 190));
      border: var(--v3579442204);
      --v1397801114: var(--flag-light, 0 0 0 2px #eee, 0 0 0 4px rgba(238, 238, 238, 0.1)) var(--flag-dark, 0 0 0 2px #111, 0 0 0 4px rgba(17, 17, 17, 0.1));
      box-shadow: var(--v1397801114);
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--G01) l c h / .1);
      border: 1px solid oklch(from var(--G01) .8 c h);
      box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px oklch(from var(--G01) l c h / .1);
    }
    }"
  `)
})

test('use with color-mix()', async () => {
  const input = dedent`
    a {
      color: color-mix(in srgb, var(--G01), transparent 20%);
    }
    `
  const result = await process(input)
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      --v546761730: var(--flag-light, rgba(238, 238, 238, 0.8)) var(--flag-dark, rgba(17, 17, 17, 0.8));
      color: var(--v546761730);
    }

    @supports (color: color-mix(in lch, red, blue)) {
    a {
      color: color-mix(in srgb, var(--G01), transparent 20%);
    }
    }"
  `)
})

test('process single value', async () => {
  const input = dedent`a {
      color: var(--G01);
    }`
  expect((await process(input)).css).toBe(input)
})

test('should not process invalid function name', async () => {
  const input = dedent`a {
      color: nonvar(--G01);
    }`
  expect((await process(input)).css).toBe(input)
})

test('process nested rules', async () => {
  const input = dedent`a {
      span {
        color: var(--G01);
      }
    }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "
      a span {
        color: var(--G01);
      }"
  `)
})

test('process undefined group', async () => {
  const input = dedent`a {
      color: var(--GXX);
    }`
  const result = await process(input)
  expect(result.css).toBe(input)
})

test('define prop', async () => {
  const input = dedent`
    a {
      --color: oklch(from var(--G03) l c h);
    }
    `
  const result = await process(input)
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      --v2703874416: var(--flag-light, rgb(255, 0, 0)) var(--flag-dark, rgb(0, 0, 255));
      --color: var(--v2703874416);
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      --color: oklch(from var(--G03) l c h);
    }
    }"
  `)
})

test('flags option', async () => {
  const input = dedent`
    a {
      color: rgba(from var(--G03) r g b / .1);
    }
    `
  const result = await process(input, {
    flags: ['--isLight', '--isDark'],
  })
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      --v3204038125: var(--isLight, rgba(255, 0, 0, 0.1)) var(--isDark, rgba(0, 0, 255, 0.1));
      color: var(--v3204038125);
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: rgba(from var(--G03) r g b / .1);
    }
    }"
  `)
})
