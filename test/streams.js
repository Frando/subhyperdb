var tape = require('tape')
var ram = require('random-access-memory')
var hyperdb = require('hyperdb')
var sub = require('../')

tape('read streams', function (t) {
  var db = hyperdb(ram, {valueEncoding: 'binary'})
  var sub1 = sub(db, 'sub1', {valueEncoding: 'utf-8'})

  var keys = ['hello/world', 'hello/moon', 'hello/star/sun']
  var vals = ['sea', 'sky', 'fire']
  sub1.put(keys[0], vals[0], function () {
    sub1.put(keys[1], vals[1], function () {
      sub1.put(keys[2], vals[2], function () {
        var stream = sub1.createReadStream('hello')
        stream.on('data', function (node) {
          var index = keys.indexOf(node.key)
          t.ok(index !== -1, 'key is expected')
          t.same(node.value, vals[index], 'value matches')
        })
        stream.on('end', function () {
          t.end()
        })
      })
    })
  })
})

tape('write streams', { timeout: 1000 }, function (t) {
  var db = hyperdb(ram, {valueEncoding: 'binary'})
  var sub2 = sub(db, {valueEncoding: 'utf-8'})

  var keys2 = ['hi/world', 'hi/moon', 'hi/star/sun', 'foo/bar']
  var vals2 = ['lake', 'mountain', 'light', 'bazz']

  var ws = sub2.createWriteStream()
  for (var i in keys2) {
    ws.write({key: keys2[i], value: vals2[i], type: 'put'})
  }
  ws.end(function (err) {
    t.error(err, 'no error')
    for (var i in keys2) {
      same(keys2[i], vals2[i])
    }
    t.end()
  })
  function same (key, val) {
    sub2.get(key, function (err, node) {
      t.error(err, 'no error')
      t.same(node.key, key, key + ' key matches')
      t.same(node.value, val, key + ' val matches')
    })
  }
})
