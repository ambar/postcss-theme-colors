import postcss from 'postcss'
import type {Plugin} from 'postcss'
import {test, expect} from 'vitest'
import dedent from 'dedent'
import presetEnv from 'postcss-preset-env'
import globalData from '@csstools/postcss-global-data'
import themeColors from '../src'

const colors = {
  '--G01': ['#eee', '#111'],
  '--C02a': '#f00',
  '--C02b': '#0f0',
  '--G02': ['--C02a', '--C02b'],
}

type ExtraOpts = {
  plugins?: (Plugin | any)[]
}

const process = async (
  css: string,
  options?: Omit<Parameters<typeof themeColors>[0], 'colors'> | null,
  {plugins = []}: ExtraOpts = {}
) => {
  return postcss([
    globalData({
      files: [
        //
        'flags.css',
      ],
    }),
    themeColors({colors, ...options}),
    presetEnv(),
    ...plugins,
  ]).process(css, {
    from: undefined,
  })
}

test('use with relative color syntax', async () => {
  const input = `
    a {
      color: oklch(from var(--G01) l c h / .8);
      border: oklch(from var(--G01) .8 c h);
      background: oklch(from var(--G01) calc(l * .8) c h);
    }
    `
  const result = await process(input, null, {})
  expect(result.css).toMatchInlineSnapshot(`
    "
        a {
          --v1868641635: var(--flag-light, rgba(238, 238, 238, 0.8)) var(--flag-dark, rgba(17, 17, 17, 0.8));
          color: rgba(238, 238, 238, 0.8)  ;
          color: var(--v1868641635);
          --v1293428520: var(--flag-light, rgb(190, 190, 190)) var(--flag-dark, rgb(190, 190, 190));
          border: var(--v1293428520);
          --v3397449538: var(--flag-light, rgb(177, 177, 177)) var(--flag-dark, rgb(9, 9, 9));
          background: var(--v3397449538);
        }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
          color: oklch(from var(--G01) l c h / .8);
          border: oklch(from var(--G01) .8 c h);
          background: oklch(from var(--G01) calc(l * .8) c h);
        }
    }
        "
  `)
})

test('use with color-mix()', async () => {
  const input = `
    a {
      color: color-mix(in srgb, var(--G01), transparent 20%);
    }
    `
  const result = await process(input, null, {})
  expect(result.css).toMatchInlineSnapshot(`
    "
        a {
          --v546761730: var(--flag-light, rgba(238, 238, 238, 0.8)) var(--flag-dark, rgba(17, 17, 17, 0.8));
          color: rgba(238, 238, 238, 0.8)  ;
          color: var(--v546761730);
        }

    @supports (color: color-mix(in lch, red, blue)) {
    a {
          color: color-mix(in srgb, var(--G01), transparent 20%);
        }
    }
        "
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

test('process multiple value', async () => {
  const input = dedent`a {
      box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px var(--G02)
    }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px var(--G02)
    }"
  `)
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
