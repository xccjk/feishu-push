(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
(function (global,Buffer){(function (){
"use strict";function bind(e,t){return function(){return e.apply(t,arguments)}}const toString=Object.prototype["toString"],getPrototypeOf=Object["getPrototypeOf"],kindOf=(t=>e=>{e=toString.call(e);return t[e]||(t[e]=e.slice(8,-1).toLowerCase())})(Object.create(null)),kindOfTest=t=>(t=t.toLowerCase(),e=>kindOf(e)===t),typeOfTest=t=>e=>typeof e===t,isArray=Array["isArray"],isUndefined=typeOfTest("undefined");function isBuffer(e){return null!==e&&!isUndefined(e)&&null!==e.constructor&&!isUndefined(e.constructor)&&isFunction(e.constructor.isBuffer)&&e.constructor.isBuffer(e)}const isArrayBuffer=kindOfTest("ArrayBuffer");function isArrayBufferView(e){let t;return t="undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer&&isArrayBuffer(e.buffer)}const isString=typeOfTest("string"),isFunction=typeOfTest("function"),isNumber=typeOfTest("number"),isObject=e=>null!==e&&"object"==typeof e,isBoolean=e=>!0===e||!1===e,isPlainObject=e=>{var t;return"object"===kindOf(e)&&!(null!==(t=getPrototypeOf(e))&&t!==Object.prototype&&null!==Object.getPrototypeOf(t)||Symbol.toStringTag in e||Symbol.iterator in e)},isDate=kindOfTest("Date"),isFile=kindOfTest("File"),isBlob=kindOfTest("Blob"),isFileList=kindOfTest("FileList"),isStream=e=>isObject(e)&&isFunction(e.pipe),isFormData=e=>{var t="[object FormData]";return e&&("function"==typeof FormData&&e instanceof FormData||toString.call(e)===t||isFunction(e.toString)&&e.toString()===t)},isURLSearchParams=kindOfTest("URLSearchParams"),trim=e=>e.trim?e.trim():e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"");function forEach(t,r,{allOwnKeys:n=!1}={}){if(null!=t){let e;var o;if("object"!=typeof t&&(t=[t]),isArray(t))for(e=0,o=t.length;e<o;e++)r.call(null,t[e],e,t);else{var i,s=n?Object.getOwnPropertyNames(t):Object.keys(t),a=s.length;for(e=0;e<a;e++)i=s[e],r.call(null,t[i],i,t)}}}function findKey(e,t){t=t.toLowerCase();var r,n=Object.keys(e);let o=n.length;for(;0<o--;)if(t===(r=n[o]).toLowerCase())return r;return null}const _global="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:global,isContextDefined=e=>!isUndefined(e)&&e!==_global;function merge(){const r=(isContextDefined(this)&&this||{})["caseless"],n={};var o=(e,t)=>{t=r&&findKey(n,t)||t;isPlainObject(n[t])&&isPlainObject(e)?n[t]=merge(n[t],e):isPlainObject(e)?n[t]=merge({},e):isArray(e)?n[t]=e.slice():n[t]=e};for(let e=0,t=arguments.length;e<t;e++)arguments[e]&&forEach(arguments[e],o);return n}const extend=(r,e,n,{allOwnKeys:t}={})=>(forEach(e,(e,t)=>{n&&isFunction(e)?r[t]=bind(e,n):r[t]=e},{allOwnKeys:t}),r),stripBOM=e=>e=65279===e.charCodeAt(0)?e.slice(1):e,inherits=(e,t,r,n)=>{e.prototype=Object.create(t.prototype,n),e.prototype.constructor=e,Object.defineProperty(e,"super",{value:t.prototype}),r&&Object.assign(e.prototype,r)},toFlatObject=(e,t,r,n)=>{var o,i;let s;var a={};if(t=t||{},null!=e)do{for(o=Object.getOwnPropertyNames(e),s=o.length;0<s--;)i=o[s],n&&!n(i,e,t)||a[i]||(t[i]=e[i],a[i]=!0)}while((e=!1!==r&&getPrototypeOf(e))&&(!r||r(e,t))&&e!==Object.prototype);return t},endsWith=(e,t,r)=>{e=String(e),(void 0===r||r>e.length)&&(r=e.length),r-=t.length;e=e.indexOf(t,r);return-1!==e&&e===r},toArray=e=>{if(!e)return null;if(isArray(e))return e;let t=e.length;if(!isNumber(t))return null;for(var r=new Array(t);0<t--;)r[t]=e[t];return r},isTypedArray=(t=>e=>t&&e instanceof t)("undefined"!=typeof Uint8Array&&getPrototypeOf(Uint8Array)),forEachEntry=(e,t)=>{for(var r=(e&&e[Symbol.iterator]).call(e);(n=r.next())&&!n.done;){var n=n.value;t.call(e,n[0],n[1])}},matchAll=(e,t)=>{for(var r,n=[];null!==(r=e.exec(t));)n.push(r);return n},isHTMLForm=kindOfTest("HTMLFormElement"),toCamelCase=e=>e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,function(e,t,r){return t.toUpperCase()+r}),hasOwnProperty=(({hasOwnProperty:r})=>(e,t)=>r.call(e,t))(Object.prototype),isRegExp=kindOfTest("RegExp"),reduceDescriptors=(r,n)=>{var e=Object.getOwnPropertyDescriptors(r);const o={};forEach(e,(e,t)=>{!1!==n(e,t,r)&&(o[t]=e)}),Object.defineProperties(r,o)},freezeMethods=n=>{reduceDescriptors(n,(e,t)=>{if(isFunction(n)&&-1!==["arguments","caller","callee"].indexOf(t))return!1;var r=n[t];isFunction(r)&&(e.enumerable=!1,"writable"in e?e.writable=!1:e.set||(e.set=()=>{throw Error("Can not rewrite read-only method '"+t+"'")}))})},toObjectSet=(e,t)=>{const r={};var n=e=>{e.forEach(e=>{r[e]=!0})};return isArray(e)?n(e):n(String(e).split(t)),r},noop=()=>{},toFiniteNumber=(e,t)=>(e=+e,Number.isFinite(e)?e:t),ALPHA="abcdefghijklmnopqrstuvwxyz",DIGIT="0123456789",ALPHABET={DIGIT:DIGIT,ALPHA:ALPHA,ALPHA_DIGIT:ALPHA+ALPHA.toUpperCase()+DIGIT},generateString=(e=16,t=ALPHABET.ALPHA_DIGIT)=>{let r="";for(var n=t["length"];e--;)r+=t[Math.random()*n|0];return r};function isSpecCompliantForm(e){return!!(e&&isFunction(e.append)&&"FormData"===e[Symbol.toStringTag]&&e[Symbol.iterator])}const toJSONObject=e=>{const t=new Array(10),o=(e,r)=>{if(isObject(e)){if(0<=t.indexOf(e))return;if(!("toJSON"in e)){t[r]=e;const n=isArray(e)?[]:{};return forEach(e,(e,t)=>{e=o(e,r+1);isUndefined(e)||(n[t]=e)}),t[r]=void 0,n}}return e};return o(e,0)};var utils={isArray:isArray,isArrayBuffer:isArrayBuffer,isBuffer:isBuffer,isFormData:isFormData,isArrayBufferView:isArrayBufferView,isString:isString,isNumber:isNumber,isBoolean:isBoolean,isObject:isObject,isPlainObject:isPlainObject,isUndefined:isUndefined,isDate:isDate,isFile:isFile,isBlob:isBlob,isRegExp:isRegExp,isFunction:isFunction,isStream:isStream,isURLSearchParams:isURLSearchParams,isTypedArray:isTypedArray,isFileList:isFileList,forEach:forEach,merge:merge,extend:extend,trim:trim,stripBOM:stripBOM,inherits:inherits,toFlatObject:toFlatObject,kindOf:kindOf,kindOfTest:kindOfTest,endsWith:endsWith,toArray:toArray,forEachEntry:forEachEntry,matchAll:matchAll,isHTMLForm:isHTMLForm,hasOwnProperty:hasOwnProperty,hasOwnProp:hasOwnProperty,reduceDescriptors:reduceDescriptors,freezeMethods:freezeMethods,toObjectSet:toObjectSet,toCamelCase:toCamelCase,noop:noop,toFiniteNumber:toFiniteNumber,findKey:findKey,global:_global,isContextDefined:isContextDefined,ALPHABET:ALPHABET,generateString:generateString,isSpecCompliantForm:isSpecCompliantForm,toJSONObject:toJSONObject};function AxiosError(e,t,r,n,o){Error.call(this),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=(new Error).stack,this.message=e,this.name="AxiosError",t&&(this.code=t),r&&(this.config=r),n&&(this.request=n),o&&(this.response=o)}utils.inherits(AxiosError,Error,{toJSON:function(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:utils.toJSONObject(this.config),code:this.code,status:this.response&&this.response.status?this.response.status:null}}});const prototype$1=AxiosError.prototype,descriptors={};["ERR_BAD_OPTION_VALUE","ERR_BAD_OPTION","ECONNABORTED","ETIMEDOUT","ERR_NETWORK","ERR_FR_TOO_MANY_REDIRECTS","ERR_DEPRECATED","ERR_BAD_RESPONSE","ERR_BAD_REQUEST","ERR_CANCELED","ERR_NOT_SUPPORT","ERR_INVALID_URL"].forEach(e=>{descriptors[e]={value:e}}),Object.defineProperties(AxiosError,descriptors),Object.defineProperty(prototype$1,"isAxiosError",{value:!0}),AxiosError.from=(e,t,r,n,o,i)=>{var s=Object.create(prototype$1);return utils.toFlatObject(e,s,function(e){return e!==Error.prototype},e=>"isAxiosError"!==e),AxiosError.call(s,e.message,t,r,n,o),s.cause=e,s.name=e.name,i&&Object.assign(s,i),s};var httpAdapter=null;function isVisitable(e){return utils.isPlainObject(e)||utils.isArray(e)}function removeBrackets(e){return utils.endsWith(e,"[]")?e.slice(0,-2):e}function renderKey(e,t,r){return e?e.concat(t).map(function(e,t){return e=removeBrackets(e),!r&&t?"["+e+"]":e}).join(r?".":""):t}function isFlatArray(e){return utils.isArray(e)&&!e.some(isVisitable)}const predicates=utils.toFlatObject(utils,{},null,function(e){return/^is[A-Z]/.test(e)});function toFormData(e,o,t){if(!utils.isObject(e))throw new TypeError("target must be an object");o=o||new FormData;const i=(t=utils.toFlatObject(t,{metaTokens:!0,dots:!1,indexes:!1},!1,function(e,t){return!utils.isUndefined(t[e])})).metaTokens,s=t.visitor||n,a=t.dots,l=t.indexes;const r=(t.Blob||"undefined"!=typeof Blob&&Blob)&&utils.isSpecCompliantForm(o);if(!utils.isFunction(s))throw new TypeError("visitor must be a function");function u(e){if(null===e)return"";if(utils.isDate(e))return e.toISOString();if(!r&&utils.isBlob(e))throw new AxiosError("Blob is not supported. Use a Buffer instead.");return utils.isArrayBuffer(e)||utils.isTypedArray(e)?r&&"function"==typeof Blob?new Blob([e]):Buffer.from(e):e}function n(e,r,t){let n=e;if(e&&!t&&"object"==typeof e)if(utils.endsWith(r,"{}"))r=i?r:r.slice(0,-2),e=JSON.stringify(e);else if(utils.isArray(e)&&isFlatArray(e)||(utils.isFileList(e)||utils.endsWith(r,"[]"))&&(n=utils.toArray(e)))return r=removeBrackets(r),n.forEach(function(e,t){utils.isUndefined(e)||null===e||o.append(!0===l?renderKey([r],t,a):null===l?r:r+"[]",u(e))}),!1;return!!isVisitable(e)||(o.append(renderKey(t,r,a),u(e)),!1)}const c=[],d=Object.assign(predicates,{defaultVisitor:n,convertValue:u,isVisitable:isVisitable});if(utils.isObject(e))return function r(e,n){if(!utils.isUndefined(e)){if(-1!==c.indexOf(e))throw Error("Circular reference detected in "+n.join("."));c.push(e),utils.forEach(e,function(e,t){!0===(!(utils.isUndefined(e)||null===e)&&s.call(o,e,utils.isString(t)?t.trim():t,n,d))&&r(e,n?n.concat(t):[t])}),c.pop()}}(e),o;throw new TypeError("data must be an object")}function encode$1(e){const t={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+","%00":"\0"};return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g,function(e){return t[e]})}function AxiosURLSearchParams(e,t){this._pairs=[],e&&toFormData(e,this,t)}const prototype=AxiosURLSearchParams.prototype;function encode(e){return encodeURIComponent(e).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}function buildURL(t,r,n){if(r){var o=n&&n.encode||encode,i=n&&n.serialize;let e;(e=i?i(r,n):utils.isURLSearchParams(r)?r.toString():new AxiosURLSearchParams(r,n).toString(o))&&(-1!==(i=t.indexOf("#"))&&(t=t.slice(0,i)),t+=(-1===t.indexOf("?")?"?":"&")+e)}return t}prototype.append=function(e,t){this._pairs.push([e,t])},prototype.toString=function(t){const r=t?function(e){return t.call(this,e,encode$1)}:encode$1;return this._pairs.map(function(e){return r(e[0])+"="+r(e[1])},"").join("&")};class InterceptorManager{constructor(){this.handlers=[]}use(e,t,r){return this.handlers.push({fulfilled:e,rejected:t,synchronous:!!r&&r.synchronous,runWhen:r?r.runWhen:null}),this.handlers.length-1}eject(e){this.handlers[e]&&(this.handlers[e]=null)}clear(){this.handlers&&(this.handlers=[])}forEach(t){utils.forEach(this.handlers,function(e){null!==e&&t(e)})}}var InterceptorManager$1=InterceptorManager,transitionalDefaults={silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1},URLSearchParams$1="undefined"!=typeof URLSearchParams?URLSearchParams:AxiosURLSearchParams,FormData$1="undefined"!=typeof FormData?FormData:null,Blob$1="undefined"!=typeof Blob?Blob:null;const isStandardBrowserEnv=(()=>{var e;return("undefined"==typeof navigator||"ReactNative"!==(e=navigator.product)&&"NativeScript"!==e&&"NS"!==e)&&"undefined"!=typeof window&&"undefined"!=typeof document})(),isStandardBrowserWebWorkerEnv="undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope&&"function"==typeof self.importScripts;var platform={isBrowser:!0,classes:{URLSearchParams:URLSearchParams$1,FormData:FormData$1,Blob:Blob$1},isStandardBrowserEnv:isStandardBrowserEnv,isStandardBrowserWebWorkerEnv:isStandardBrowserWebWorkerEnv,protocols:["http","https","file","blob","url","data"]};function toURLEncodedForm(e,t){return toFormData(e,new platform.classes.URLSearchParams,Object.assign({visitor:function(e,t,r,n){return platform.isNode&&utils.isBuffer(e)?(this.append(t,e.toString("base64")),!1):n.defaultVisitor.apply(this,arguments)}},t))}function parsePropPath(e){return utils.matchAll(/\w+|\[(\w*)]/g,e).map(e=>"[]"===e[0]?"":e[1]||e[0])}function arrayToObject(e){var t={},r=Object.keys(e);let n;var o,i=r.length;for(n=0;n<i;n++)t[o=r[n]]=e[o];return t}function formDataToJSON(e){if(utils.isFormData(e)&&utils.isFunction(e.entries)){const r={};return utils.forEachEntry(e,(e,t)=>{!function e(t,r,n,o){var i=t[o++],s=Number.isFinite(+i),a=o>=t.length,i=!i&&utils.isArray(n)?n.length:i;return a?utils.hasOwnProp(n,i)?n[i]=[n[i],r]:n[i]=r:(n[i]&&utils.isObject(n[i])||(n[i]=[]),e(t,r,n[i],o)&&utils.isArray(n[i])&&(n[i]=arrayToObject(n[i]))),!s}(parsePropPath(e),t,r,0)}),r}return null}const DEFAULT_CONTENT_TYPE={"Content-Type":void 0};function stringifySafely(e,t,r){if(utils.isString(e))try{return(t||JSON.parse)(e),utils.trim(e)}catch(e){if("SyntaxError"!==e.name)throw e}return(r||JSON.stringify)(e)}const defaults={transitional:transitionalDefaults,adapter:["xhr","http"],transformRequest:[function(e,t){var r=t.getContentType()||"",n=-1<r.indexOf("application/json"),o=utils.isObject(e),i=(o&&utils.isHTMLForm(e)&&(e=new FormData(e)),utils.isFormData(e));if(i)return n?JSON.stringify(formDataToJSON(e)):e;if(utils.isArrayBuffer(e)||utils.isBuffer(e)||utils.isStream(e)||utils.isFile(e)||utils.isBlob(e))return e;if(utils.isArrayBufferView(e))return e.buffer;if(utils.isURLSearchParams(e))return t.setContentType("application/x-www-form-urlencoded;charset=utf-8",!1),e.toString();if(o){if(-1<r.indexOf("application/x-www-form-urlencoded"))return toURLEncodedForm(e,this.formSerializer).toString();if((i=utils.isFileList(e))||-1<r.indexOf("multipart/form-data"))return toFormData(i?{"files[]":e}:e,(r=this.env&&this.env.FormData)&&new r,this.formSerializer)}return o||n?(t.setContentType("application/json",!1),stringifySafely(e)):e}],transformResponse:[function(e){var t=this.transitional||defaults.transitional,r=t&&t.forcedJSONParsing,n="json"===this.responseType;if(e&&utils.isString(e)&&(r&&!this.responseType||n)){r=!(t&&t.silentJSONParsing)&&n;try{return JSON.parse(e)}catch(e){if(r){if("SyntaxError"===e.name)throw AxiosError.from(e,AxiosError.ERR_BAD_RESPONSE,this,null,this.response);throw e}}}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,env:{FormData:platform.classes.FormData,Blob:platform.classes.Blob},validateStatus:function(e){return 200<=e&&e<300},headers:{common:{Accept:"application/json, text/plain, */*"}}};utils.forEach(["delete","get","head"],function(e){defaults.headers[e]={}}),utils.forEach(["post","put","patch"],function(e){defaults.headers[e]=utils.merge(DEFAULT_CONTENT_TYPE)});var defaults$1=defaults;const ignoreDuplicateOf=utils.toObjectSet(["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"]);var parseHeaders=e=>{const t={};let r,n,o;return e&&e.split("\n").forEach(function(e){o=e.indexOf(":"),r=e.substring(0,o).trim().toLowerCase(),n=e.substring(o+1).trim(),!r||t[r]&&ignoreDuplicateOf[r]||("set-cookie"===r?t[r]?t[r].push(n):t[r]=[n]:t[r]=t[r]?t[r]+", "+n:n)}),t};const $internals=Symbol("internals");function normalizeHeader(e){return e&&String(e).trim().toLowerCase()}function normalizeValue(e){return!1===e||null==e?e:utils.isArray(e)?e.map(normalizeValue):String(e)}function parseTokens(e){for(var t,r=Object.create(null),n=/([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;t=n.exec(e);)r[t[1]]=t[2];return r}function isValidHeaderName(e){return/^[-_a-zA-Z]+$/.test(e.trim())}function matchHeaderValue(e,t,r,n,o){return utils.isFunction(n)?n.call(this,t,r):utils.isString(t=o?r:t)?utils.isString(n)?-1!==t.indexOf(n):utils.isRegExp(n)?n.test(t):void 0:void 0}function formatHeader(e){return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g,(e,t,r)=>t.toUpperCase()+r)}function buildAccessors(e,o){const t=utils.toCamelCase(" "+o);["get","set","has"].forEach(n=>{Object.defineProperty(e,n+t,{value:function(e,t,r){return this[n].call(this,o,e,t,r)},configurable:!0})})}class AxiosHeaders{constructor(e){e&&this.set(e)}set(e,t,r){const o=this;function n(e,t,r){var n=normalizeHeader(t);if(!n)throw new Error("header name must be a non-empty string");n=utils.findKey(o,n);n&&void 0!==o[n]&&!0!==r&&(void 0!==r||!1===o[n])||(o[n||t]=normalizeValue(e))}var i=(e,r)=>utils.forEach(e,(e,t)=>n(e,t,r));return utils.isPlainObject(e)||e instanceof this.constructor?i(e,t):utils.isString(e)&&(e=e.trim())&&!isValidHeaderName(e)?i(parseHeaders(e),t):null!=e&&n(t,e,r),this}get(e,t){if(e=normalizeHeader(e)){e=utils.findKey(this,e);if(e){var r=this[e];if(!t)return r;if(!0===t)return parseTokens(r);if(utils.isFunction(t))return t.call(this,r,e);if(utils.isRegExp(t))return t.exec(r);throw new TypeError("parser must be boolean|regexp|function")}}}has(e,t){return!!(e=normalizeHeader(e))&&!(!(e=utils.findKey(this,e))||void 0===this[e]||t&&!matchHeaderValue(this,this[e],e,t))}delete(e,t){const r=this;let n=!1;function o(e){(e=normalizeHeader(e))&&(e=utils.findKey(r,e))&&(!t||matchHeaderValue(r,r[e],e,t))&&(delete r[e],n=!0)}return utils.isArray(e)?e.forEach(o):o(e),n}clear(e){var t=Object.keys(this);let r=t.length,n=!1;for(;r--;){var o=t[r];e&&!matchHeaderValue(this,this[o],o,e,!0)||(delete this[o],n=!0)}return n}normalize(n){const o=this,i={};return utils.forEach(this,(e,t)=>{var r=utils.findKey(i,t);r?(o[r]=normalizeValue(e),delete o[t]):((r=n?formatHeader(t):String(t).trim())!==t&&delete o[t],o[r]=normalizeValue(e),i[r]=!0)}),this}concat(...e){return this.constructor.concat(this,...e)}toJSON(r){const n=Object.create(null);return utils.forEach(this,(e,t)=>{null!=e&&!1!==e&&(n[t]=r&&utils.isArray(e)?e.join(", "):e)}),n}[Symbol.iterator](){return Object.entries(this.toJSON())[Symbol.iterator]()}toString(){return Object.entries(this.toJSON()).map(([e,t])=>e+": "+t).join("\n")}get[Symbol.toStringTag](){return"AxiosHeaders"}static from(e){return e instanceof this?e:new this(e)}static concat(e,...t){const r=new this(e);return t.forEach(e=>r.set(e)),r}static accessor(e){const r=(this[$internals]=this[$internals]={accessors:{}}).accessors,n=this.prototype;function t(e){var t=normalizeHeader(e);r[t]||(buildAccessors(n,e),r[t]=!0)}return utils.isArray(e)?e.forEach(t):t(e),this}}AxiosHeaders.accessor(["Content-Type","Content-Length","Accept","Accept-Encoding","User-Agent","Authorization"]),utils.freezeMethods(AxiosHeaders.prototype),utils.freezeMethods(AxiosHeaders);var AxiosHeaders$1=AxiosHeaders;function transformData(e,t){const r=this||defaults$1;var n=t||r;const o=AxiosHeaders$1.from(n.headers);let i=n.data;return utils.forEach(e,function(e){i=e.call(r,i,o.normalize(),t?t.status:void 0)}),o.normalize(),i}function isCancel(e){return!(!e||!e.__CANCEL__)}function CanceledError(e,t,r){AxiosError.call(this,null==e?"canceled":e,AxiosError.ERR_CANCELED,t,r),this.name="CanceledError"}function settle(e,t,r){var n=r.config.validateStatus;r.status&&n&&!n(r.status)?t(new AxiosError("Request failed with status code "+r.status,[AxiosError.ERR_BAD_REQUEST,AxiosError.ERR_BAD_RESPONSE][Math.floor(r.status/100)-4],r.config,r.request,r)):e(r)}utils.inherits(CanceledError,AxiosError,{__CANCEL__:!0});var cookies=platform.isStandardBrowserEnv?{write:function(e,t,r,n,o,i){var s=[];s.push(e+"="+encodeURIComponent(t)),utils.isNumber(r)&&s.push("expires="+new Date(r).toGMTString()),utils.isString(n)&&s.push("path="+n),utils.isString(o)&&s.push("domain="+o),!0===i&&s.push("secure"),document.cookie=s.join("; ")},read:function(e){e=document.cookie.match(new RegExp("(^|;\\s*)("+e+")=([^;]*)"));return e?decodeURIComponent(e[3]):null},remove:function(e){this.write(e,"",Date.now()-864e5)}}:{write:function(){},read:function(){return null},remove:function(){}};function isAbsoluteURL(e){return/^([a-z][a-z\d+\-.]*:)?\/\//i.test(e)}function combineURLs(e,t){return t?e.replace(/\/+$/,"")+"/"+t.replace(/^\/+/,""):e}function buildFullPath(e,t){return e&&!isAbsoluteURL(t)?combineURLs(e,t):t}var isURLSameOrigin=platform.isStandardBrowserEnv?function(){const r=/(msie|trident)/i.test(navigator.userAgent),n=document.createElement("a");let t;function o(e){let t=e;return r&&(n.setAttribute("href",t),t=n.href),n.setAttribute("href",t),{href:n.href,protocol:n.protocol?n.protocol.replace(/:$/,""):"",host:n.host,search:n.search?n.search.replace(/^\?/,""):"",hash:n.hash?n.hash.replace(/^#/,""):"",hostname:n.hostname,port:n.port,pathname:"/"===n.pathname.charAt(0)?n.pathname:"/"+n.pathname}}return t=o(window.location.href),function(e){e=utils.isString(e)?o(e):e;return e.protocol===t.protocol&&e.host===t.host}}():function(){return!0};function parseProtocol(e){e=/^([-+\w]{1,25})(:?\/\/|:)/.exec(e);return e&&e[1]||""}function speedometer(i,s){i=i||10;const a=new Array(i),l=new Array(i);let u=0,c=0,d;return s=void 0!==s?s:1e3,function(e){var t=Date.now(),r=l[c];d=d||t,a[u]=e,l[u]=t;let n=c,o=0;for(;n!==u;)o+=a[n++],n%=i;return(u=(u+1)%i)===c&&(c=(c+1)%i),!(t-d<s)&&(e=r&&t-r)?Math.round(1e3*o/e):void 0}}function progressEventReducer(s,a){let l=0;const u=speedometer(50,250);return e=>{var t=e.loaded,r=e.lengthComputable?e.total:void 0,n=t-l,o=u(n),i=t<=r,n={loaded:l=t,total:r,progress:r?t/r:void 0,bytes:n,rate:o||void 0,estimated:o&&r&&i?(r-t)/o:void 0,event:e};n[a?"download":"upload"]=!0,s(n)}}const isXHRAdapterSupported="undefined"!=typeof XMLHttpRequest;var xhrAdapter=isXHRAdapterSupported&&function(d){return new Promise(function(t,r){var e=d.data,n=AxiosHeaders$1.from(d.headers).normalize();const o=d.responseType;let i;function s(){d.cancelToken&&d.cancelToken.unsubscribe(i),d.signal&&d.signal.removeEventListener("abort",i)}utils.isFormData(e)&&(platform.isStandardBrowserEnv||platform.isStandardBrowserWebWorkerEnv)&&n.setContentType(!1);let a=new XMLHttpRequest;d.auth&&(l=d.auth.username||"",c=d.auth.password?unescape(encodeURIComponent(d.auth.password)):"",n.set("Authorization","Basic "+btoa(l+":"+c)));var l=buildFullPath(d.baseURL,d.url);function u(){var e;a&&(e=AxiosHeaders$1.from("getAllResponseHeaders"in a&&a.getAllResponseHeaders()),settle(function(e){t(e),s()},function(e){r(e),s()},{data:o&&"text"!==o&&"json"!==o?a.response:a.responseText,status:a.status,statusText:a.statusText,headers:e,config:d,request:a}),a=null)}a.open(d.method.toUpperCase(),buildURL(l,d.params,d.paramsSerializer),!0),a.timeout=d.timeout,"onloadend"in a?a.onloadend=u:a.onreadystatechange=function(){a&&4===a.readyState&&(0!==a.status||a.responseURL&&0===a.responseURL.indexOf("file:"))&&setTimeout(u)},a.onabort=function(){a&&(r(new AxiosError("Request aborted",AxiosError.ECONNABORTED,d,a)),a=null)},a.onerror=function(){r(new AxiosError("Network Error",AxiosError.ERR_NETWORK,d,a)),a=null},a.ontimeout=function(){let e=d.timeout?"timeout of "+d.timeout+"ms exceeded":"timeout exceeded";var t=d.transitional||transitionalDefaults;d.timeoutErrorMessage&&(e=d.timeoutErrorMessage),r(new AxiosError(e,t.clarifyTimeoutError?AxiosError.ETIMEDOUT:AxiosError.ECONNABORTED,d,a)),a=null},platform.isStandardBrowserEnv&&(c=(d.withCredentials||isURLSameOrigin(l))&&d.xsrfCookieName&&cookies.read(d.xsrfCookieName))&&n.set(d.xsrfHeaderName,c),void 0===e&&n.setContentType(null),"setRequestHeader"in a&&utils.forEach(n.toJSON(),function(e,t){a.setRequestHeader(t,e)}),utils.isUndefined(d.withCredentials)||(a.withCredentials=!!d.withCredentials),o&&"json"!==o&&(a.responseType=d.responseType),"function"==typeof d.onDownloadProgress&&a.addEventListener("progress",progressEventReducer(d.onDownloadProgress,!0)),"function"==typeof d.onUploadProgress&&a.upload&&a.upload.addEventListener("progress",progressEventReducer(d.onUploadProgress)),(d.cancelToken||d.signal)&&(i=e=>{a&&(r(!e||e.type?new CanceledError(null,d,a):e),a.abort(),a=null)},d.cancelToken&&d.cancelToken.subscribe(i),d.signal)&&(d.signal.aborted?i():d.signal.addEventListener("abort",i));var c=parseProtocol(l);c&&-1===platform.protocols.indexOf(c)?r(new AxiosError("Unsupported protocol "+c+":",AxiosError.ERR_BAD_REQUEST,d)):a.send(e||null)})};const knownAdapters={http:httpAdapter,xhr:xhrAdapter};utils.forEach(knownAdapters,(e,t)=>{if(e){try{Object.defineProperty(e,"name",{value:t})}catch(e){}Object.defineProperty(e,"adapterName",{value:t})}});var adapters={getAdapter:t=>{var r=(t=utils.isArray(t)?t:[t])["length"];let n,o;for(let e=0;e<r&&(n=t[e],!(o=utils.isString(n)?knownAdapters[n.toLowerCase()]:n));e++);if(!o){if(!1===o)throw new AxiosError(`Adapter ${n} is not supported by the environment`,"ERR_NOT_SUPPORT");throw new Error(utils.hasOwnProp(knownAdapters,n)?`Adapter '${n}' is not available in the build`:`Unknown adapter '${n}'`)}if(utils.isFunction(o))return o;throw new TypeError("adapter is not a function")},adapters:knownAdapters};function throwIfCancellationRequested(e){if(e.cancelToken&&e.cancelToken.throwIfRequested(),e.signal&&e.signal.aborted)throw new CanceledError(null,e)}function dispatchRequest(t){return throwIfCancellationRequested(t),t.headers=AxiosHeaders$1.from(t.headers),t.data=transformData.call(t,t.transformRequest),-1!==["post","put","patch"].indexOf(t.method)&&t.headers.setContentType("application/x-www-form-urlencoded",!1),adapters.getAdapter(t.adapter||defaults$1.adapter)(t).then(function(e){return throwIfCancellationRequested(t),e.data=transformData.call(t,t.transformResponse,e),e.headers=AxiosHeaders$1.from(e.headers),e},function(e){return isCancel(e)||(throwIfCancellationRequested(t),e&&e.response&&(e.response.data=transformData.call(t,t.transformResponse,e.response),e.response.headers=AxiosHeaders$1.from(e.response.headers))),Promise.reject(e)})}const headersToObject=e=>e instanceof AxiosHeaders$1?e.toJSON():e;function mergeConfig(n,o){o=o||{};const i={};function s(e,t,r){return utils.isPlainObject(e)&&utils.isPlainObject(t)?utils.merge.call({caseless:r},e,t):utils.isPlainObject(t)?utils.merge({},t):utils.isArray(t)?t.slice():t}function a(e,t,r){return utils.isUndefined(t)?utils.isUndefined(e)?void 0:s(void 0,e,r):s(e,t,r)}function e(e,t){if(!utils.isUndefined(t))return s(void 0,t)}function t(e,t){return utils.isUndefined(t)?utils.isUndefined(e)?void 0:s(void 0,e):s(void 0,t)}function l(e,t,r){return r in o?s(e,t):r in n?s(void 0,e):void 0}const u={url:e,method:e,data:e,baseURL:t,transformRequest:t,transformResponse:t,paramsSerializer:t,timeout:t,timeoutMessage:t,withCredentials:t,adapter:t,responseType:t,xsrfCookieName:t,xsrfHeaderName:t,onUploadProgress:t,onDownloadProgress:t,decompress:t,maxContentLength:t,maxBodyLength:t,beforeRedirect:t,transport:t,httpAgent:t,httpsAgent:t,cancelToken:t,socketPath:t,responseEncoding:t,validateStatus:l,headers:(e,t)=>a(headersToObject(e),headersToObject(t),!0)};return utils.forEach(Object.keys(n).concat(Object.keys(o)),function(e){var t=u[e]||a,r=t(n[e],o[e],e);utils.isUndefined(r)&&t!==l||(i[e]=r)}),i}const VERSION="1.3.4",validators$1={},deprecatedWarnings=(["object","boolean","number","function","string","symbol"].forEach((t,r)=>{validators$1[t]=function(e){return typeof e===t||"a"+(r<1?"n ":" ")+t}}),{});function assertOptions(e,t,r){if("object"!=typeof e)throw new AxiosError("options must be an object",AxiosError.ERR_BAD_OPTION_VALUE);var n=Object.keys(e);let o=n.length;for(;0<o--;){var i=n[o],s=t[i];if(s){var a=e[i],s=void 0===a||s(a,i,e);if(!0!==s)throw new AxiosError("option "+i+" must be "+s,AxiosError.ERR_BAD_OPTION_VALUE)}else if(!0!==r)throw new AxiosError("Unknown option "+i,AxiosError.ERR_BAD_OPTION)}}validators$1.transitional=function(n,o,r){function i(e,t){return"[Axios v"+VERSION+"] Transitional option '"+e+"'"+t+(r?". "+r:"")}return(e,t,r)=>{if(!1===n)throw new AxiosError(i(t," has been removed"+(o?" in "+o:"")),AxiosError.ERR_DEPRECATED);return o&&!deprecatedWarnings[t]&&(deprecatedWarnings[t]=!0,console.warn(i(t," has been deprecated since v"+o+" and will be removed in the near future"))),!n||n(e,t,r)}};var validator={assertOptions:assertOptions,validators:validators$1};const validators=validator.validators;class Axios{constructor(e){this.defaults=e,this.interceptors={request:new InterceptorManager$1,response:new InterceptorManager$1}}request(e,t){"string"==typeof e?(t=t||{}).url=e:t=e||{};const{transitional:r,paramsSerializer:n,headers:o}=t=mergeConfig(this.defaults,t);void 0!==r&&validator.assertOptions(r,{silentJSONParsing:validators.transitional(validators.boolean),forcedJSONParsing:validators.transitional(validators.boolean),clarifyTimeoutError:validators.transitional(validators.boolean)},!1),void 0!==n&&validator.assertOptions(n,{encode:validators.function,serialize:validators.function},!0),t.method=(t.method||this.defaults.method||"get").toLowerCase(),(e=o&&utils.merge(o.common,o[t.method]))&&utils.forEach(["delete","get","head","post","put","patch","common"],e=>{delete o[e]}),t.headers=AxiosHeaders$1.concat(e,o);const i=[];let s=!0;this.interceptors.request.forEach(function(e){"function"==typeof e.runWhen&&!1===e.runWhen(t)||(s=s&&e.synchronous,i.unshift(e.fulfilled,e.rejected))});const a=[];this.interceptors.response.forEach(function(e){a.push(e.fulfilled,e.rejected)});let l,u=0,c;if(s){c=i.length;let e=t;for(u=0;u<c;){var d=i[u++],f=i[u++];try{e=d(e)}catch(e){f.call(this,e);break}}try{l=dispatchRequest.call(this,e)}catch(e){return Promise.reject(e)}for(u=0,c=a.length;u<c;)l=l.then(a[u++],a[u++])}else{var p=[dispatchRequest.bind(this),void 0];for(p.unshift.apply(p,i),p.push.apply(p,a),c=p.length,l=Promise.resolve(t);u<c;)l=l.then(p[u++],p[u++])}return l}getUri(e){return buildURL(buildFullPath((e=mergeConfig(this.defaults,e)).baseURL,e.url),e.params,e.paramsSerializer)}}utils.forEach(["delete","get","head","options"],function(r){Axios.prototype[r]=function(e,t){return this.request(mergeConfig(t||{},{method:r,url:e,data:(t||{}).data}))}}),utils.forEach(["post","put","patch"],function(o){function e(n){return function(e,t,r){return this.request(mergeConfig(r||{},{method:o,headers:n?{"Content-Type":"multipart/form-data"}:{},url:e,data:t}))}}Axios.prototype[o]=e(),Axios.prototype[o+"Form"]=e(!0)});var Axios$1=Axios;class CancelToken{constructor(e){if("function"!=typeof e)throw new TypeError("executor must be a function.");let n;this.promise=new Promise(function(e){n=e});const o=this;this.promise.then(t=>{if(o._listeners){let e=o._listeners.length;for(;0<e--;)o._listeners[e](t);o._listeners=null}}),this.promise.then=e=>{let t;e=new Promise(e=>{o.subscribe(e),t=e}).then(e);return e.cancel=function(){o.unsubscribe(t)},e},e(function(e,t,r){o.reason||(o.reason=new CanceledError(e,t,r),n(o.reason))})}throwIfRequested(){if(this.reason)throw this.reason}subscribe(e){this.reason?e(this.reason):this._listeners?this._listeners.push(e):this._listeners=[e]}unsubscribe(e){this._listeners&&-1!==(e=this._listeners.indexOf(e))&&this._listeners.splice(e,1)}static source(){let t;return{token:new CancelToken(function(e){t=e}),cancel:t}}}var CancelToken$1=CancelToken;function spread(t){return function(e){return t.apply(null,e)}}function isAxiosError(e){return utils.isObject(e)&&!0===e.isAxiosError}const HttpStatusCode={Continue:100,SwitchingProtocols:101,Processing:102,EarlyHints:103,Ok:200,Created:201,Accepted:202,NonAuthoritativeInformation:203,NoContent:204,ResetContent:205,PartialContent:206,MultiStatus:207,AlreadyReported:208,ImUsed:226,MultipleChoices:300,MovedPermanently:301,Found:302,SeeOther:303,NotModified:304,UseProxy:305,Unused:306,TemporaryRedirect:307,PermanentRedirect:308,BadRequest:400,Unauthorized:401,PaymentRequired:402,Forbidden:403,NotFound:404,MethodNotAllowed:405,NotAcceptable:406,ProxyAuthenticationRequired:407,RequestTimeout:408,Conflict:409,Gone:410,LengthRequired:411,PreconditionFailed:412,PayloadTooLarge:413,UriTooLong:414,UnsupportedMediaType:415,RangeNotSatisfiable:416,ExpectationFailed:417,ImATeapot:418,MisdirectedRequest:421,UnprocessableEntity:422,Locked:423,FailedDependency:424,TooEarly:425,UpgradeRequired:426,PreconditionRequired:428,TooManyRequests:429,RequestHeaderFieldsTooLarge:431,UnavailableForLegalReasons:451,InternalServerError:500,NotImplemented:501,BadGateway:502,ServiceUnavailable:503,GatewayTimeout:504,HttpVersionNotSupported:505,VariantAlsoNegotiates:506,InsufficientStorage:507,LoopDetected:508,NotExtended:510,NetworkAuthenticationRequired:511};Object.entries(HttpStatusCode).forEach(([e,t])=>{HttpStatusCode[t]=e});var HttpStatusCode$1=HttpStatusCode;function createInstance(t){var e=new Axios$1(t),r=bind(Axios$1.prototype.request,e);return utils.extend(r,Axios$1.prototype,e,{allOwnKeys:!0}),utils.extend(r,e,null,{allOwnKeys:!0}),r.create=function(e){return createInstance(mergeConfig(t,e))},r}const axios=createInstance(defaults$1);axios.Axios=Axios$1,axios.CanceledError=CanceledError,axios.CancelToken=CancelToken$1,axios.isCancel=isCancel,axios.VERSION=VERSION,axios.toFormData=toFormData,axios.AxiosError=AxiosError,axios.Cancel=axios.CanceledError,axios.all=function(e){return Promise.all(e)},axios.spread=spread,axios.isAxiosError=isAxiosError,axios.mergeConfig=mergeConfig,axios.AxiosHeaders=AxiosHeaders$1,axios.formToJSON=e=>formDataToJSON(utils.isHTMLForm(e)?new FormData(e):e),axios.HttpStatusCode=HttpStatusCode$1;var axios$1=axios.default=axios;const sendMsgToFeishu=async({msgType:e="text",token:t="",content:r})=>{let n="post"===e?{msg_type:e,content:{post:{zh_cn:r||{}}}}:"text"===e?{msg_type:e,content:{text:r||""}}:{};return axios$1.post("https://open.feishu.cn/open-apis/bot/v2/hook/"+t,n,{headers:{"Content-Type":"application/json"}})};module.exports=sendMsgToFeishu;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":2}],5:[function(require,module,exports){
// import sendMsgToFeishu from "./bundle";
const sendMsgToFeishu = require('../dist/bundle')

sendMsgToFeishu({
  token: '4d4b3813-c03c-4bcb-a963-2ca5ff9529eb',
  content: 'vconsole test'
})
},{"../dist/bundle":4}]},{},[5]);
