# jsonpatch-to-mongodb

> This is a fork, fixes some issues with dictionary objects. Possibly may move to try and work w/ 
> the newer 4.2+ aggregation pipeline 

[![build status](https://secure.travis-ci.org/mongodb-js/jsonpatch-to-mongodb.png)](http://travis-ci.org/mongodb-js/jsonpatch-to-mongodb)

Convert [JSON patches](http://jsonpatch.com/) into a MongoDB update.

## Example

```javascript
var toMongodb = require('jsonpatch-to-mongodb');
var patches = [{
  op: 'replace',
  path: '/name',
  value: 'dave'
}];

console.log(toMongodb(patches));
// {'$set': {name: 'dave'}};
```

With help for awkward schemas

> Bellow this would normally return a `$push` operator due to the key's being numerical, but in some
> circumstances we don't want that.

```typescript
var toMongodb = require('jsonpatch-to-mongodb');

interface Schema {
	dictionary: Record<string, Array<any>>
}

var patches = [{
  op: 'add',
  path: '/dictionary/1',
  value: '[]'
}];

console.log(toMongodb<Schema>(patches, {
  updater(patch) {
    if (/^\/dictionary\/[0-9]+/.test(patch.path)) {
      this.$set = this.$set || {};
      this.$set[toMongodb.toDot(patch.path)] = patch.value;
    }
  }
}));
// {'$set': { 'dictionary.1': []}};
```

Example: [with express and mongoose](http://github.com/imlucas/jsonpatch-to-mongodb/tree/master/examples/express)


## Install

```
npm install --save "git@github.com:harrytwright/jsonpatch-to-mongodb#feature/add-custom-paths"
```

## Test

```
npm test
```

## License

MIT
