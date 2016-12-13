'use strict';

var cp = require('child_process');
var iconv = require('iconv-lite');

var defaultEncoding = 'utf-8';
if (process.platform === 'win32') {
  defaultEncoding = 'gbk';
}

module.exports = exec;

/**
 * Execute commands
 *
 * @param {string|Array<string>} cmds
 * @return {Object} Result of the commands
 */
function exec(cmds) {
  if (Array.isArray(cmds)) {
    return Promise.all(cmds.map(exec));
  }

  var promise = Promise.resolve();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var line = _step.value;

      promise = promise.then(function () {
        return new Promise(function (resolve, reject) {
          var cmd = line.trim();
          var child = exec.spawn(cmd, { stdio: 'inherit' });

          child.once('error', function () {
            return child.kill();
          });

          child.once('close', function (code, signal) {
            var res = { cmd: cmd, code: code, signal: signal };

            if (code) {
              reject(res);
            } else {
              resolve(res);
            }
          });
        });
      });
    };

    for (var _iterator = cmds.replace(/\\\n/g, '').trim().split('\n')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return promise;
}

exec.e = process.env;

/**
 * Execute a command and get it's stdio content
 *
 * @param {string} cmd
 * @param {string} encoding
 * @return {Object} Result of the command
 */
exec.get = function get(cmd, encoding) {
  var child = exec.spawn(cmd, { stdio: ['inherit', 'pipe', 'pipe'] });
  exec.inspect(child, encoding);
  return exec.wait(child, encoding);
};

/**
 * Create a child process to execute the command
 *
 * @param {string} cmd
 * @param {Object} options
 * @return {ChildProcess}
 */
exec.spawn = function spawn(cmd, options) {
  process.stdout.write('$ ' + cmd + '\n');
  return cp.spawn(cmd, [], Object.assign({ shell: true, encoding: 'buffer' }, options));
};

/**
 * Wait for a child process to close and get its stdio content
 *
 * @param {ChildProcess} child
 * @param {string} encoding
 * @return {Object} Result from the child process
 */
exec.wait = function wait(child, encoding) {
  return new Promise(function (resolve, reject) {
    var stdout = [];
    var stderr = [];

    child.once('error', function () {
      return child.kill();
    });

    child.stdout.on('data', function (chunk) {
      return stdout.push(chunk);
    });
    child.stderr.on('data', function (chunk) {
      return stderr.push(chunk);
    });

    child.once('close', function (code, signal) {
      var res = { code: code, signal: signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) };

      if (encoding !== 'buffer') {
        res.stdout = iconv.decode(res.stdout, encoding);
        res.stderr = iconv.decode(res.stderr, encoding);
      }

      if (code) {
        reject(res);
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Pipe stdio from child process to process.stdio
 *
 * @param {ChildProcess} child
 * @param {string} encoding
 * @return {ChildProcess} child itself
 */
exec.inspect = function inspect(child) {
  var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultEncoding;

  if (encoding !== 'buffer') {
    child.stdout.pipe(iconv.decodeStream(encoding)).pipe(process.stdout);
    child.stderr.pipe(iconv.decodeStream(encoding)).pipe(process.stderr);
  }
  return child;
};