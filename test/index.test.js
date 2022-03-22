var assert = require('assert');
var toMongodb = require('../');
var chai = require('chai');

describe('jsonpatch to mongodb', function() {

  it('should work with single add', function() {
    var patches = [{
      op: 'add',
      path: '/name/-',
      value: 'dave'
    }];

    var expected = {
      $push: {
        name: 'dave'
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should allow add to insert or replace a non-array field', function() {
    var patches = [{
      op: 'add',
      path: '/name/nested',
      value: 'dave'
    }];

    var expected = {
      $set: {
        'name.nested': 'dave'
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with escaped characters', function() {
    var patches = [{
      op: 'replace',
      path: '/foo~1bar~0',
      value: 'dave'
    }];

    var expected = {
      $set: {
        "foo/bar~": 'dave'
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with array set', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: 'dave'
    }];

    var expected = {
      $push: {
        name: {
          $each: [
            'dave'
          ],
          $position: 1
        }
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with multiple set', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: 'dave'
    }, {
      op: 'add',
      path: '/name/2',
      value: 'bob'
    }, {
      op: 'add',
      path: '/name/2',
      value: 'john'
    }];

    var expected = {
      $push: {
        name: {
          $each: [
            'dave',
            'john',
            'bob'
          ],
          $position: 1
        }
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with multiple adds in reverse position', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: 'dave'
    },{
      op: 'add',
      path: '/name/1',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/1',
      value: 'john'
    }];

    var expected = {
      $push: {
        name: {$each: ['john', 'bob', 'dave'], $position: 1}
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with multiple adds', function() {
    var patches = [{
      op: 'add',
      path: '/name/-',
      value: 'dave'
    },{
      op: 'add',
      path: '/name/-',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/-',
      value: 'john'
    }];

    var expected = {
      $push: {
        name: {$each: ['dave', 'bob', 'john']}
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with multiple adds with some null at the end', function() {
    var patches = [{
      op: 'add',
      path: '/name/-',
      value: null
    },{
      op: 'add',
      path: '/name/-',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/-',
      value: null
    }];

    var expected = {
      $push: {
        name: {$each: [null, 'bob', null]}
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with multiple adds with some null and position', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: null
    },{
      op: 'add',
      path: '/name/1',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/1',
      value: null
    }];

    var expected = {
      $push: {
        name: {$each: [null, 'bob', null], $position: 1}
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with remove', function() {
    var patches = [{
      op: 'remove',
      path: '/name',
      value: 'dave'
    }];

    var expected = {
      $unset: {
        name: 1
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with replace', function() {
    var patches = [{
      op: 'replace',
      path: '/name',
      value: 'dave'
    }];

    var expected = {
      $set: {
        name: 'dave'
      }
    };

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('should work with test', function() {
    var patches = [{
      op: 'test',
      path: '/name',
      value: 'dave'
    }];

    var expected = {};

    assert.deepEqual(toMongodb(patches), expected);
  });

  it('blow up on adds with non contiguous positions', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/3',
      value: 'john'
    }];

    chai.expect(function(){toMongodb(patches)}).to.throw("Unsupported Operation! can use add op only with contiguous positions");
  });

  it('blow up on adds with mixed position 1', function() {
    var patches = [{
      op: 'add',
      path: '/name/1',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/-',
      value: 'john'
    }];

    chai.expect(function(){toMongodb(patches)}).to.throw("Unsupported Operation! can't use add op with mixed positions");
  });

  it('blow up on adds with mixed position 2', function() {
    var patches = [{
      op: 'add',
      path: '/name/-',
      value: 'bob'
    },{
      op: 'add',
      path: '/name/1',
      value: 'john'
    }];

    chai.expect(function(){toMongodb(patches)}).to.throw("Unsupported Operation! can't use add op with mixed positions");
  });

  it('should blow up on move', function() {
    var patches = [{
      op: 'move',
      path: '/name',
      from: '/old_name'
    }];

    chai.expect(function(){toMongodb(patches)}).to.throw('Unsupported Operation! op = move');
  });


  it('should blow up on copy', function() {
    var patches = [{
      op: 'copy',
      path: '/name',
      from: '/old_name'
    }];

    chai.expect(function(){toMongodb(patches);}).to.throw('Unsupported Operation! op = copy');
  });

  /**
   * Very weird use case but parseInt will only return NaN if the first non-whitespace character cannot
   * be converted to a number, so if you're using an alphanumerical value it will assume the first digits
   * are the number and discard the rest...
   * */
  it('should handle JS dictionary esq objects with alphanumerical keys', function () {
    var patches = [{
      op: 'add',
      path: '/custom/1234asdb',
      value: []
    }];

    var expected = {
      $set: {
        'custom.1234asdb': []
      }
    };

    chai.expect(toMongodb(patches)).to.be.deep.eq(expected);
  });

  /**
   * In the use case you have a key that might need a weird treatment, i.e maybe set instead of add etc.,
   * but the main code can't fully recognise the structure of the schema you have. i.e A Map with numerical
   * keys, these need to be treated differently to the array, but conext is needed, which is harder to do without
   * an object to check with
   * */
  it('should work w/ custom keys', function () {
    var patches = [{
      op: 'add',
      path: '/custom/1',
      value: []
    }];

    var expected = {
      $set: {
        'custom.1': []
      }
    };

    chai.expect(toMongodb(patches, {
      updater: function (patch) {
        if (/custom\.[0-9]+/i.test(toMongodb.toDot(patch.path))) {
          this.$set = this.$set || {};
          this.$set[toMongodb.toDot(patch.path)] = patch.value;
        }
      }
    })).to.be.deep.eq(expected);
  });

  /**
   * This is a check for an issue where the updater is passed down with the $__dirty
   * value even if it's been deleted, causing any normal operators to not be handled
   * */
  it('should work with complex changes and custom keys', function () {
    var patches = [{
      op: 'add',
      path: '/custom/1',
      value: []
    }, {
      op: 'replace',
      path: '/type',
      value: 'custom'
    }];

    var expected = {
      $set: {
        'custom.1': [],
        'type': 'custom'
      },
    };

    chai.expect(toMongodb(patches, {
      updater: function (patch) {
        if (/custom\.[0-9]+/i.test(toMongodb.toDot(patch.path))) {
          this.$set = this.$set || {};
          this.$set[toMongodb.toDot(patch.path)] = patch.value;
        }
      }
    })).to.be.deep.eq(expected);
  });
});

