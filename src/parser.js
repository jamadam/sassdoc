var regex = require('./regex');
var utils = require('./utils');

exports = module.exports = {

  /**
   * Define a block of comments
   * @param  {Number} index - index of line where function/mixin starts
   * @param  {Array}  array - file as an array of lines
   * @return {Array}          array of lines
   */
  findCommentBlock: function (index, array) {
    var previousLine = index - 1,
        comments = [];

    // Loop back
    while (previousLine--) {
      // If it's an empty line, break (unless it hasn't started yet)
      if (comments.length > 0 && regex.isEmpty(array[previousLine])) {
        break;
      } 

      // If it's not a comment, break
      if (!regex.isComment(array[previousLine])) {
        break;
      }

      // Push the new comment line
      comments.unshift(array[previousLine]);
    }

    return comments;
  },

  /**
   * Parse a block of comments
   * @param  {Array} comments - array of lines
   * @return {Object}           function/mixin documentation
   */
  parseCommentBlock: function (comments) {
    var line, doc = {
      'parameters': [],
      'throws': [],
      'todos': [],
      'alias': false,
      'aliased': [],
      'links': [],
      'requires': [],
      'description': '',
      'since': false,
      'access': 'public',
      'deprecated': false,
      'author': false,
      'returns': {
        'type': null,
        'description': false
      }
    };

    comments.forEach(function (line, index) {
      line = exports.parseLine(utils.uncomment(line));

      // Separator or @ignore
      if (!line) {
        return false;
      }

      // Array things (@throws, @parameters...)
      if (line.array === true) {
        doc[line.type].push(line.value);
      }

      else if (line.type === 'description') {
        doc[line.type] += line.value;
      }

      // Anything else
      else {
        doc[line.type] = line.value;
      }

    });

    // Remove first carriage return
    doc.description = doc.description.substring(1);

    return doc;
  },

  /**
   * Parse a file
   * @param  {String} content - file content
   * @return {Array}            array of documented functions/mixins
   */
  parseFile: function (content) {
    var array = content.split("\n"),
        tree = [];

    // Looping through the file
    array.forEach(function (line, index) {
      var isCallable = regex.isFunctionOrMixin(line);

      // If it's either a mixin or a function
      if (isCallable) {
        var item = exports.parseCommentBlock(exports.findCommentBlock(index, array));
        item.type = isCallable[1];
        item.name = isCallable[2];

        tree.push(item);
      }
    });

    return tree;
  },

  /**
   * Parse a line to determine what it is
   * @param  {String} line  - line to be parsed
   * @return {Object|false}
   */
  parseLine: function (line) {
    var type, value, i,
        res = { array: false },
        tokens = ['returns', 'parameters', 'deprecated', 'author', 'access', 'throws', 'todo', 'alias', 'link', 'requires', 'since'];

    // Useless line, skip
    if (line.length === 0 
      || regex.isSeparator(line) 
      || regex.isIgnore(line)) {
      return false;
    }

    for (var i = 0; i < tokens.length; i++) {
      value = regex['is' + tokens[i].capitalize()](line);

      if (value !== null) {
        type = tokens[i];
        break;
      }
    }

    res.type = type;

    switch (type) {
      case 'returns':
        res.value = { 'type': value[1].split('|'), 'description': value[2] };
        break;

      case 'parameters':
        res.value = { 'type': value[1], 'name': value[2], 'default': value[3], 'description': value[4] };
        res.array = true;
        break;

      case 'deprecated':
        res.value = value[1] || true;
        break;

      case 'author':
      case 'access':
      case 'alias':
      case 'since':
        res.value = value[1];
        break;

      case 'throws':
      case 'todos':
      case 'requires':
        res.value = value[1];
        res.array = true;
        break;

      case 'link':
        res.value = { 'url': value[1], 'caption': value[2] }
        break;

      case 'description':
      default:
        res.value = '\n' + line;
        res.type = 'description';
    }

    return res;
  }

};
