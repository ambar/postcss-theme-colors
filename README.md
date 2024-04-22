# postcss-theme-colors

[![test workflow](https://github.com/ambar/postcss-theme-colors/actions/workflows/test.yml/badge.svg)](https://github.com/ambar/postcss-theme-colors/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/ambar/postcss-theme-colors/badge.svg?branch=main)](https://coveralls.io/github/ambar/postcss-theme-colors?branch=main)

Expand theme color groups to allow non-static handling of relative color syntax or `color-mix()` function.

## Installation

```bash
npm install postcss-theme-colors postcss-preset-env
```

## Usage

Input:

```css
a {
  /* any value with theme (light/dark) color */
  color: oklch(from var(--G01) l c h / 0.1);
  /* more:
  border: 1px solid oklch(from var(--G01) .8 c h);
  box-shadow: 0 0 0 2px var(--G01), 0 0 0 4px oklch(from var(--G01) l c h / .1);
  --anyVar: value-with-theme-color;
  */
}
```

Output:

```css
a {
  --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
  color: rgba(238, 238, 238, 0.1); /* fallback */
  color: var(--v1868641404); /* expand for color scheme */
}

@supports (color: lab(from red l 1 1% / calc(alpha + 0.1))) {
  a {
    color: oklch(from var(--G01) l c h / 0.1); /* W3C */
  }
}
```

## Configuration

```js
const colors = {
  '--G01': ['#eee', '#111'],
}

postcss([
  require('postcss-theme-colors')({colors}),
  require('postcss-preset-env'),
  require('@csstools/postcss-global-data')({
    files: [
      // example flags
      require.resolve('postcss-theme-colors/flag.css'),
      // your global theme colors
      'vars.css',
    ],
  }),
]).process(css)
```

### Plugin Options

```ts
type Options = {
  /** color groups */
  colors: Record<string, string | string[]>
  /**
   * boolean flags
   * @default ['--flag-light', '--flag-dark']
   */
  flags?: string[]
  /**
   * Whether to inject boolean flags, could also be defined in global CSS files
   * @default false
   */
  shouldInjectFlags?: boolean
}
```
