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

### x(commands)

Run a series of commands. Pass an array to run commands in parallel.

```javascript
x(['rm -rf dist', 'mkdir tmp'])
```

### x.get(command[, encoding])

Run a command and get its stdio output.

```javascript
x.get('ls -alh') // -> { code, signal, stdout, stdin }
```

### x.spawn(command[, options])

Spawn a child process with given options, check out node.js's [child_process.spawn](https://nodejs.org/dist/latest-v7.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options) for more details.

This method sets the options to `{ shell: true, encoding: 'buffer' }` by default.

### x.wait(child[, encoding])

Wait for a child process ends and get its stdio output.

### x.inspect(child[, encoding])

Pipe stdio from child process to process.stdio.

```javascript
x.wait(x.inspect(x.spawn('ls -alh'))) // -> identical to x.get('ls -alh')
```
