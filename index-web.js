'use strict';

var sassdoc = require('./index.js');

var env = sassdoc.ensureEnvironment({ verbose: true }, function (err) {
  console.error(err);
});

global.parser = new sassdoc.Parser(env);
