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

Example: [with express and mongoose](http://github.com/imlucas/jsonpatch-to-mongodb/tree/master/examples/express)


## Install

```
npm install --save jsonpatch-to-mongodb
```

## Test

```
npm test
```

## License

MIT
