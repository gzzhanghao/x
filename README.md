# X

Execute commands in node.js

## Installation

```bash
npm i -S @gzzhanghao/x
```

## Usage

```javascript
import { x } from '@gzzhanghao/x'

export async function build(opts) {
  await x(`
    run-any-cmd --with-args ${x.e.SOME_ENV_VARIABLE}
    like makefile
  `)
}
```

### e

Identical to process.env.

### x(commands[, options])

Execute series of commands. Pass an array to run commands in parallel.

```javascript
await x(['rm -rf dist', 'mkdir tmp'])
```

### g(command[, options])

Get output from a command.

```javascript
await g('ls -alh') // -> { code, signal, stdout, stdin, encoding }
'' + await g('ls') // -> ls's stdout
```
