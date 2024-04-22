import postcss from 'postcss'
import {test, expect} from 'vitest'
import dedent from 'dedent'
import presetEnv from 'postcss-preset-env'
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
    //
    themeColors({colors, ...options}),
    presetEnv(),
  ]).process(css, {
    from: undefined,
  })
}

test('use with color group', async () => {
  const input = dedent`a {
    color: oklch(from var(--G01) l c h / .1);
  }`
  const result = await process(input, {
    shouldInjectFlags: true,
  })
  expect(result.css).toMatchInlineSnapshot(`
    "html {
      --flag-light: initial;
      --flag-dark:  ;
    }
    html[data-theme="dark"] {
      --flag-light:  ;
      --flag-dark: initial;
    }
    a {
      --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
      color: var(--v1868641404);
    }
    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--G01) l c h / .1);
    }
    }"
  `)
})

test('use with color group and ', async () => {
  const input = dedent`a {
    color: oklch(from var(--G01) l c h / .1);
  }`
  const result = await process(input, {
    shouldInjectFlags: true,
    flagSelectors: [':where(:root)', ':where(:root.dark)'],
  })
  expect(result.css).toMatchInlineSnapshot(`
    ":where(:root) {
      --flag-light: initial;
      --flag-dark:  ;
    }
    :where(:root.dark) {
      --flag-light:  ;
      --flag-dark: initial;
    }
    a {
      --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
      color: var(--v1868641404);
    }
    @supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
    a {
      color: oklch(from var(--G01) l c h / .1);
    }
    }"
  `)
})

test('use without color group', async () => {
  const input = dedent`a {
    color: red;
  }`
  const result = await process(input, {
    shouldInjectFlags: true,
  })
  expect(result.css).toMatchInlineSnapshot(`
    "a {
      color: red;
    }"
  `)
})
