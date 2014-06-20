var fs = require('fs');
var swig  = require('swig');
var Utils = new (require('./utils')).utils();
var parser = require('./parser');
var __SELF__ = this;

/**
 * Test if folder exists; if it doesn't, create it
 * @param {string} folder     - folder to be created
 * @param {function} callback - function to be executed once folder is created
 * @return {undefined}
 */
module.exports.createFolder = function (folder, callback) {
  // Test whether destination exists
  fs.exists(folder, function (exists) {
    // If it exists, execute callback
    if (exists && typeof callback === "function") {
      callback();
      return;
    }

    // If it doesn't exist, create it
    fs.mkdir(folder, function () {
      console.log(Utils.getDateTime() + ' :: Folder `' + folder + '` successfully created.');

      if (typeof callback === "function") {
        callback();
      }
    });
  });
};

/**
 * Parse a folder of files
 * @param  {string} source      - folder to be parsed
 * @param  {string} destination - destination folder
 * @return {undefined}
 */
module.exports.parseFolder = function (source, destination, callback) {
  var path;

  // Read folder
  fs.readdir(source, function (err, files) {
    if (err) throw err;

    // Loop through all items from folder
    files.forEach(function (file) {
      path = source + '/' + file;

      // Skip dotfiles
      if (file.charAt(0) === '.') return;

      // If it's a folder, go recursive
      if (fs.lstatSync(path).isDirectory()) {
        __SELF__.parseFolder(path, destination + '/' + file);
      }

      // Else if it's a SCSS file, process it
      else if (Utils.getExtension(file) === "scss") {
        __SELF__.processFile(file, source, destination);
      }

    });
  });
};

/**
 * Write a file using a Swig template
 * @param  {string} destination - destination folder
 * @param  {string} file        - source file name
 * @param  {string} template    - template file
 * @param  {object} data        - data to pass to view
 * @return {undefined}
 */
module.exports.writeFile = function (destination, file, template, data) {
  var dest = (destination + '/' + file).replace('.scss', '.html'),
      tmp = swig.compileFile(__dirname + '/../assets/templates/' + template);

  // Make sure folder exists
  __SELF__.createFolder(destination, function () {
    // Write file
    fs.writeFile(dest, tmp(data), function (err) {
      if (err) throw err;

      // Log success
      console.log(Utils.getDateTime() + ' :: File `' + dest + '` successfully generated.');
    });
  });
};

/**
 * Read, parse then write a file
 * @param  {string} file        - file to be parsed
 * @param  {string} source      - source folder
 * @param  {string} destination - destination folder
 * @return {undefined}
 */
module.exports.processFile = function (file, source, destination) {
  var dest = destination + '/' + file,
      processedData;

  // Parse file
  fs.readFile(source + '/' + file, 'utf-8', function (err, data) {
    if (err) throw err;
    processedData = parser.parseFile(data);

    if (processedData.length === 0) {
      console.log(Utils.getDateTime() + ' :: No function or mixin documented in `' + source + '/' + file + '`. Omitted.');
      return;
    }

    __SELF__.writeFile(destination, file, 'file.html.swig', {
      data: processedData,
      title: dest,
      base_class: 'sassdoc',
      asset_path: Utils.assetPath(destination, 'css/styles.css')
    });

  });
};

/**
 * Copy a file
 * @param  {string} source
 * @param  {string} destination
 * @return {undefined}
 */
module.exports.copyFile = function (source, destination) {
  fs.createReadStream(source).pipe(fs.createWriteStream(destination));
};

/**
 * Copy the CSS file from the assets folder to the dist folder
 * @param  {string} destination - destination folder
 * @return {undefined}
 */
module.exports.copyCSS = function (destination) {
  var cssFolder = destination + '/css';

  // Create CSS folder
  __SELF__.createFolder(cssFolder, function () {
    __SELF__.copyFile('./assets/css/styles.css', cssFolder + '/styles.css');
  });
};

/**
 * Build index page
 * @param  {string} destination - destination folder
 * @param  {array} files        - array of file names
 * @return {undefined}
 */
module.exports.buildIndex = function (destination) {
  var _files = [];

  fs.readdir(destination, function (err, files) {

    files.forEach(function (file) {
      // Skip dotfiles
      if (file.charAt(0) === '.') return;

      // If it's a folder, go recursive
      if (fs.lstatSync(path).isDirectory()) {
        __SELF__.buildIndex(destination + '/' + file);
      }

      // Else if it's a SCSS file, process it
      else if (Utils.getExtension(file) === "scss") {
        _files.push(file);
      }

    });

  });

  // Write index file
  __SELF__.writeFile(destination, 'index.html', 'index.html.swig', {
    files: _files,
    base_class: 'sassdoc',
    asset_path: Utils.assetPath(destination, 'css/styles.css')
  });
};

/**
 * Build index tree
 * Remove dotfiles
 * Replace extensions
 * @param  {array} files - array of file names
 * @return {array}         purged array
 */
module.exports.buildIndexTree = function (files) {
  // Loop over files
  for (var i = 0; i < files.length; i++) {
    // Remove dotfiles
    if (files[i].charAt(0) === '.') {
      files.splice(i, 1);
    }

    // Is a file
    if (files[i].indexOf('.') !== -1) {
      files[i] = files[i].replace('.scss', '.html');
    }

    // Is a folder
    else {
      files[i] += '/index.html';
    }
  }

  return files;
};
