TRACEUR = node_modules/traceur/traceur
BROWSERIFY = node_modules/browserify/bin/cmd.js
UGLIFY = node_modules/uglify-js/bin/uglifyjs
JSHINT = node_modules/jshint/bin/jshint
MOCHA = node_modules/mocha/bin/mocha
YAML = node_modules/js-yaml/bin/js-yaml.js

DEVELOP = develop
SASSDOC = bin/sassdoc
SAMPLE = node_modules/sassdoc-theme-default/scss

all: dist lint test

# Publish package to npm
# ======================

#
# See npm/npm#3059.
#
publish: all
	npm publish --tag beta

# Compile ES6 from `src` to ES5 in `dist`
# =======================================

dist: runtime force
	rm -rf $@
	$(TRACEUR) --modules=commonjs --dir src dist

# Compile for web
# ===============

dist-web: dist-web/sassdoc.min.js

dist-web/sassdoc.min.js: dist-web/sassdoc.js
	$(UGLIFY) $< -o $@

#
# Files/modules to ignore for web distribution.
#
BROWSERIFY_FLAGS += -i ./dist/notifier.js
BROWSERIFY_FLAGS += -i ./dist/exclude.js
BROWSERIFY_FLAGS += -i ./dist/cli.js
BROWSERIFY_FLAGS += -i ./dist/recurse.js
BROWSERIFY_FLAGS += -i vinyl-fs
BROWSERIFY_FLAGS += -i glob2base
BROWSERIFY_FLAGS += -i docopt
BROWSERIFY_FLAGS += -i glob
BROWSERIFY_FLAGS += -i js-yaml
BROWSERIFY_FLAGS += -i minimatch
BROWSERIFY_FLAGS += -i mkdirp
BROWSERIFY_FLAGS += -i multipipe
BROWSERIFY_FLAGS += -i rimraf
BROWSERIFY_FLAGS += -i safe-wipe
BROWSERIFY_FLAGS += -i sass-convert
BROWSERIFY_FLAGS += -i sassdoc-theme-default
BROWSERIFY_FLAGS += -i update-notifier
BROWSERIFY_FLAGS += -i through2

#
# Require all annotations.
#
BROWSERIFY_FLAGS += $(addprefix -r ,$(shell find ./dist/annotation/annotations -type f))

dist-web/sassdoc.js: dist force
	mkdir -p $(@D)
	$(BROWSERIFY) index-web.js -o $@ $(BROWSERIFY_FLAGS)

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

# Compile sample input in `develop`
# =================================

compile: develop

develop: force
	$(SASSDOC) $(SAMPLE) $@ -f

force:
