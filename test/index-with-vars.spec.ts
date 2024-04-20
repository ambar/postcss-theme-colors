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
  '--G03': ['red', 'blue'],
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
        'test/fixtures/vars.css',
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
  const input = `a {
    color: oklch(from var(--G01) l c h / .1);
    border: 1px solid oklch(from var(--G01) .8 c h);
    box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px oklch(from var(--G01) l c h / .1);
  }`
  const result = await process(input, null, {})
  expect(result.css).toMatchInlineSnapshot(`
    "a {
        --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
        color: rgba(238, 238, 238, 0.1)  ;
        color: var(--v1868641404);
        color: oklch(from #f00   l c h / .1);
        --v3579442204: var(--flag-light, 1px solid rgb(190, 190, 190)) var(--flag-dark, 1px solid rgb(190, 190, 190));
        border: var(--v3579442204);
        --v1397801114: var(--flag-light, 0 0 0 2px #eee, 0 0 0 4px rgba(238, 238, 238, 0.1)) var(--flag-dark, 0 0 0 2px #111, 0 0 0 4px rgba(17, 17, 17, 0.1));
        box-shadow: var(--v1397801114);
        box-shadow: 0 0 0 2px #f00  , 0 0 0 4px oklch(from #f00   l c h / .1);
      }

    @media (color-gamut: rec2020) {
    a {
        border: 1px solid oklch(from #f00   .8 c h);
      }
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
    }`
  const result = await process(input, null, {})
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      --v546761730: var(--flag-light, rgba(238, 238, 238, 0.8)) var(--flag-dark, rgba(17, 17, 17, 0.8));
      color: rgba(238, 238, 238, 0.8)  ;
      color: var(--v546761730);
      color: color-mix(in srgb, #f00  , transparent 20%);
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
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      color: #f00  ;
      color: var(--G01);
    }"
  `)
})

test('process G03', async () => {
  const input = dedent`a {
    color: oklch(from var(--G03) l c h / .1);
  }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      --v3856771006: var(--flag-light, rgba(255, 0, 0, 0.1)) var(--flag-dark, rgba(0, 0, 255, 0.1));
      color: rgba(255, 0, 0, 0.1)  ;
      color: var(--v3856771006);
      color: oklch(from red l c h / .1);
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--G03) l c h / .1);
    }
    }"
  `)
})

test('should not process invalid function name', async () => {
  const input = dedent`a {
    color: nonvar(--G01);
  }`
  expect((await process(input)).css).toBe(input)
})

test('with gamut', async () => {
  const input = dedent`a {
    background: oklch(from var(--G01) calc(l * .8) c h);
  }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      --v3397449538: var(--flag-light, rgb(177, 177, 177)) var(--flag-dark, rgb(9, 9, 9));
      background: rgb(177, 177, 177)  ;
      background: var(--v3397449538);
    }

    @media (color-gamut: rec2020) {
    a {
      background: oklch(from #f00   calc(l * .8) c h);
    }
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      background: oklch(from var(--G01) calc(l * .8) c h);
    }
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
        color: #f00  ;
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
