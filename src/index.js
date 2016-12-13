'use strict'

const cp = require('child_process')
const iconv = require('iconv-lite')

let defaultEncoding = 'utf-8'
if (process.platform === 'win32') {
  defaultEncoding = 'gbk'
}

module.exports = exec

/**
 * Execute commands
 *
 * @param {string|Array<string>} cmds
 * @param {Object} options
 * @return {Object} Result of the commands
 */
function exec(cmds, options) {
  if (Array.isArray(cmds)) {
    return Promise.all(cmds.map(exec))
  }

  let promise = Promise.resolve()

  for (const line of cmds.replace(/\\\n/g, '').trim().split('\n')) {
    promise = promise.then(() => new Promise((resolve, reject) => {
      const cmd = line.trim()
      const child = exec.spawn(cmd, Object.assign({ stdio: 'inherit' }, options))

      child.once('error', () => child.kill())

      child.once('close', (code, signal) => {
        const res = { cmd, code, signal }

        if (code) {
          reject(res)
        } else {
          resolve(res)
        }
      })
    }))
  }

  return promise
}

exec.e = process.env

/**
 * Execute a command and get it's stdio content
 *
 * @param {string} cmd
 * @param {string} encoding
 * @param {Object} options
 * @return {Object} Result of the command
 */
exec.get = function get(cmd, encoding, options) {
  const child = exec.spawn(cmd, Object.assign({ stdio: ['inherit', 'pipe', 'pipe'] }, options))
  exec.inspect(child, encoding)
  return exec.wait(child, encoding)
}

/**
 * Create a child process to execute the command
 *
 * @param {string} cmd
 * @param {Object} options
 * @return {ChildProcess}
 */
exec.spawn = function spawn(cmd, options) {
  process.stdout.write(`$ ${cmd}\n`)
  console.log(cmd, [], Object.assign({ shell: true, encoding: 'buffer', }, options))
  return cp.spawn(cmd, [], Object.assign({ shell: true, }, options))
}

/**
 * Wait for a child process to close and get its stdio content
 *
 * @param {ChildProcess} child
 * @param {string} encoding
 * @return {Object} Result from the child process
 */
exec.wait = function wait(child, encoding) {
  return new Promise((resolve, reject) => {
    const stdout = []
    const stderr = []

    child.once('error', () => child.kill())

    child.stdout.on('data', chunk => stdout.push(chunk))
    child.stderr.on('data', chunk => stderr.push(chunk))

    child.once('close', (code, signal) => {
      const res = { code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }

      if (encoding !== 'buffer') {
        res.stdout = iconv.decode(res.stdout, encoding)
        res.stderr = iconv.decode(res.stderr, encoding)
      }

      if (code) {
        reject(res)
      } else {
        resolve(res)
      }
    })
  })
}

/**
 * Pipe stdio from child process to process.stdio
 *
 * @param {ChildProcess} child
 * @param {string} encoding
 * @return {ChildProcess} child itself
 */
exec.inspect = function inspect(child, encoding = defaultEncoding) {
  if (encoding !== 'buffer') {
    child.stdout.pipe(iconv.decodeStream(encoding)).pipe(process.stdout)
    child.stderr.pipe(iconv.decodeStream(encoding)).pipe(process.stderr)
  }
  return child
}
