/** Shim this for older node versions */
if (typeof Reflect === undefined || typeof Proxy === undefined || typeof Proxy !== "function") {
  console.error('This version of node is not compatible with `jsonpatch-to-mongodb`');
}

/**
 * TODO: Add the new 4.2 Aggregation pipeline
 * */
function toDot(path) {
  return path.replace(/^\//, '').replace(/\//g, '.').replace(/~1/g, '/').replace(/~0/g, '~');
}

//3x faster than cached /^\d+$/.test(str)
function isInteger(str) {
  var i = 0;
  var len = str.length;
  var charCode;
  while (i < len) {
    charCode = str.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) {
      i++;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Deeply clone the object.
 * https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
 * @param  {any} obj value to clone
 * @return {any} cloned obj
 */
function _deepClone(obj) {
  switch (typeof obj) {
    case "object":
      return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
    case "undefined":
      return null; //this is how JSON.stringify behaves for array items
    default:
      return obj; //no need to clone primitives
  }
}

function add(patch) {
  var path = toDot(patch.path),
    parts = path.split('.');

  var positionPart = parts.length > 1 && parts[parts.length - 1];
  var addToEnd = positionPart === '-';
  var key = parts.slice(0, -1).join('.');
  // see `should handle JS dictionary esq objects with alphanumerical keys`
  var $position = (positionPart && isInteger(positionPart) && parseInt(positionPart, 10)) || null;

  if ($position !== null) {
    this.$push = this.$push || {};
    if (this.$push[key] === undefined) {
      this.$push[key] = {
        $each: [patch.value],
        $position: $position
      };
    } else {
      if (this.$push[key] === null || this.$push[key].$position === undefined) {
        throw new Error("Unsupported Operation! can't use add op with mixed positions");
      }
      var posDiff = $position - this.$push[key].$position;
      if (posDiff > this.$push[key].$each.length) {
        throw new Error("Unsupported Operation! can use add op only with contiguous positions");
      }
      this.$push[key].$each.splice(posDiff, 0, patch.value);
      this.$push[key].$position = Math.min($position, this.$push[key].$position);
    }
  } else if(addToEnd) {
    this.$push = this.$push || {};
    if (this.$push[key] === undefined) {
      this.$push[key] = patch.value;
    } else {
      if (this.$push[key] === null || this.$push[key].$each === undefined) {
        this.$push[key] = {
          $each: [this.$push[key]]
        };
      }
      if (this.$push[key].$position !== undefined) {
        throw new Error("Unsupported Operation! can't use add op with mixed positions");
      }
      this.$push[key].$each.push(patch.value);
    }
  } else {
    this.$set = this.$set || {};
    this.$set[toDot(patch.path)] = patch.value;
  }
}

function remove(patch) {
  this.$unset = this.$unset || {};
  this.$unset[toDot(patch.path)] = 1;
}

function replace(patch) {
  this.$set = this.$set || {};
  this.$set[toDot(patch.path)] = patch.value;
}

function createProxy(update) {
  return new Proxy(update, {
    set: function set() {
      Object.defineProperty(update, '$__dirty', {
        value: true
      });
      return Reflect.set.apply(Reflect, arguments);
    }
  });
}

module.exports = function(patches, options) {
  if (!options) options = { updater: function () { return null; } };

  return patches.reduce(function(update, patch) {
    // Pass update as its own method
    var fn = function (fn) { fn.call(update, patch); return update; };

    if (options.updater) {
      var proxy = createProxy(update);
      options.updater.call(proxy, patch);

      // Remove the $__dirty property since we don't want to pass that down
      if (proxy.$__dirty) {
        delete update.$__dirty;
        return _deepClone(update);
      }
    }

    switch(patch.op) {
      case 'add':
        return fn(add);
      case 'remove':
        return fn(remove);
      case 'replace':
        return fn(replace);
      case 'test':
        return update;
      default:
        throw new Error('Unsupported Operation! op = ' + patch.op);
    }
  }, { });
};

// Add this for the helpers
module.exports.toDot = toDot;
