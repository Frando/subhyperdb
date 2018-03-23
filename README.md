# SubHyperDB

Split a [HyperDB](https://github.com/mafintosh/hyperdb) into namespaces or sections. Each SubHyperDB may have a different value encoding.

## Usage

``` js
var hyperdb = require('hyperdb')
var sub = require('subhyperdb')

var db = hyperdb('./db', {valueEncoding: 'binary'})

var sub1 = sub(db, 'sub1', {valueEncoding: 'utf8'})
var sub2 = sub(db, {valueEncoding: 'json'})

sub1.put('hello', 'world', function() {
  sub2.put('hello', {where: 'moon'}, function() {
    sub1.get('hello', function(err, node) {
      console.log('sub1: ' + node.value) // world
    })
    sub2.get('hello', function(err, node) {
      console.log('sub2: ' + JSON.stringify(node.value)) // {where: 'moon'}
    })
  })
})

console.log('Prefix for sub1: ' + sub1.prefix) // prefix for sub1 was set manually
console.log('Prefix for sub2: ' + sub2.prefix) // prefix for sub2 was autocreated

```

## API

#### `var subDb = sub(db, [prefix], [opts])`

Create a new sub database.

`db` has to be a hyperdb instance that was created with a `valueEncoding: 'binary'` option.

`prefix` sets the prefix to be used. If not set, a random prefix will be created.

`opts` So far the only option is `valueEncoding`.

Public API is a subset of the HyperDB API. Supported methods are:

`get`, `put`, `del`, `batch`, `list`, `createReadStream`, `createWriteStream`, `replicate`

Support for more methods (e.g. `createDiffStream`, `createHistoryStream`) is TODO.

## License

MIT
