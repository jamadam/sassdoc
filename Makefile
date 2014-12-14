TRACEUR = node_modules/traceur/traceur
JSHINT = node_modules/jshint/bin/jshint
MOCHA = node_modules/mocha/bin/mocha
YAML = node_modules/js-yaml/bin/js-yaml.js

BROWSERIFY = node_modules/browserify/bin/cmd.js
UGLIFY = node_modules/uglify-js/bin/uglifyjs
DEVELOP = develop
SASSDOC = bin/sassdoc
SAMPLE = node_modules/sassdoc-theme-default/scss

all: dist lint test

# Publish package to npm
# @see npm/npm#3059
# =======================

publish: all
	npm publish --tag beta

# Compile ES6 from `src` to ES5 in `dist`
# =======================================

dist: runtime force
	rm -rf $@
	$(TRACEUR) --modules=commonjs --dir src dist

# Copy Traceur runtime locally
# ============================

runtime: bin/traceur-runtime.js

bin/traceur-runtime.js:
	cp node_modules/traceur/bin/traceur-runtime.js $@

# Code quality
# ============

lint: .jshintrc
	$(JSHINT) bin/sassdoc index.js src test

test: force dist
	$(MOCHA) test/annotations/*.test.js
	test/data/dump | diff - test/data/expected.json

.jshintrc: .jshintrc.yaml
	$(YAML) $< > $@

# Compile for web
# ===============
dist-web: dist test force
	$(BROWSERIFY) web-dist/index.js -o web-dist/sassdoc.js -i ./dist/notifier.js -i ./dist/notifier.js -i ./dist/exclude.js -i ./dist/cli.js -i ./dist/recurse.js -i vinyl-fs -i glob2base -i docopt -i glob -i glob2base -i js-yaml -i minimatch -i mkdirp -i multipipe -i rimraf -i safe-wipe -i sass-convert -i sassdoc-theme-default -i update-notifier -i multipipe -i through2 -r ./dist/annotation/annotations/access.js -r ./dist/annotation/annotations/alias.js -r ./dist/annotation/annotations/author.js -r ./dist/annotation/annotations/content.js -r ./dist/annotation/annotations/deprecated.js -r ./dist/annotation/annotations/example.js -r ./dist/annotation/annotations/group.js -r ./dist/annotation/annotations/ignore.js -r ./dist/annotation/annotations/link.js -r ./dist/annotation/annotations/output.js -r ./dist/annotation/annotations/parameter.js -r ./dist/annotation/annotations/property.js -r ./dist/annotation/annotations/require.js -r ./dist/annotation/annotations/return.js -r ./dist/annotation/annotations/see.js -r ./dist/annotation/annotations/since.js -r ./dist/annotation/annotations/throw.js -r ./dist/annotation/annotations/todo.js -r ./dist/annotation/annotations/type.js
	$(UGLIFY) web-dist/sassdoc.js -o web-dist/sassdoc.min.js

# Compile sample input in `develop`
# =================================

compile: develop

develop: force
	$(SASSDOC) $(SAMPLE) $@ -f

force:
