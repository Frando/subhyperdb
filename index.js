// var hyperdb = require('hyperdb')
var codecs = require('codecs')
var sodium = require('sodium-universal')
var util = require('util')
var bulk = require('bulk-write-stream')
var stream = require('readable-stream')
var events = require('events')

var Transform = stream.Transform

module.exports = SubHyperDB

function SubHyperDB (db, prefix, opts) {
  if (!opts && prefix && typeof prefix === 'object') return SubHyperDB(db, null, prefix)
  if (!(this instanceof SubHyperDB)) return new SubHyperDB(db, prefix, opts)
  var self = this
  opts = opts || {}

  if (prefix && prefix.slice('-1') !== '/') prefix = prefix + '/'
  if (prefix && prefix.slice('1') !== '~') prefix = '~' + prefix
  if (!prefix) prefix = this._createPrefix()

  this.db = db
  this.prefix = prefix

  this._valueEncoding = codecs(opts.valueEncoding || 'binary')

  this.ready = db.ready
  db.on('ready', function () {
    self.localContent = db.localContent
    self.contentFeeds = db.contentFeeds
    self.key = db.key
    self.emit('ready')
  })
}
util.inherits(SubHyperDB, events.EventEmitter)

SubHyperDB.prototype.replicate = function (opts) {
  return this.db.replicate(opts)
}
SubHyperDB.prototype.put = function (key, value, cb) {
  return this.db.put(this._encodeKey(key), this._encodeValue(value), decodeAndReturn(this, cb))
}

SubHyperDB.prototype.get = function (key, opts, cb) {
  if (typeof opts === 'function') return this.get(key, null, opts)
  this.db.get(this._encodeKey(key), opts, decodeAndReturn(this, cb))
}

SubHyperDB.prototype.del = function (key, cb) {
  this.db.del(this._encodeKey(key), decodeAndReturn(this, cb))
}

SubHyperDB.prototype.batch = function (batch, cb) {
  batch.map(this._encodeNode.bind(this))
  this.db.batch(batch, decodeAndReturn(this, cb))
}

SubHyperDB.prototype.list = function (prefix, opts, cb) {
  this.db.list(this._encodeKey(prefix), opts, decodeAndReturn(this, cb))
}

SubHyperDB.prototype.createReadStream = function (prefix, opts) {
  var decoder = decodeAndReturn(this)
  var transform = new Transform({objectMode: true})
  transform._transform = function (nodes, enc, next) {
    this.push(decoder(null, nodes))
    next()
  }
  return this.db.createReadStream(this._encodeKey(prefix), opts).pipe(transform)
}

SubHyperDB.prototype.createWriteStream = function (cb) {
  var self = this
  return bulk.obj(write)

  function write (batch, cb) {
    var flattened = []
    for (var i = 0; i < batch.length; i++) {
      var content = batch[i]
      if (Array.isArray(content)) {
        for (var j = 0; j < content.length; j++) {
          flattened.push(content[j])
        }
      } else {
        flattened.push(content)
      }
    }
    self.batch(flattened, cb)
  }
}

SubHyperDB.prototype._createPrefix = function () {
  var buf = Buffer.alloc(16)
  sodium.randombytes_buf(buf)
  var prefix = buf.toString('hex')
  return '~' + prefix + '/'
}

SubHyperDB.prototype._encodeNode = function (node) {
  if (node.key !== null) node.key = this._encodeKey(node.key)
  if (node.value !== null) node.value = this._encodeValue(node.value)
  return node
}

SubHyperDB.prototype._decodeNode = function (node) {
  if (node.key !== null) node.key = this._decodeKey(node.key)
  if (node.value !== null) node.value = this._decodeValue(node.value)
  return node
}

SubHyperDB.prototype._encodeValue = function (value) {
  return this._valueEncoding.encode(value)
}

SubHyperDB.prototype._decodeValue = function (value) {
  return this._valueEncoding.decode(value)
}

SubHyperDB.prototype._encodeKey = function (key) {
  if (key && key.slice(1) === '/') key = key.substring(1)
  return this.prefix + key
}

SubHyperDB.prototype._decodeKey = function (key) {
  return key.slice(this.prefix.length)
}

function decodeAndReturn (subdb, cb) {
  if (!cb) cb = noop
  return function (err, nodes) {
    if (err || !nodes) return cb(err, nodes)
    if (!Array.isArray(nodes)) return cb(err, subdb._decodeNode(nodes))
    nodes = nodes.map(subdb._decodeNode.bind(subdb))
    nodes = nodes.length === 1 ? nodes[0] : nodes
    cb(err, nodes)
    return nodes
  }
}

function noop () {}
