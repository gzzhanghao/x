const cp = require('child_process')
const path = require('path')
const promisify = require('es6-promisify')

const exec = promisify(cp.exec, { multiArgs: true })

module.exports = function x(cmds) {
  let promise = Promise.resolve()

  for (const cmd of cmds.trim().split('\n')) {
    promise.then(() => exec(cmd.trim()))
  }

  return promise
}

module.exports.e = process.env
