'use strict'

const cp = require('child_process')

exports = module.exports = function x(cmds) {
  if (Array.isArray(cmds)) {
    return Promise.all(cmds.map(x))
  }

  let promise = Promise.resolve()

  for (const line of cmds.replace(/\\\n/g, '').trim().split('\n')) {
    promise = promise.then(() => runCmd(line.trim()))
  }

  return promise
}

exports.e = process.env

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`$ ${cmd}\n`)

    const child = cp.spawn(cmd, [], { shell: true, stdio: 'inherit' })
    const onceError = () => child.kill()

    child.once('error', onceError)

    child.once('close', (code, signal) => {
      child.removeListener('error', onceError)

      const res = { cmd, code, signal }

      if (code) {
        reject(res)
      } else {
        resolve(res)
      }
    })
  })
}
