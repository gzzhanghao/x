const cp = require('child_process')
const path = require('path')
const chalk = require('chalk')

module.exports = function x(cmds) {
  let promise = Promise.resolve()

  for (const line of cmds.replace(/\\\n/g, '').trim().split('\n')) {
    const cmd = line.trim()

    promise = promise.then(() => new Promise((resolve, reject) => {
      process.stdout.write(`$ ${cmd}\n`)

      const child = cp.exec(cmd)

      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)

      child.once('close', (code, signal) => {
        if (!code) {
          return resolve()
        }
        reject(new Error(`${cmd} exit with code ${code}`))
      })
    }))
  }

  return promise
}

module.exports.e = process.env
