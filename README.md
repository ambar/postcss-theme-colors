# postcss-theme-colors

Theming with `cc()`.

## Installation

```console
npm install postcss-theme-colors
```

## Usage

Input:

```css
a {
  color: cc(G01);
  background-color: color(cc(G01) alpha(-8%));
}
```

Output:

```css
a {
  color: #eee;
  background-color: rgba(238, 238, 238, 0.92);

  html[data-theme='dark'] & {
    color: #111;
    background-color: rgba(17, 17, 17, 0.92);
  }
}
```

## Configuration

```js
const colors = {
  C01: '#eee',
  C02: '#111',
}

const groups = {
  G01: ['C01', 'C02'],
}

postcss([
  require('postcss-theme-colors')({colors, groups}),
  // require('postcss-custom-properties')({variables: colors}), // optional
  // require('postcss-color-function'), // optional
]).process(css)
```

### Plugin Options

* `options: Object`
  * `colors: Object`, color definitions.
  * `groups: Object`, group definitions.
  * `function: string`, function name, defaults to `cc`.
  * `useCustomProperties: boolean`, whether to transform `cc(group)` to `var(color)`, defaults to `false`.
