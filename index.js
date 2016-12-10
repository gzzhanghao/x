'use strict'

const cp = require('child_process')
const path = require('path')

module.exports = function x(cmds) {
  if (Array.isArray(cmds)) {
    return Promise.all(cmds.map(x))
  }

  let promise = Promise.resolve()

  for (const line of cmds.replace(/\\\n/g, '').trim().split('\n')) {
    promise = promise.then(() => runCmd(line.trim()))
  }

  return promise
}

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`$ ${cmd}\n`)

    const child = cp.exec(cmd)
    const onceError = () => child.kill()

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)

    process.stdin.pipe(child.stdin)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.once('error', onceError)

    child.once('close', (code, signal) => {
      process.stdin.unpipe(child.stdin)
      child.stdout.unpipe(process.stdout)
      child.stderr.unpipe(process.stderr)
      child.removeListener('error', onceError)

      const res = { code, signal, stdout, stderr }

      if (code) {
        return reject(res)
      }
      resolve(res)
    })
  })
}

module.exports.e = process.env
