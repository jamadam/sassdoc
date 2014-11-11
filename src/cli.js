/*
Usage: sassdoc <src> <dest> [options]

Arguments:
  <src>   Path to your Sass folder.
  <dest>  Path to the destination folder.

Options:
  -h, --help            Bring help.
  --version             Show version.
  -v, --verbose         Enable verbose mode.
  -i, --interactive     Prompt to remove an existing destination directory.
  -f, --force           Always remove an existing destination directory
                        without asking.
  -c, --config=<path>   Path to JSON/YAML configuration file.
  -t, --theme=<name>    Theme to use.
  --sass-convert        Use if syntax is `.sass`.
  --no-update-notifier  Disable update notifier check.
*/

let fs = require('fs');
let path = require('path');
let docopt = require('fdocopt')();
let pkg = require('../package.json');
let chalk = require('chalk');
let _ = require('lodash');
import * as cfg from './cfg';
import log from './log';
import notifier from './notifier';
//import convert from './convert';

export default (argv=process.argv) => {
  let options = docopt(__filename, {version: pkg.version, argv: argv});
  let logger = log(options['--verbose']);

  // Load raw configuration
  let config = cfg.pre(options['--config'] || undefined, logger);

  // Ensure CLI options
  ensure(config, options, {
    theme: '--theme',
    interactive: '--interactive',
    force: '--force',
    sassConvert: '--sass-convert',
    noUpdateNotifier: '--no-update-notifier',
  });

  // Post process configuration
  cfg.post(config, logger);

  // Run update notifier if not explicitely disabled
  if (!config.noUpdateNotifier) {
    notifier(pkg);
  }

  // Perform a Sass to SCSS syntax convertion
  if (config.sassConvert) {
    //sassdoc = convert(sassdoc);
  }

  console.log(config);
  return;

  sassdoc.documentize(options['<src>'], options['<dest>'], config);
};

/**
 * Ensure that CLI options take precedence over configuration values.
 *
 * For each name/option tuple, if the option is set, override configuration
 * value.
 */
function ensure(config, options, names) {
  Object.keys(names).forEach(k => {
    let v = names[k];

    if (options[v]) {
      config[k] = options[v];
    }
  });
}