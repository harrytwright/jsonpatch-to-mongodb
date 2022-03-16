let { RE2 } = require('re2-wasm');

function toDot(path) {
  return path.replace(/^\//, '').replace(/\//g, '.').replace(/~1/g, '/').replace(/~0/g, '~');
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

module.exports = function(patches, options) {
  if (!options) options = {};
  var update = {};

  patches.forEach(function(p) {
    var matched = false;

    /**
     * Allow for custom keys to handle any weird issues you have
     * */
    if ('customKeys' in options) {
      options.customKeys.forEach(function (value, key) {
        if (key instanceof RegExp ? new RE2(key, 'u').test(toDot(p.path)): key === toDot(p.path)) {
          try {
            update = value(p, _deepClone(update));
            matched = true;
          } catch (err) { process.emitWarning(err.message); }
        }
      });

      if (matched) return;
    }

    switch(p.op) {
      case 'add':
        var path = toDot(p.path),
          parts = path.split('.');

        var positionPart = parts.length > 1 && parts[parts.length - 1];
        var addToEnd = positionPart === '-';
        var key = parts.slice(0, -1).join('.');
        // see `should handle JS dictionary esq objects with alphanumerical keys`
        var $position = positionPart && isInteger(positionPart) && parseInt(positionPart, 10) || null;

        if ($position !== null) {
          update.$push = update.$push || {};
          if (update.$push[key] === undefined) {
            update.$push[key] = {
              $each: [p.value],
              $position: $position
            };
          } else {
            if (update.$push[key] === null || update.$push[key].$position === undefined) {
              throw new Error("Unsupported Operation! can't use add op with mixed positions");
            }
            var posDiff = $position - update.$push[key].$position;
            if (posDiff > update.$push[key].$each.length) {
              throw new Error("Unsupported Operation! can use add op only with contiguous positions");
            }
            update.$push[key].$each.splice(posDiff, 0, p.value);
            update.$push[key].$position = Math.min($position, update.$push[key].$position);
          }
        } else if(addToEnd) {
          update.$push = update.$push || {};
          if (update.$push[key] === undefined) {
            update.$push[key] = p.value;
          } else {
            if (update.$push[key] === null || update.$push[key].$each === undefined) {
              update.$push[key] = {
                $each: [update.$push[key]]
              };
            }
            if (update.$push[key].$position !== undefined) {
              throw new Error("Unsupported Operation! can't use add op with mixed positions");
            }
            update.$push[key].$each.push(p.value);
          }
        } else {
          update.$set = update.$set || {};
          update.$set[toDot(p.path)] = p.value;
        }
        break;
      case 'remove':
        update.$unset = update.$unset || {};
        update.$unset[toDot(p.path)] = 1;
        break;
      case 'replace':
        update.$set = update.$set || {};
        update.$set[toDot(p.path)] = p.value;
        break;
      case 'test':
        break;
      default:
        throw new Error('Unsupported Operation! op = ' + p.op);
    }
  });

  return update;
};

// Add this for the helpers
module.exports.toDot = toDot;
