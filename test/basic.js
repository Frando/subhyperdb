var tape = require('tape')
var ram = require('random-access-memory')
var hyperdb = require('hyperdb')
var sub = require('../')

tape('basic namespacing', function (t) {
  var db = hyperdb(ram, {valueEncoding: 'binary'})
  var sub1 = sub(db, 'sub1', {valueEncoding: 'utf-8'})
  var sub2 = sub(db, {valueEncoding: 'utf-8'})
  sub1.put('hello', 'world', function (err, node) {
    t.same(node.key, 'hello')
    t.same(node.value, 'world')
    t.error(err, 'no error')
    sub1.get('hello', function (err, node) {
      t.error(err, 'no error')
      t.same(node.key, 'hello', 'same key')
      t.same(node.value, 'world', 'same value')
    })
  })

  sub2.put('foo', 'bar', function (err, node) {
    t.same(node.key, 'foo')
    t.same(node.value, 'bar')
    t.error(err, 'no error')
    sub2.get('foo', function (err, node) {
      t.error(err, 'no error')
      t.same(node.key, 'foo', 'same key')
      t.same(node.value, 'bar', 'same value')
      t.end()
    })
  })
})

tape('different value encodings', function (t) {
  var db = hyperdb(ram, {valueEncoding: 'binary'})
  var sub1 = sub(db, {valueEncoding: 'utf-8'})
  var sub2 = sub(db, {valueEncoding: 'json'})

  sub1.put('hello', 'world', function (err, node) {
    t.same(node.key, 'hello')
    t.same(node.value, 'world')
    t.error(err, 'no error')
    sub1.get('hello', function (err, node) {
      t.error(err, 'no error')
      t.same(node.key, 'hello', 'same key')
      t.same(node.value, 'world', 'same value')
    })
  })

  sub2.put('foo', {baz: 'boo'}, function (err, node) {
    t.same(node.key, 'foo')
    t.same(node.value, {baz: 'boo'})
    t.error(err, 'no error')
    sub2.get('foo', function (err, node) {
      t.error(err, 'no error')
      t.same(node.key, 'foo', 'same key')
      t.same(node.value, {baz: 'boo'}, 'same value')
      t.end()
    })
  })
})
