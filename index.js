const cp = require('child_process')
const path = require('path')

module.exports = function x(cmds) {
  let promise = Promise.resolve()

  for (const line of cmds.replace(/\\\n/g, '').trim().split('\n')) {
    const cmd = line.trim()

    promise = promise.then(() => new Promise((resolve, reject) => {
      process.stdout.write(`$ ${cmd}\n`)

      const child = cp.exec(cmd)

      const stdout = []
      const stderr = []

      child.stdout.on('data', chunk => stdout.push(data))
      child.stderr.on('data', chunk => stderr.push(data))

      process.stdin.pipe(child.stdin)
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)

      child.once('close', (code, signal) => {
        process.stdin.unpipe(child.stdin)
        child.stdout.unpipe(process.stdout)
        child.stderr.unpipe(process.stderr)

        const res = { code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }

        if (code) {
          return reject(res)
        }
        resolve(res)
      })
    }))
  }

  return promise
}

module.exports.e = process.env
