let utils = require('../../utils');
let uniq = require('lodash.uniq');

let reqRegEx = /^\s*(?:\{(.*)\})?\s*(?:(\$?[^\s]+))?\s*(?:\((.*)\))?\s*(?:-?\s*([^<$]*))?\s*(?:<?\s*(.*)\s*>)?$/;

export default function (config) {
  return {
    name: 'require',

    parse(text) {
      let match = reqRegEx.exec(text.trim());

      let obj = {
        type: match[1] || 'function',
        name: match[2],
      };

      obj.external = utils.splitNamespace(obj.name).length > 1;

      if (obj.name.indexOf('$') === 0) {
        obj.type = 'variable';
        obj.name = obj.name.slice(1);
      }

      if (obj.name.indexOf('%') === 0) {
        obj.type = 'placeholder';
        obj.name = obj.name.slice(1);
      }

      if (match[4]) {
        obj.description = match[4].trim();
      }

      if (match[5]) {
        obj.url = match[5];
      }

      return obj;
    },

    autofill(item) {
      let type = item.context.type;

      if (type === 'mixin' || type === 'placeholder' || type === 'function') {
        let handWritten;

        if (item.require) {
          handWritten = {};

          item.require.forEach(reqObj => {
            handWritten[reqObj.type + '-' + reqObj.name] = true;
          });
        }

        // Searching for mixins and functions.
        let mixins = [];
        let functions = [];
        let mixinFunctionRegex = /\s*([\w\d_-]*)\(/g;
        let match;

        while ((match = mixinFunctionRegex.exec(item.context.code))) {
          // Try if this is a mixin or functio.n
          if (compareBefore(item.context.code, '@include', match.index)) {
            if (!isAnnotatedByHand(handWritten, 'mixin', match[1])) {
              mixins.push(match[1]);
            }
          } else {
            if (!isAnnotatedByHand(handWritten, 'function', match[1])) {
              functions.push(match[1]);
            }
          }
        }

        let placeholders = searchForMatches(
          item.context.code,
          /@extend\s+%([^;\s]+)/ig,
          isAnnotatedByHand.bind(null, handWritten, 'mixin')
        );

        let variables = searchForMatches(
          item.context.code,
          /\$([a-z0-9_-]+)/ig,
          isAnnotatedByHand.bind(null, handWritten, 'variable')
        );

        // Create object for each required item.
        mixins = mixins.map(typeNameObject('mixin'));
        functions = functions.map(typeNameObject('function'));
        placeholders = placeholders.map(typeNameObject('placeholder'));
        variables = variables.map(typeNameObject('variable'));

        // Merge all arrays.
        let all = [].concat(mixins, functions, placeholders, variables);

        // Filter empty values.
        all = all.filter(x => x !== undefined);

        // Merge in user supplyed requires if there are any.
        if (item.require && item.require.length > 0) {
          all = all.concat(item.require);
        }

        if (all.length > 0) {
          return all;
        }
      }
    },

    resolve(data) {
      data.forEach(item => {
        if (item.require === undefined) {
          return;
        }

        item.require = item.require.map(req => {
          if (req.external === true) {
            return req;
          }

          let reqItem = data.find(x => x.context.name === req.name);

          if (reqItem === undefined) {
            if (!req.autofill) {
              config.logger.log(
                `Item "${item.context.name}" requires "${req.name}" from type "${req.type}" but this item doesn't exist.`
              );
            }

            return;
          }

          if (!Array.isArray(reqItem.usedBy)) {
            reqItem.usedBy = [];

            reqItem.usedBy.toJSON = function () {
              return reqItem.usedBy.map(item => {
                return {
                  description: item.description,
                  context: item.context,
                };
              });
            };
          }

          reqItem.usedBy.push(item);
          req.item = reqItem;

          return req;
        })
          .filter(x => x !== undefined);

        if (item.require.length > 0) {
          item.require.toJSON = function () {
            return item.require.map(item => {
              let obj = {
                type: item.type,
                name: item.name,
                external: item.external,
              };

              if (item.external) {
                obj.url = item.url;
              } else {
                obj.description = item.description;
                obj.context = item.context;
              }

              return obj;
            });
          };
        }
      });
    },

    alias: ['requires'],
  };
}

function isAnnotatedByHand(handWritten, type, name) {
  if (type && name && handWritten) {
    return handWritten[type + '-' + name];
  }

  return false;
}

function searchForMatches(code, regex, isAnnotatedByHand) {
  let match;
  let matches = [];

  while ((match = regex.exec(code))) {
    if (!isAnnotatedByHand(match[1])) {
      matches.push(match[1]);
    }
  }

  return uniq(matches);
}

function typeNameObject(type) {
  return function (name) {
    if (name.length > 0) {
      return {
        type: type,
        name: name,
        autofill: true,
      };
    }
  };
}

function compareBefore(code, str, index) {
  for (let i = index - str.length, b = 0; i < index; i++) {
    if (code[i] !== str[b]) {
      return false;
    }

    b++;
  }

  return true;
}
