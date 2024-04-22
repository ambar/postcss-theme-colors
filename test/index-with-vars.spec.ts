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
        'test/fixtures/vars.css',
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
    color: oklch(from var(--G01) l c h / 1);
    border: 1px solid oklch(from var(--G01) .8 c h);
    box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px oklch(from var(--G01) l c h / .1);
  }`
  const result = await process(input)
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      color: rgb(255, 0, 0);
      --v3440539214: var(--flag-light, rgb(238, 238, 238)) var(--flag-dark, rgb(17, 17, 17));
      color: var(--v3440539214);
      border: 1px solid rgb(255, 157, 141);
      border: 1px solid color(display-p3 1 0.59851 0.52345);
      --v3579442204: var(--flag-light, 1px solid rgb(190, 190, 190)) var(--flag-dark, 1px solid rgb(190, 190, 190));
      border: var(--v3579442204);
      box-shadow: 0 0 0 2px #f00  , 0 0 0 4px rgba(255, 0, 0, 0.1);
      --v1397801114: var(--flag-light, 0 0 0 2px #eee, 0 0 0 4px rgba(238, 238, 238, 0.1)) var(--flag-dark, 0 0 0 2px #111, 0 0 0 4px rgba(17, 17, 17, 0.1));
      box-shadow: var(--v1397801114);
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--G01) l c h / 1);
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
  const result = await process(input)
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      color: rgba(255, 0, 0, 0.8);
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
      color: rgba(255, 0, 0, 0.1);
      --v3856771006: var(--flag-light, rgba(255, 0, 0, 0.1)) var(--flag-dark, rgba(0, 0, 255, 0.1));
      color: var(--v3856771006);
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

test('should not process non-group color', async () => {
  const input = dedent`a {
    color: oklch(from var(--C02a) l c h / 0.1);;
  }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      color: rgba(255, 0, 0, 0.1);;
    }

    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--C02a) l c h / 0.1);;
    }
    }"
  `)
})

test('with gamut', async () => {
  const input = dedent`a {
    background: oklch(from var(--G01) calc(l * .8) c h);
  }`
  expect((await process(input)).css).toMatchInlineSnapshot(`
    "a {
      background: rgb(196, 0, 0);
      background: color(display-p3 0.72286 0 0);
      --v3397449538: var(--flag-light, rgb(177, 177, 177)) var(--flag-dark, rgb(9, 9, 9));
      background: var(--v3397449538);
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
