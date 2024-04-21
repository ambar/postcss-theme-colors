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
  color: oklch(from var(--G01) l c h / 0.1);
}
```

Output:

```css
a {
  --v1868641404: var(--flag-light, rgba(238, 238, 238, 0.1)) var(--flag-dark, rgba(17, 17, 17, 0.1));
  color: rgba(238, 238, 238, 0.1); /* fallback */
  color: var(--v1868641404); /* expand for color scheme */
  color: oklch(from #f00 l c h / 0.1);
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
      //
      'flag.css',
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
   * var flags
   * @default ['--flag-light', '--flag-dark']
   */
  flags?: string[]
}
```
