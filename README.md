# X

Execute commands in node.js

## Installation

```bash
npm i -S @gzzhanghao/x
```

## Usage

```javascript
import x from '@gzzhanghao/x'

export async function build(opts) {
  await x(`
    run-any-cmd --with-args ${x.e.SOME_ENV_VARIABLE}
    like makefile
  `)
}
```
