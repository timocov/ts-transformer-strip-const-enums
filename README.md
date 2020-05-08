# ts-transformer-strip-const-enums

[![GH Actions][ci-img]][ci-link]
[![npm version][npm-version-img]][npm-link]
[![Downloads][npm-downloads-img]][npm-link]

A TypeScript custom transformer which strips `const enum`'s code if `preserveConstEnum` is enabled and if a enum isn't exported from source file or entry points.

## Why and where do you need it

1. If you have enabled `preserveConstEnum` compiler option and want to strip non-exported from its source file `const enum`s.

1. Let's say you develop a library written in TypeScript and you use `const enum`s.
    Some of that `const enum`s might be exported from the public API.

    Some of your users might "compile" their code with `transpileModule`
    (e.g. by `babel-loader`, `ts-loader` with `transpileOnly` enabled or directly by calling `transpileModule` from `typescript`).
    To be sure that their code will be transpiled in this mode correctly, they very probably enable `isolatedModules` compiler option.

    If so, that automatically means that they just can't use `const enum`s, exported from your library,
    because they will get an error `TS2748: Cannot access ambient const enums when the '--isolatedModules' flag is provided`.

    That error means, that after transpiling the code will not contain a code for enums in JS output, so you'll get `ReferenceError` in run-time.

    So, you have several options there:

    - Don't use enums (all of them) at all 🙂
    - Replace all `const enum`s with just `enum`s. This means that you'll lose all advantages of `const enum`s like inlining a values.
    - Enable `preserveConstEnum` compiler option to generate JS code for `const enum`s even if they will be inlined.
        But in this case you'll still have a `const enum`s in your `d.ts` files.
        See <https://github.com/microsoft/TypeScript/issues/37774>.
        For instance, in `dts-bundle-generator` you can enable `respect-preserve-const-enum` option and the tool will strip `const` from `const enum`s in this case.

    If you choose 3, you'll get all advantages internally (inlining `const enum`s) and don't break external code who uses transpilation over compilation.

    But here is another issue, this transformer is aim to fix - the TypeScript will generate `enum` code even if it's not exported.
    Moreover, no one minifier (I tested with Google Closure Compiler with advanced optimizations, terser, uglify-es, uglify-js) doesn't remove them, because the function has side-effects:

    ```typescript
    const enum Enum {
        First,
    }
    ```

    goes to:

    ```javascript
    var Enum;
    (function (Enum) {
        Enum[Enum["First"] = 0] = "First";
    })(Enum || (Enum = {}));
    ```

    This is why this transformer is here - it removes `const enum`'s code, if they aren't exported from entry points and `preserveConstEnum` is enabled.

    With this transformer you'll get just `;` instead of the code above:

    ```javascript
    ;
    ```

## How it works

If `preserveConstEnum` is enabled and the source code contains `const enum`,
the transformer checks whether it's exported or not from either its source file or if entry points aren't empty from entry points.
If it's - then do nothing (as well as when `preserveConstEnum` is enabled), otherwise - replace it with `;`.

All your code will contain inlined values so you don't need to worry about having that "object" in JS.

## Installation

1. Install the package `npm i -D ts-transformer-strip-const-enums`
1. Add transformer with [one of possible ways](#how-to-use-the-custom-transformer)

## Options

### entrySourceFiles

*Default: `[]`*

An array of entry source files which will used to detect "global" exports.
If you leave it empty, then the tool will check only `const enum`'s source file.

Basically it should be entry point(s) of the library/project or an empty array, if you want to strip non-exported from source code `const enum`s.

## How to use the custom transformer

Unfortunately, TypeScript itself does not currently provide any easy way to use custom transformers (see <https://github.com/Microsoft/TypeScript/issues/14419>).
The followings are the example usage of the custom transformer.

### webpack (with ts-loader or awesome-typescript-loader)

```js
// webpack.config.js
const stripConstEnumsTransformer = require('ts-transformer-strip-const-enums').default;

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader', // or 'awesome-typescript-loader'
        options: {
          getCustomTransformers: program => ({
              before: [
                  stripConstEnumsTransformer(program, { entrySourceFiles: ['./src/index.ts'] })
              ]
          })
        }
      }
    ]
  }
};
```

### Rollup (with rollup-plugin-typescript2)

```js
// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import stripConstEnumsTransformer from 'ts-transformer-strip-const-enums';

export default {
  // ...
  plugins: [
    typescript({ transformers: [service => ({
      before: [ stripConstEnumsTransformer(service.getProgram(), { entrySourceFiles: ['./src/index.ts'] }) ],
      after: []
    })] })
  ]
};
```

### ttypescript

See [ttypescript's README](https://github.com/cevek/ttypescript/blob/master/README.md) for how to use this with module bundlers such as webpack or Rollup.

*tsconfig.json*:

```json
{
  "compilerOptions": {
    // ...
    "plugins": [
      { "transform": "ts-transformer-strip-const-enums", "entrySourceFiles": ["./src/index.ts"] }
    ]
  },
  // ...
}
```

[ci-img]: https://github.com/timocov/ts-transformer-strip-const-enums/workflows/CI%20Test/badge.svg?branch=master
[ci-link]: https://github.com/timocov/ts-transformer-strip-const-enums/actions?query=branch%3Amaster

[npm-version-img]: https://badge.fury.io/js/ts-transformer-strip-const-enums.svg
[npm-downloads-img]: https://img.shields.io/npm/dm/ts-transformer-strip-const-enums.svg
[npm-link]: https://www.npmjs.com/package/ts-transformer-strip-const-enums
