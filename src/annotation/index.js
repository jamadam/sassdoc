let path = require('path');

let annotationNames = [
  'access',
  'alias',
  'author',
  'content',
  'deprecated',
  'example',
  'group',
  'ignore',
  'link',
  'output',
  'parameter',
  'property',
  'require',
  'return',
  'see',
  'since',
  'throw',
  'todo',
  'type'
];

export default class AnnotationsApi {
  constructor(config) {
    this.config = config;

    this.list = {
      _: { alias: {} },
    };

    // Read all files from the annoation folder and add it to the annotations map.
    annotationNames.forEach(name => {
      var annotation = require(path.resolve(__dirname, 'annotations', name+'.js')).default;
      this.addAnnotation(name, annotation);
    });
  }

  /**
   * Add a single annotation by name
   * @param {String} name - Name of the annotation
   * @param {Object} annotation - Annotation object
   */
  addAnnotation(name, annotation) {
    annotation = annotation(this.config);

    this.list._.alias[name] = name;

    if (Array.isArray(annotation.alias)) {
      annotation.alias.forEach(aliasName => {
        this.list._.alias[aliasName] = name;
      });
    }

    this.list[name] = annotation;
  }

  /**
   * Add an array of annotations. The name of the annotations must be
   * in the `name` key of the annotation.
   * @param {Array} annotations - Annotation objects
   */
  addAnnotations(annotations) {
    if (annotations !== undefined) {
      annotations.forEach(annotation => {
        this.addAnnotation(annotation.name, annotation);
      });
    }
  }
}
