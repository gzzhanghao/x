import os from 'os'
import cp from 'child_process'
import iconv from 'iconv-lite'
import waitFor from 'event-to-promise'
import { sep, normalize, resolve } from 'path'

let defaultEncoding = 'utf-8'
if (process.platform === 'win32') {
  defaultEncoding = 'gbk'
}

export const e = process.env

/**
 * Execute series of commands
 *
 * @param {string} cmds
 * @param {Object} opts
 *
 * @returns {Promise}
 */
export async function x(cmds, opts = {}) {
  if (Array.isArray(cmds)) {
    return Promise.all(cmds.map(cmd => exec(cmd, opts)))
  }

  for (const line of cmds.trim().split('\n')) {
    const cmd = line.trim()

    if (cmd.split(/\s/, 1)[0] !== 'cd') {
      const child = spawn(cmd, Object.assign({ stdio: 'inherit' }, opts))
      const [code, signal] = await waitForClose(child)

      if (code && !opts.ignoreCode) {
        throw { code, signal, cmd }
      }
      continue
    }

    process.stdout.write(`$ ${cmd}\n`)

    let target = cmd.slice(2).trim()

    if (target) {
      target = await g(`echo ${target}`, { silent: true })
    }

    if (target) {
      target = normalize(target.trim() + sep)
    }

    process.chdir(target || getUserHome())
  }
}

/**
 * Execute a command and get its output
 *
 * @param {string} cmd
 * @param {Object} opts
 *
 * @returns {Promise<CommandResult>}
 */
export async function r(cmd, opts = {}) {
  const encoding = opts.encoding || defaultEncoding
  const child = spawn(cmd, Object.assign({}, opts, { stdio: ['inherit', 'pipe', 'pipe'] }))

  const stdout = []
  const stderr = []

  child.stdout.on('data', chunk => stdout.push(chunk))
  child.stderr.on('data', chunk => stderr.push(chunk))

  if (!opts.silent && encoding !== 'buffer') {
    child.stdout.pipe(iconv.decodeStream(encoding)).pipe(process.stdout)
    child.stderr.pipe(iconv.decodeStream(encoding)).pipe(process.stderr)
  }

  const [code, signal] = await waitForClose(child)

  return new CommandResult(code, signal, stdout, stderr, encoding)
}

/**
 * Get stdout from a command
 *
 * @param {string} cmd
 * @param {Object} opts
 *
 * @returns {Promise<string|Buffer>}
 */
export function g(cmd, opts = {}) {
  return r(cmd, opts).then(res => {
    if (opts.encoding === 'buffer') {
      return res.stdout
    }
    return res.stdout.trim()
  })
}

/**
 * Create a child process with given options
 *
 * @private
 *
 * @param {string} cmd
 * @param {Object} opts
 *
 * @returns {ChildProcess}
 */
function spawn(cmd, opts) {
  if (!opts.silent) {
    process.stdout.write(`$ ${cmd}\n`)
  }
  return cp.spawn(cmd, [], Object.assign({}, opts, { shell: true }))
}

/**
 * Wait for a child process to exit
 *
 * @private
 *
 * @param {ChildProcess} child
 *
 * @returns {Promise<Array>}
 */
function waitForClose(child) {
  return waitFor(child, 'close', { array: true }).catch(errors => Promise.reject(errors[0]))
}

/**
 * Return the home directory in a platform-agnostic way, with consideration for older versions of node
 *
 * @private
 *
 * @from https://github.com/shelljs/shelljs/blob/master/src/common.js#L121
 *
 * @returns {string}
 */
function getUserHome() {
  if (os.homedir) {
    return os.homedir() // node 3+
  }
  if (process.platform === 'win32') {
    return process.env.USERPROFILE
  }
  return process.env.HOME
}

/**
 * Execution result
 *
 * @private
 */
class CommandResult {

  constructor(code, signal, stdout, stderr, encoding) {
    this.code = code
    this.signal = signal

    this.stdout = Buffer.concat(stdout)
    this.stderr = Buffer.concat(stderr)

    this.encoding = encoding

    if (encoding !== 'buffer') {
      this.stdout = iconv.decode(this.stdout, encoding)
      this.stderr = iconv.decode(this.stderr, encoding)
    }
  }

  toString() {
    return this.stdout
  }
}
